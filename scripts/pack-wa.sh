#!/usr/bin/env bash
# pack-wa.sh — pack Baileys (server/) + node_modules tanpa harus npm install di server low-RAM
# Hasil: /tmp/smkn11-wa.tar.gz yang tinggal upload + extract di aaPanel
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
OUT="/tmp/smkn11-wa.tar.gz"
STAMP=$(date +%Y%m%d-%H%M)

echo "== pack-wa: siapkan archive untuk server low-RAM =="
echo "Root: $ROOT"
echo "Output: $OUT"

# 1. Pastikan build prod sudah? Tidak wajib untuk WA, tapi cek node
if ! command -v node >/dev/null; then echo "node tidak ditemukan"; exit 1; fi
echo "node $(node -v) | npm $(npm -v)"

# 2. Pastikan deps WA ada (local sudah npm install kan?)
if [[ ! -d node_modules/@whiskeysockets/baileys ]]; then
  echo "node_modules/@whiskeysockets/baileys tidak ada — jalankan: npm install"
  exit 1
fi

# 3. Pack hanya yang dibutuhkan server (biar kecil) — tanpa vite/typescript/oxlint/react
#    Kita pakai tar dengan exclude dev-only yang besar
echo "Packing... (ini makan waktu, tunggu)"
tar -czf "$OUT" \
  --exclude='node_modules/.cache' \
  --exclude='node_modules/.bin' \
  --exclude='node_modules/vite' \
  --exclude='node_modules/@vitejs' \
  --exclude='node_modules/typescript' \
  --exclude='node_modules/oxlint' \
  --exclude='node_modules/@types' \
  -C "$ROOT" \
  package.json \
  server/index.js \
  server/schema.sql \
  scripts/smkn11-wa.service \
  node_modules

SIZE=$(du -h "$OUT" | cut -f1)
echo ""
echo "== SELESAI =="
echo "Archive: $OUT ($SIZE)"
echo "Isi: package.json + server/ + scripts/smkn11-wa.service + node_modules (prod+dev filtered)"
echo ""
echo "Upload ke server aaPanel:"
echo "  scp $OUT root@IP:/www/wwwroot/smkn11kabtang.sch.id/"
echo "  # atau via aaPanel > Files > Upload"
echo ""
echo "Di server (TANPA npm install):"
echo "  cd /www/wwwroot/smkn11kabtang.sch.id"
echo "  tar -xzf $(basename "$OUT")"
echo "  mkdir -p storage/wa-session && chown -R www:www storage"
echo "  # edit .env backend: WHATSAPP_SERVICE_URL=http://127.0.0.1:5001"
echo "  pm2 start server/index.js --name smkn11-wa --update-env -- --port 5001"
echo "  # atau systemd: sudo cp scripts/smkn11-wa.service /etc/systemd/system/ && edit WorkingDirectory/User lalu enable"
