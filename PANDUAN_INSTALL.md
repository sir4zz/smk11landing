# Panduan Install & Menjalankan Proyek SMKN 11 Website

Dokumen ini untuk menjalankan proyek **lokal** (Laravel + MySQL + React/Vite) dari hasil `git clone`.

## 1. Prasyarat

Install dulu di komputer:

- **Git** — untuk clone.
- **PHP ^8.2** dengan ekstensi: `pdo_mysql`, `mbstring`, `openssl`, `curl`, `fileinfo`.
- **Composer** — manajer dependency PHP.
- **Node.js 18+** — untuk frontend (React/Vite).
- **MySQL** — disarankan **XAMPP** (MySQL aktif). Database: `smkn11`, user `root`, tanpa password.

Cek prasyarat:

```bash
php -v            # >= 8.2
composer --version
node -v
npm -v
```

## 2. Clone proyek

```bash
git clone https://github.com/sir4zz/smk11landing.git
cd smk11landing
```

> Catatan: file `.env` dan `backend/.env` **tidak ikut ter-commit** (di-gitignore), jadi harus dibuat manual di langkah 4.

## 3. Install dependency

Frontend (dari folder root):

```bash
npm install
```

Backend:

```bash
cd backend
composer install
cd ..
```

## 4. Buat file environment (.env)

**Frontend** — buat file `.env` di root:

```
VITE_API_URL=http://localhost:8000
```

**Backend** — salin `backend/.env.example` menjadi `backend/.env`, lalu:

```bash
cd backend
copy .env.example .env
php artisan key:generate
cd ..
```

Setelah itu pastikan isi `backend/.env` bagian database sesuai MySQL lokal:

```dotenv
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=smkn11
DB_USERNAME=root
DB_PASSWORD=
```

Opsional — fitur AI Mading (`MadingAiService`) butuh key OpenRouter. Isi jika mau fitur AI aktif:

```dotenv
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxx
```

Kosongkan jika tidak perlu fitur AI (fitur lain tetap jalan).

## 5. Setup database (MySQL)

1. **Start MySQL** — dari XAMPP Control Panel klik *Start* pada MySQL.
2. **Buat database** `smkn11`:

   ```bash
   mysql -u root -e "CREATE DATABASE IF NOT EXISTS smkn11 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
   ```

   (Atau lewat phpMyAdmin: *New* → nama `smkn11`, collation `utf8mb4_unicode_ci`.)

3. **Jalankan migrasi + seeder** (membuat semua tabel + role/permission + akun test):

   ```bash
   cd backend
   php artisan migrate
   php artisan db:seed
   php artisan storage:link
   cd ..
   ```

`php artisan db:seed` membuat akun test jika `APP_ENV=local`. Pada production, seeder tidak membuat akun demo atau mengganti password akun yang sudah ada:

| Role   | Email / Identitas              | Password     |
| ------ | ------------------------------ | ------------ |
| Admin  | `admin.test@smkn11.sch.id`     | `smkn11admin` |
| Guru   | `guru.test@smkn11.sch.id`      | `smkn11guru` |
| OSIS   | `osis.test@smkn11.sch.id`      | `smkn11osis` |
| Siswa  | NISN `1234567890` (login Mading) | PIN `smkn11student` |

## 6. Jalankan aplikasi

Dari folder root:

```bash
npm run dev
```

Perintah ini otomatis menjalankan dua hal:

- Backend Laravel di `http://127.0.0.1:8000`
- Frontend Vite di `http://localhost:5173`

Buka di browser:

- Website: `http://localhost:5173`
- Login admin/guru/OSIS: `http://localhost:5173/admin/login`
- Login siswa (Mading): `http://localhost:5173/mading/login`

## 7. Verifikasi & build produksi

```bash
npm run build
cd backend
php artisan test
cd ..
```

## 8. Restore Backup via CLI

Restore melalui CLI berguna jika upload dari halaman admin terkena batas
`POST`, `post_max_size`, atau `upload_max_filesize` PHP.

### 8.1 Salin file backup

Salin file `.zip` ke folder berikut:

```text
backend/storage/app/private/backups/
```

Contoh:

```text
backend/storage/app/private/backups/smkn11-full-20260820-030201-huc0.zip
```

Di Windows/XAMPP, lokasinya biasanya:

```text
C:\xampp\htdocs\smk11landing\backend\storage\app\private\backups\
```

### 8.2 Periksa konfigurasi database

Pastikan `backend/.env` menunjuk ke database tujuan:

```dotenv
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=smkn11
DB_USERNAME=root
DB_PASSWORD=
```

Pastikan MySQL sudah aktif sebelum menjalankan restore.

Sudah bisa dilakukan di web langsung
### 8.3 Jalankan restore

Dari folder `backend`, buka Laravel Tinker:

```bash
php artisan tinker
```

Jalankan perintah berikut di dalam Tinker. Ganti nama file sesuai backup:

```php
app(\App\Services\DatabaseBackupService::class)->restore(
    storage_path('app/private/backups/smkn11-full-20260820-030201-huc0.zip')
);
```

Jika berhasil, hasilnya akan berisi status `success`, jumlah tabel yang
dipulihkan, dan daftar tabel yang dipertahankan.

Keluar dari Tinker:

```php
exit
```

Bersihkan cache Laravel setelah restore:

```bash
php artisan optimize:clear
php artisan storage:link
```

### 8.4 Tabel akun yang dipertahankan

Restore tidak menimpa tabel akun lokal berikut:

- `users`
- `profiles`
- `gurus`
- `osis_accounts`
- `student_accounts`

Sebelum restore, sistem membuat snapshot tabel-tabel tersebut dan
mengembalikannya kembali setelah proses SQL selesai. Jadi akun dan password
lokal tetap dipertahankan meskipun backup berasal dari komputer lain.

Dengan demikian akun admin lokal tetap dapat digunakan:

```text
Email: admin.test@smkn11.sch.id
Password: smkn11admin
```

Tabel konten lain dan media tetap dipulihkan dari backup. Proses restore dapat
mengganti data yang ada, jadi pastikan file backup yang digunakan benar.

## Catatan penting

- **Jangan commit `.env`** atau `backend/.env` (berisi kunci rahasia).
- Proyek lokal memakai **MySQL**. File `init_schema.sql`, `temp_seed.sql`, dan folder `migrations/` di root adalah untuk deployment PostgreSQL/Supabase (InsForge) — **tidak dipakai** untuk jalur lokal.
- Setelah migrate (tanpa data), tabel konten (berita, program, dsb.) kosong. Frontend akan menampilkan data statis cadangan dari `src/data/*`; admin bisa menambah konten lewat panel `http://localhost:5173/admin`.
