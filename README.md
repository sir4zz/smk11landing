# SMKN 11 Website

Frontend React + TypeScript + Vite tetap digunakan sebagai antarmuka aplikasi. Backend utama berada di `backend/` dan menggunakan Laravel 12, PostgreSQL, autentikasi sesi Sanctum, RBAC, serta Laravel Storage.

## Menjalankan lokal

1. Salin `.env.example` ke `.env` dan set `VITE_API_URL=http://localhost:8000`.
2. Salin `backend/.env.example` ke `backend/.env`, lalu isi `APP_KEY` dan konfigurasi PostgreSQL.
3. Jalankan migrasi Laravel:

   ```bash
   cd backend
   composer install
   php artisan migrate
   php artisan storage:link
   php artisan serve
   ```

4. Di terminal lain, jalankan frontend:

   ```bash
   npm install
   npm run dev
   ```

Frontend tersedia pada `http://localhost:5173`; API Laravel pada `http://localhost:8000/api`.

## Verifikasi

```bash
npm run build
cd backend && php artisan test
```

Jangan commit `.env` atau `backend/.env`.
