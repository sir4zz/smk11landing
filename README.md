# SMKN 11 Website

Website resmi SMKN 11 Kabupaten Tangerang.

- **Frontend:** React + TypeScript + Vite
- **Backend:** Laravel 12 + MySQL (autentikasi sesi Sanctum, RBAC, Storage)
- **Admin Panel:** `/admin` dengan role Admin, Guru, dan OSIS
- **Mading:** publikasi karya siswa dengan workflow review + AI Content Assistant

## Prasyarat

- PHP ^8.2 (ekstensi: `pdo_mysql`, `mbstring`, `openssl`, `curl`, `fileinfo`)
- Composer
- Node.js 18+
- MySQL (mis. XAMPP) — database `smkn11`, user `root`, tanpa password

## Setup lokal

1. Install dependency:

   ```bash
   npm install
   cd backend
   composer install
   cd ..
   ```

2. Buat file `.env` di root:

   ```
   VITE_API_URL=http://localhost:8000
   ```

3. Buat `backend/.env` dari template, lalu generate key:

   ```bash
   cd backend
   copy .env.example .env
   php artisan key:generate
   cd ..
   ```

   Pastikan konfigurasi database di `backend/.env` sesuai MySQL lokal:

   ```dotenv
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=smkn11
   DB_USERNAME=root
   DB_PASSWORD=
   ```

   Opsional — fitur AI Mading butuh key OpenRouter. Isi `OPENROUTER_API_KEY` di `backend/.env` jika ingin fitur AI aktif (fitur lain tetap jalan tanpa itu).

4. Buat database dan jalankan migrasi + seeder:

   ```bash
   mysql -u root -e "CREATE DATABASE IF NOT EXISTS smkn11 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
   cd backend
   php artisan migrate
   php artisan db:seed
   php artisan storage:link
   cd ..
   ```

   `db:seed` membuat akun test:

   | Role  | Email / Identitas             | Password         |
   | ----- | ----------------------------- | ---------------- |
   | Admin | `admin.test@smkn11.sch.id`    | `smkn11admin`    |
   | Guru  | `guru.test@smkn11.sch.id`     | `smkn11guru`     |
   | OSIS  | `osis.test@smkn11.sch.id`     | `smkn11osis`     |
   | Siswa | NISN `1234567890` (login Mading) | PIN `smkn11student` |

   Guru dan OSIS juga bisa login memakai identitas sistem — cek **Admin → Kelola Akun** untuk melihat `ID Guru` / `ID Anggota` masing-masing.

5. Jalankan aplikasi (backend + frontend sekaligus):

   ```bash
   npm run dev
   ```

   - Frontend Vite: `http://localhost:5173`
   - Backend Laravel: `http://127.0.0.1:8000` (API di `/api`)

   Halaman yang tersedia:

   - Website: `http://localhost:5173`
   - Login admin/guru/OSIS: `http://localhost:5173/admin/login`
   - Login siswa (Mading): `http://localhost:5173/mading/login`
   - Direktori profil publik: `http://localhost:5173/profil/direktori`

## Sistem Akun & Profil

- **Login:** Admin memakai email; Guru memakai NIP/NUPTK/ID Guru; Siswa memakai NISN (Mading); OSIS memakai ID Anggota atau NISN. Password awal bisa diubah setelah login pertama (wajib jika ditandai oleh admin).
- **Profil:** setiap Guru, Siswa, dan Pengurus OSIS dapat mengelola profilnya sendiri (foto, nama, bio, email, telepon, alamat, media sosial, serta data spesifik per peran) di **Admin → Profil Saya** (Guru/OSIS) atau **Mading → Area Siswa → Profil**.
- **Admin:** dapat membuat akun, me-reset password/PIN, mengaktifkan/menonaktifkan, mengubah peran, dan menghapus akun di **Admin → Kelola Akun**.
- **Publik:** tiap akun Guru/Siswa/OSIS punya halaman profil publik di `/profil/guru/:id`, `/profil/siswa/:nisn`, `/profil/osis/:id` dan direktori di `/profil/direktori`.

## Verifikasi

```bash
npm run build
cd backend
php artisan test
cd ..
```

## Catatan

- **Jangan commit `.env`** atau `backend/.env` (berisi kunci rahasia).
- Jalur lokal memakai **MySQL**. File `init_schema.sql`, `temp_seed.sql`, dan folder `migrations/` di root adalah untuk deployment PostgreSQL/Supabase — **tidak dipakai** untuk jalur lokal.
- Setelah migrate (tanpa data), tabel konten kosong. Frontend menampilkan data statis cadangan dari `src/data/*`; admin bisa menambah konten lewat panel `/admin`.
