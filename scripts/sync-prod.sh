#!/usr/bin/env bash
# sync-prod.sh — bawa perubahan main -> prod (single-domain) + rebuild frontend
# Pakai: ./scripts/sync-prod.sh
# Prasyarat: branch prod sudah ada, main sudah fetch, node sudah terinstall di lokal
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "== sync-prod: main -> prod =="
echo "Fetch origin..."
git fetch origin

cur=$(git branch --show-current)
if [[ "$cur" != "prod" ]]; then
  echo "Checkout prod..."
  git checkout prod
fi

echo "Merge origin/main ke prod (no-ff)..."
# --no-edit biar commit message auto
if ! git merge --no-ff origin/main --no-edit; then
  echo ""
  echo "!! CONFLICT terdeteksi !!"
  echo "   - Untuk file prod-only, pertahankan versi prod:"
  echo "     vite.config.ts, backend/routes/web.php, backend/.env.example, .env.example,"
  echo "     .gitignore, backend/.gitignore, backend/public/.htaccess, DEPLOY_AAPANEL.md"
  echo "   - Untuk artisan di root (dihapus di prod): hapus lagi jika muncul:"
  echo "     git rm -f artisan artisan.cmd 2>/dev/null || rm -f artisan artisan.cmd"
  echo "   - Untuk *.xlsx / akun_test.txt yang terhapus di prod, jangan balikin:"
  echo "     git rm -f 'DATA GURU, TU 2026-2027 SMT.1.xlsx' 'format_penempatan Juli (1).xlsx' guru-akun-login.xlsx akun_test.txt 2>/dev/null || true"
  echo "   Setelah resolve: git add -A && git commit --no-edit && lanjut ke build"
  exit 1
fi

# Bersihkan file yang memang tidak ada di prod tapi ada di main
if [[ -f artisan ]] && [[ -f backend/artisan ]]; then
  echo "Hapus artisan root (duplikat prod)..."
  git rm -f artisan artisan.cmd 2>/dev/null || rm -f artisan artisan.cmd
  git commit -m "sync prod: hapus artisan root duplikat dari main" 2>/dev/null || true
fi
for f in "DATA GURU, TU 2026-2027 SMT.1.xlsx" "format_penempatan Juli (1).xlsx" guru-akun-login.xlsx akun_test.txt; do
  if [[ -f "$f" ]]; then
    echo "Hapus $f (tidak perlu di prod)..."
    git rm -f "$f" 2>/dev/null || rm -f "$f"
  fi
done
if ! git diff --cached --quiet; then
  git commit -m "sync prod: hapus file non-prod dari main" 2>/dev/null || true
fi

echo ""
echo "Rebuild frontend prod (lokal, bukan di server low-RAM)..."
npm run build:prod

echo "Stage build output (backend/public/index.html + assets)..."
git add backend/public/index.html backend/public/assets backend/public/favicon.svg backend/public/icons.svg backend/public/images backend/public/templates 2>/dev/null || true

if ! git diff --cached --quiet; then
  git commit -m "build prod: update frontend setelah sync main"
else
  echo "(tidak ada perubahan build)"
fi

echo ""
echo "== SELESAI =="
echo "Cek: git log --oneline --graph --all | head -n 20"
echo "Push: git push origin prod"
echo "Lalu di server aaPanel: git pull origin prod && php backend/artisan migrate --force && php backend/artisan optimize:clear && php backend/artisan config:cache"
