import express from "express";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  default as makeWASocket,
  useMultiFileAuthState as createAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import QRCode from "qrcode-terminal";
import pino from "pino";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PORT = Number(process.env.WA_PORT || 5001);
const AUTH_DIR = process.env.WA_AUTH_DIR || path.join(__dirname, "..", "storage", "wa-session");
const API_TOKEN = process.env.WA_TOKEN || "";

let sock = null;
let connected = false;
let currentQr = null;

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

async function startWhatsApp() {
  const { state, saveCreds } = await createAuthState(AUTH_DIR);
  const { version } = await fetchLatestBaileysVersion();

  sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    logger,
    browser: ["SMKN11-WA", "Chrome", "1.0.0"],
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      currentQr = qr;
      console.log("\nScan QR ini dengan WhatsApp (Perangkat Tertaut):\n");
      QRCode.generate(qr, { small: true });
    }

    if (connection === "open") {
      connected = true;
      currentQr = null;
      console.log("[WA] Terhubung ke WhatsApp.");
    }

    if (connection === "close") {
      connected = false;
      const code = new Boom(lastDisconnect?.error)?.output?.statusCode;
      if (code === DisconnectReason.loggedOut) {
        console.log("[WA] Sesi logout. Hapus folder storage/wa-session lalu restart untuk scan ulang.");
        return;
      }
      console.log(`[WA] Terputus (code=${code}), menyambung ulang dalam 5 detik...`);
      setTimeout(startWhatsApp, 5000);
    }
  });
}

const app = express();
app.use(cors());
app.use(express.json());

app.get("/status", (_req, res) => {
  res.json({ ok: true, connected, hasQr: !!currentQr });
});

app.get("/qr", (_req, res) => {
  if (connected) return res.json({ ok: true, connected: true, qr: null });
  if (!currentQr) return res.status(503).json({ ok: false, error: "QR belum tersedia, coba lagi." });
  res.json({ ok: true, connected: false, qr: currentQr });
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
  startWhatsApp().catch((err) => {
    console.error("[WA] Gagal start:", err);
    process.exit(1);
  });
});
