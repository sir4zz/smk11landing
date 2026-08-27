# Deploy Prod — aaPanel — smkn11kabtang.sch.id

Dokumen ini untuk **branch `prod`** (single-domain) di mana **frontend React menyatu dengan Laravel** dan dilayani dari `backend/public` (DocumentRoot aaPanel). Microservice Baileys (`server/`) tetap terpisah — tidak ikut di-merge.

---

## 1. Arsitektur prod

```
smkn11kabtang.sch.id
      |
      v
backend/public  <-- DocumentRoot aaPanel (Apache/Nginx)
  ├─ index.php       (Laravel front controller)
  ├─ index.html      (SPA React hasil `npm run build`)
  ├─ assets/         (JS/CSS hasil Vite)
  ├─ .htaccess       (DirectoryIndex index.php index.html + rewrite ke index.php)
  └─ storage -> ../storage/app/public (symlink upload)

api     =>  https://smkn11kabtang.sch.id/api/*   (Laravel routes/api.php)
storage =>  https://smkn11kabtang.sch.id/storage/* (public disk)
SPA     =>  https://smkn11kabtang.sch.id/*       (fallback ke index.html via routes/web.php)
```

`VITE_API_URL=/` (same-origin) sehingga `fetch('/api/...')` tidak kena CORS dan tidak perlu domain terpisah.

Baileys WhatsApp tetap jalan mandiri di `127.0.0.1:5001` (systemd / PM2), tidak dilayani via domain publik kecuali via `WHATSAPP_SERVICE_URL`.

---

## 2. Persiapan sekali di server aaPanel

### 2.1 Site
- **aaPanel > Website > Add Site**: domain `smkn11kabtang.sch.id` + `www.smkn11kabtang.sch.id`
- **Root** arahkan ke `/www/wwwroot/smk11landing/backend/public`
- **PHP Version** `8.2` atau `8.3` (ext: `pdo_mysql`, `mbstring`, `openssl`, `curl`, `fileinfo`, `gd`)
- **SSL** Let's Encrypt via aaPanel (wajib https untuk prod)

### 2.2 Clone repo (branch prod)
```bash
cd /www/wwwroot
git clone -b prod https://github.com/sir4zz/smk11landing.git smk11landing
cd smk11landing
```

### 2.3 Env
```bash
cp backend/.env.example backend/.env
php backend/artisan key:generate
# Edit backend/.env:
```
```env
APP_NAME="SMKN 11 Kabupaten Tangerang"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://smkn11kabtang.sch.id
FRONTEND_URL=https://smkn11kabtang.sch.id
SANCTUM_STATEFUL_DOMAINS=smkn11kabtang.sch.id,www.smkn11kabtang.sch.id

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=smkn11
DB_USERNAME=smkn11_user
DB_PASSWORD=...

SESSION_DRIVER=database
CACHE_STORE=database
QUEUE_CONNECTION=database

OPENROUTER_API_KEY=...
WHATSAPP_SERVICE_URL=http://127.0.0.1:5001
WHATSAPP_SERVICE_TOKEN=
WHATSAPP_ENABLED=true
```

Frontend `.env` **tidak diperlukan di prod** — `VITE_API_URL` default `/` (same-origin). Jika ingin override, buat file `.env` di root:
```
VITE_API_URL=/
```

### 2.4 Install & build — TANPA Node di server (server low-RAM jangan `npm install`/`npm run build`)

> **Penting:** server aaPanel kamu low-RAM — jangan jalankan `npm install` atau `npm run build` di server, akan kena OOM kill. Build dilakukan **di lokal**, hasilnya (`backend/public/index.html` + `backend/public/assets/`) sudah di-commit ke branch `prod`, jadi di server tinggal `git pull` saja.

**Di lokal (sebelum push):**
```bash
npm install
npm run build:prod      # tsc + vite build -> backend/public/index.html + assets/
git add backend/public/index.html backend/public/assets backend/public/favicon.svg backend/public/icons.svg backend/public/images backend/public/templates
git commit -m "build prod: update frontend"
git push origin prod
```

**Di server — hanya PHP/Composer, tanpa Node:**
```bash
cd backend
composer install --no-dev --optimize-autoloader --no-interaction
php artisan migrate --force
php artisan db:seed --force   # hanya bikin role/permission; tidak overwrite akun prod
php artisan storage:link
php artisan optimize:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

Jika server RAM sangat kecil dan `composer install` juga kena kill, jalankan `composer install --no-dev --optimize-autoloader --no-scripts` atau install vendor di lokal lalu upload via SFTP (tidak disarankan kecuali terpaksa).

### 2.5 Permission
```bash
chown -R www:www /www/wwwroot/smk11landing
chmod -R 755 backend/storage backend/bootstrap/cache
```

### 2.6 Nginx — ganti `dist` ke `backend/public` (single-domain)

Config kamu saat ini masih **split `dist` + Laravel** — `location /` ngarah ke `.../dist` sedangkan build prod baru ada di `backend/public` (`index.html` + `assets/`). Akibatnya nginx tidak menemukan `index.html` baru dan SPA akan 404. Ganti 4 block `location` jadi seperti ini:

**Sebelum (salah untuk branch `prod`):**
```nginx
    # --- 1 DOMAIN: React dist + Laravel ---
    location ^~ /api/ {
        try_files $uri $uri/ /index.php?$query_string;
    }
    location ^~ /sanctum/ {
        try_files $uri $uri/ /index.php?$query_string;
    }
    location ^~ /storage/ {
        alias /www/wwwroot/smkn11kabtang.sch.id/backend/storage/app/public/;
        expires 7d;
        access_log off;
    }
    location / {
        root /www/wwwroot/smkn11kabtang.sch.id/dist;
        try_files $uri $uri/ /index.html;
    }
```

**Sesudah (ganti di aaPanel > Website > smkn11kabtang.sch.id > Config):**
```nginx
    # --- single-domain: React dist sudah menyatu di backend/public ---
    location ^~ /api/ {
        try_files $uri $uri/ /index.php?$query_string;
    }
    location ^~ /sanctum/ {
        try_files $uri $uri/ /index.php?$query_string;
    }
    location ^~ /storage/ {
        # symlink backend/public/storage -> ../storage/app/public
        # alias opsional — try_files akan serve file langsung, fallback ke Laravel jika perlu
        try_files $uri $uri/ /index.php?$query_string;
        expires 7d;
        access_log off;
    }
    location ^~ /assets/ {
        # file Vite hashed — cache forever, jangan lewatkan PHP
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
        try_files $uri =404;
    }
    location / {
        # JANGAN lagi override root ke /dist — root server sudah backend/public
        try_files $uri $uri/ /index.php?$query_string;
    }
```

`root` di baris atas tetap:
```nginx
root /www/wwwroot/smkn11kabtang.sch.id/backend/public;
# jika clone ke /www/wwwroot/smk11landing, sesuaikan jadi:
# root /www/wwwroot/smk11landing/backend/public;
```

Alur: `*.js/css/png` & `/assets/*` → nginx serve langsung → `*.php` → `enable-php-85.conf` → SPA route (`/profil/visi-misi` dll) → nginx `try_files ... /index.php` → Laravel `Route::fallback()` → `public/index.html`. `/api/*` & `/storage/*` tetap ke Laravel.

> Catatan: folder `/www/wwwroot/smkn11kabtang.sch.id/dist` sekarang **nganggur** — boleh dihapus setelah ganti config. `.htaccess` (`DirectoryIndex index.php index.html`) tidak berpengaruh di nginx, fallback ditangani Laravel.

Setelah edit: `nginx -t && nginx -s reload` (atau Save di aaPanel → otomatis reload).

---

## 3. Update / redeploy — TANPA build di server

```bash
cd /www/wwwroot/smk11landing
git pull origin prod

# JANGAN jalankan npm di server (low-RAM = OOM kill).
# Semua perubahan frontend sudah termasuk hasil build di git (backend/public/index.html + assets).

cd backend
composer install --no-dev --optimize-autoloader --no-interaction
php artisan migrate --force
php artisan optimize:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache
# storage:link tidak perlu ulang kecuali hilang
```

Jika hanya perubahan frontend tanpa migrasi baru:
```bash
git pull origin prod
php backend/artisan optimize:clear
php backend/artisan config:cache
```

---

## 4. WhatsApp (Baileys) — tetap terpisah

Tidak digabung ke Laravel; jalankan sebagai service terpisah:

```bash
# PM2
pm2 start server/index.js --name smkn11-wa -- --port 5001
pm2 save
pm2 startup

# atau systemd (lihat scripts/smkn11-wa.service)
sudo cp scripts/smkn11-wa.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now smkn11-wa
```

`backend/.env` harus punya `WHATSAPP_SERVICE_URL=http://127.0.0.1:5001`

---

## 5. Verifikasi

```bash
curl -I https://smkn11kabtang.sch.id/
curl -s https://smkn11kabtang.sch.id/api/spmb | head
curl -s https://smkn11kabtang.sch.id/api/stats | head
# SPA routes harus 200 via fallback:
curl -I https://smkn11kabtang.sch.id/profil/visi-misi
curl -I https://smkn11kabtang.sch.id/bkk/lowongan
```

Browser: buka `https://smkn11kabtang.sch.id/admin/login` — login harus berhasil tanpa CORS error (same-origin `/api`).

---

## 6. Catatan prod cleaning

File berikut **sudah dihapus** dari branch prod karena tidak dibutuhkan:
- `DATA GURU, TU 2026-2027 SMT.1.xlsx`
- `format_penempatan Juli (1).xlsx`
- `guru-akun-login.xlsx`
- `akun_test.txt`
- `artisan` & `artisan.cmd` di root (gunakan `php backend/artisan`)

Upload user (`backend/storage/app/public/*`) dan Baileys session (`storage/wa-session/`) tetap di-ignore git dan tidak ter-commit.

---

## 7. Sinkron main → prod (perubahan kedepan)

`prod` adalah branch deploy (single-domain) yang **divergen** dari `main`. File prod-only: `vite.config.ts` (outDir `backend/public`), `backend/routes/web.php` (fallback + `/health`), `backend/.env.example` (`smkn11kabtang.sch.id`), `DEPLOY_AAPANEL.md`, `scripts/build-prod.mjs`/`sync-prod.sh`, dan `backend/database/seeders/DatabaseSeeder.php` (`seedProductionAdmin`). Jangan edit file itu di `main` lalu timpa di `prod` tanpa resolve.

### Cara merge (di lokal, BUKAN di server low-RAM)

```bash
# 1. Update
git fetch origin

# 2. Sync otomatis (merge + hapus file non-prod + rebuild prod)
./scripts/sync-prod.sh
# kalau conflict: ikuti petunjuk di script, resolve pertahankan versi prod untuk file di atas

# 3. Push
git push origin prod

# 4. Deploy di aaPanel (tanpa npm)
# SSH ke server:
cd /www/wwwroot/smkn11kabtang.sch.id
git pull origin prod
php backend/artisan migrate --force
php backend/artisan db:seed --force   # akan buat admin@smkn11kabtang.sch.id jika belum ada (idempotent)
php backend/artisan optimize:clear; php backend/artisan config:cache; php backend/artisan route:cache
```

### Manual (tanpa script)

```bash
git checkout prod
git merge --no-ff origin/main --no-edit
# conflict di vite.config.ts / web.php / .gitignore → pilih versi prod (ours)
# git checkout --ours -- vite.config.ts backend/routes/web.php
# git add vite.config.ts backend/routes/web.php

# hapus duplikat dari main yang memang tidak ada di prod:
git rm -f artisan artisan.cmd "DATA GURU, TU 2026-2027 SMT.1.xlsx" "format_penempatan Juli (1).xlsx" guru-akun-login.xlsx akun_test.txt 2>/dev/null || true

npm run build:prod
git add backend/public/index.html backend/public/assets backend/public/favicon.svg backend/public/icons.svg backend/public/images backend/public/templates
git commit -m "sync main -> prod + build"
git push origin prod
```

> `origin/main` sudah merge ke prod terakhir di commit `5837587` ke belakang. Next sync akan bawa commit `5837587` (fix profil tendik) dan seterusnya. Folder `dist` tidak lagi dipakai — build prod ke `backend/public`.
