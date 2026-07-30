# Website Resmi SMKN 11 Kabupaten Tangerang

Website resmi SMKN 11 Kabupaten Tangerang dibangun dengan **React + TypeScript + Vite** dan **InsForge** sebagai backend (Postgres BaaS).

## Fitur

### Halaman Publik
- Beranda
- Profil Sekolah
- Program Keahlian
- Fasilitas
- Struktur Organisasi
- Berita
- Prestasi
- SPMB (Seleksi Penerimaan Murid Baru)
- Kontak

### Admin Panel
- Login Admin (InsForge Auth)
- Dashboard
- Kelola Program Keahlian, Berita, Prestasi, Fasilitas, Struktur Organisasi
- Kelola SPMB (status, banner, jadwal, alur, FAQ)
- Kelola Pesan Kontak

## Teknologi

### Frontend
- React 19 + TypeScript
- Vite
- React Router DOM
- Tailwind CSS
- Lucide React

### Backend & Infrastructure
- **InsForge** (https://insforge.dev) — Postgres BaaS
  - Database (PostgreSQL), Authentication, File Storage, Edge Functions
  - Realtime, AI Gateway (OpenRouter), Email, Stripe Payments
- SDK: `@insforge/sdk`

## Struktur Project

```
smkn11-website/
├── src/
│   ├── assets/
│   ├── components/
│   ├── data/
│   ├── layouts/
│   ├── lib/
│   ├── pages/
│   ├── routes/
│   └── styles/
├── migrations/          # Database migrations (SQL)
├── public/
├── .env                 # VITE_INSFORGE_URL + VITE_INSFORGE_ANON_KEY
├── .insforge/           # Project config (jangan di-commit)
├── vercel.json
├── package.json
└── README.md
```

## Instalasi & Menjalankan

```bash
# 1. Clone
git clone https://github.com/goonersmania11/websmkn11.git
cd websmkn11

# 2. Install dependencies
npm install

# 3. Setup environment
# Buat file .env dengan:
# VITE_INSFORGE_URL=https://qptmh227.ap-southeast.insforge.app
# VITE_INSFORGE_ANON_KEY=<anon-key>

# 4. Jalankan dev server
npm run dev
```

Frontend berjalan di `http://localhost:5173`.

## Build & Deploy

```bash
npm run build          # Build production
npx @insforge/cli deployments deploy .   # Deploy ke InsForge
```

## Script

| Perintah | Keterangan |
|----------|------------|
| `npm run dev` | Jalankan dev server |
| `npm run build` | Build production |
| `npm run preview` | Preview build |
| `npm run lint` | Lint project |

## Database Migrations

```bash
npx @insforge/cli db migrations list     # Lihat migrasi yang sudah terpasang
npx @insforge/cli db migrations up --all  # Jalankan migrasi pending
npx @insforge/cli db migrations new <name> # Buat migrasi baru
```

## Admin

Login di `/admin/login` menggunakan akun InsForge Auth dengan role `admin` di tabel `profiles`.

## Deploy

Live: https://qptmh227.insforge.site

## License

Dikembangkan untuk SMKN 11 Kabupaten Tangerang.
