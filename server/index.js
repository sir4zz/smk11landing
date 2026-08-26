import express from "express";
import cors from "cors";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import {
  default as makeWASocket,
  useMultiFileAuthState as createAuthState,
  fetchLatestBaileysVersion,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import pino from "pino";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PORT = Number(process.env.WA_PORT || 5001);
const AUTH_DIR = process.env.WA_AUTH_DIR || path.join(__dirname, "..", "storage", "wa-session");
const API_TOKEN = process.env.WA_TOKEN || "";
const RECONNECT_BASE_MS = 3000;
const RECONNECT_MAX_MS = 60000;

let sock = null;
let connected = false;
let connectedAs = null;
let currentQr = null;
let starting = false;
let retryCount = 0;
let cachedVersion = null;

const logger = pino({ level: "silent" });

function requireToken(req, res, next) {
  if (!API_TOKEN) return next();
  if (req.headers["x-wa-token"] !== API_TOKEN) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }
  next();
}

function normalizeJid(phone) {
  let digits = String(phone).replace(/\D/g, "");
  if (digits.startsWith("0")) digits = `62${digits.slice(1)}`;
  if (digits.startsWith("8")) digits = `62${digits}`;
  if (digits.startsWith("62")) return `${digits}@s.whatsapp.net`;
  return null;
}

function hasSession() {
  try {
    return fs.existsSync(path.join(AUTH_DIR, "creds.json"));
  } catch {
    return false;
  }
}

async function startWhatsApp() {
  if (starting || connected) return;
  starting = true;

  try {
    const { state, saveCreds } = await createAuthState(AUTH_DIR);
    if (!cachedVersion) {
      cachedVersion = (await fetchLatestBaileysVersion()).version;
    }

    sock = makeWASocket({
      version: cachedVersion,
      auth: state,
      printQRInTerminal: false,
      logger,
      browser: ["SMKN11-WA", "Chrome", "1.0.0"],
      keepAliveIntervalMs: 30000,
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", ({ connection, lastDisconnect, qr }) => {
      if (qr) currentQr = qr;

      if (connection === "open") {
        connected = true;
        connectedAs = sock.user?.id?.split(":")[0] ?? null;
        currentQr = null;
        retryCount = 0;
        console.log(`[WA] Terhubung ke WhatsApp${connectedAs ? ` sebagai ${connectedAs}` : ""}.`);
      }

      if (connection === "close") {
        connected = false;
        connectedAs = null;
        // Socket & QR lama tidak berlaku lagi — wajib dibuang agar
        // reconnect benar-benar membuat koneksi baru.
        try {
          sock?.end(undefined);
        } catch {
          // abaikan
        }
        sock = null;
        currentQr = null;

        // Backoff eksponensial: 3s, 6s, 12s, ... maks 60s. Tidak menyerah —
        // koneksi 408/515 biasanya berhasil pada percobaan berikutnya.
        const delay = Math.min(RECONNECT_BASE_MS * 2 ** retryCount, RECONNECT_MAX_MS);
        retryCount += 1;
        const code = new Boom(lastDisconnect?.error)?.output?.statusCode;
        console.log(`[WA] Terputus (code=${code}), menyambung ulang dalam ${Math.round(delay / 1000)} detik...`);
        setTimeout(() => {
          startWhatsApp().catch((err) => console.error("[WA] Gagal reconnect:", err.message));
        }, delay);
      }
    });
  } finally {
    starting = false;
  }
}

const app = express();
app.use(cors());
app.use(express.json());

app.get("/status", (_req, res) => {
  res.json({
    ok: true,
    connected,
    connectedAs,
    hasQr: !!currentQr,
    started: !!(sock || starting),
  });
});

app.get("/qr", async (_req, res) => {
  if (connected) return res.json({ ok: true, connected: true, qr: null });

  if (!sock && !starting) {
    return res.status(409).json({ ok: false, error: "Belum dimulai. Klik pairing untuk memulai.", started: false });
  }

  // Handshake WhatsApp butuh beberapa detik sebelum QR pertama tersedia;
  // tunggu agar polling dari admin tidak kena error "belum tersedia".
  const deadline = Date.now() + 8000;
  while (!currentQr && !connected && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  if (connected) return res.json({ ok: true, connected: true, qr: null });
  res.json({ ok: true, connected: false, qr: currentQr });
});

app.post("/start", requireToken, async (_req, res) => {
  if (connected) return res.json({ ok: true, connected: true });
  try {
    await startWhatsApp();
  } catch (err) {
    return res.status(500).json({ ok: false, error: `Gagal memulai: ${err.message}` });
  }
  res.json({ ok: true, connected });
});

app.post("/logout", requireToken, async (_req, res) => {
  if (!sock) return res.status(503).json({ ok: false, error: "Service belum siap." });

  try {
    await sock.logout();
  } catch {
    // Sesi mungkin sudah tidak valid; tetap bersihkan.
  }

  try {
    sock.ev.removeAllListeners();
    sock.end(undefined);
  } catch {
    // abaikan
  }

  sock = null;
  connected = false;
  connectedAs = null;
  currentQr = null;
  retryCount = 0;

  fs.rmSync(AUTH_DIR, { recursive: true, force: true });
  console.log("[WA] Session dihapus.");

  res.json({ ok: true });
});

app.post("/send", requireToken, async (req, res) => {
  const { to, message } = req.body || {};

  if (!to || !message) {
    return res.status(422).json({ ok: false, error: "Field 'to' dan 'message' wajib diisi." });
  }

  const jid = normalizeJid(to);
  if (!jid) {
    return res.status(422).json({ ok: false, error: `Nomor tidak valid: ${to}` });
  }

  if (!connected || !sock) {
    return res.status(503).json({ ok: false, error: "Belum terhubung ke WhatsApp. Scan QR dulu." });
  }

  try {
    const [exists] = await sock.onWhatsApp(jid);
    if (!exists?.exists) {
      return res.status(422).json({ ok: false, error: `Nomor tidak terdaftar di WhatsApp: ${to}` });
    }

    const result = await sock.sendMessage(jid, { text: message });
    return res.json({ ok: true, id: result?.key?.id ?? null });
  } catch (err) {
    console.error("[WA] Gagal mengirim pesan:", err.message);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`[WA] WhatsApp service berjalan di http://127.0.0.1:${PORT}`);

  if (hasSession()) {
    console.log("[WA] Session ditemukan, menyambungkan ke WhatsApp...");
    startWhatsApp().catch((err) => console.error("[WA] Gagal start:", err.message));
  } else {
    console.log("[WA] Belum ada session. Pairing dari menu admin WhatsApp untuk memulai.");
  }
});
