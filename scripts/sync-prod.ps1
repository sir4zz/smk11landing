# sync-prod.ps1 — bawa perubahan main -> prod (single-domain) + rebuild frontend
# Pakai: .\scripts\sync-prod.ps1  (atau: powershell -ExecutionPolicy Bypass -File .\scripts\sync-prod.ps1)
# Prasyarat: branch prod sudah ada, main sudah fetch, node sudah terinstall di lokal
$ErrorActionPreference = 'Stop'

$ROOT = Split-Path -Parent $PSScriptRoot
Set-Location $ROOT

Write-Host "== sync-prod: main -> prod =="
Write-Host "Fetch origin..."
& git fetch origin
if ($LASTEXITCODE -ne 0) { throw "git fetch origin gagal." }

$cur = (& git branch --show-current) -join '' | ForEach-Object { $_.Trim() }
if ($cur -ne 'prod') {
  Write-Host "Checkout prod..."
  & git checkout prod
  if ($LASTEXITCODE -ne 0) { throw "git checkout prod gagal." }
}

Write-Host "Merge origin/main ke prod (no-ff)..."
& git merge --no-ff origin/main --no-edit
if ($LASTEXITCODE -ne 0) {
  Write-Host ""
  Write-Host "!! CONFLICT terdeteksi !!"
  Write-Host "   - Untuk file prod-only, pertahankan versi prod:"
  Write-Host "     vite.config.ts, backend/routes/web.php, backend/.env.example, .env.example,"
  Write-Host "     .gitignore, backend/.gitignore, backend/public/.htaccess, DEPLOY_AAPANEL.md"
  Write-Host "   - Untuk artisan di root (dihapus di prod): hapus lagi jika muncul:"
  Write-Host "     git rm -f artisan artisan.cmd; if (`$LASTEXITCODE -ne 0) { Remove-Item -Force artisan, artisan.cmd -ErrorAction SilentlyContinue }"
  Write-Host "   - Untuk *.xlsx / akun_test.txt yang terhapus di prod, jangan balikin:"
  Write-Host "     git rm -f 'DATA GURU, TU 2026-2027 SMT.1.xlsx' 'format_penempatan Juli (1).xlsx' guru-akun-login.xlsx akun_test.txt"
  Write-Host "   Setelah resolve: git add -A && git commit --no-edit && lanjut ke build"
  exit 1
}

# Bersihkan file yang memang tidak ada di prod tapi ada di main
if ((Test-Path 'artisan') -and (Test-Path 'backend/artisan')) {
  Write-Host "Hapus artisan root (duplikat prod)..."
  & git rm -f artisan artisan.cmd 2>$null
  if ($LASTEXITCODE -ne 0) {
    Remove-Item -Force artisan, artisan.cmd -ErrorAction SilentlyContinue
  }
  & git commit -m "sync prod: hapus artisan root duplikat dari main" 2>$null
}

$nonProdFiles = @(
  'DATA GURU, TU 2026-2027 SMT.1.xlsx',
  'format_penempatan Juli (1).xlsx',
  'guru-akun-login.xlsx',
  'akun_test.txt'
)
foreach ($f in $nonProdFiles) {
  if (Test-Path -LiteralPath $f) {
    Write-Host "Hapus $f (tidak perlu di prod)..."
    & git rm -f -- $f 2>$null
    if ($LASTEXITCODE -ne 0) {
      Remove-Item -Force -LiteralPath $f -ErrorAction SilentlyContinue
    }
  }
}
& git diff --cached --quiet
if ($LASTEXITCODE -ne 0) {
  & git commit -m "sync prod: hapus file non-prod dari main" 2>$null
}

Write-Host ""
Write-Host "Rebuild frontend prod (lokal, bukan di server low-RAM)..."
& npm run build:prod
if ($LASTEXITCODE -ne 0) { throw "npm run build:prod gagal." }

Write-Host "Stage build output (backend/public/index.html + assets)..."
$buildPaths = @(
  'backend/public/index.html',
  'backend/public/assets',
  'backend/public/favicon.svg',
  'backend/public/icons.svg',
  'backend/public/images',
  'backend/public/templates'
)
$existingBuildPaths = $buildPaths | Where-Object { Test-Path $_ }
if ($existingBuildPaths.Count -gt 0) {
  & git add -- $existingBuildPaths
}

& git diff --cached --quiet
if ($LASTEXITCODE -ne 0) {
  & git commit -m "build prod: update frontend setelah sync main"
  if ($LASTEXITCODE -ne 0) { throw "git commit build gagal." }
} else {
  Write-Host "(tidak ada perubahan build)"
}

Write-Host ""
Write-Host "== SELESAI =="
Write-Host "Cek: git log --oneline --graph --all | Select-Object -First 20"
Write-Host "Push: git push origin prod"
Write-Host "Lalu di server aaPanel: git pull origin prod && php backend/artisan migrate --force && php backend/artisan optimize:clear && php backend/artisan config:cache"
