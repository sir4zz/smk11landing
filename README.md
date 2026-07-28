# 🎓 Website Resmi SMKN 11 Kabupaten Tangerang

Website resmi SMKN 11 Kabupaten Tangerang yang dibangun menggunakan **React + TypeScript + Vite** untuk frontend serta **Express.js + MySQL** sebagai backend API.

Website ini bertujuan untuk menyediakan informasi sekolah secara modern, responsif, dan mudah dikelola melalui halaman admin.

---

## 📌 Fitur

### 🌐 Halaman Publik

- Beranda
- Profil Sekolah
- Program Keahlian
- Fasilitas
- Struktur Organisasi
- Berita
- Prestasi
- PPDB
- Kontak

### 🔐 Admin Panel

- Login Admin
- Dashboard
- Kelola Program Keahlian
- Kelola Berita
- Kelola Prestasi
- Kelola PPDB
- Kelola Struktur Organisasi
- Kelola Fasilitas
- Kelola Konten Website

---

## 🛠️ Teknologi

### Frontend

- React 19
- TypeScript
- Vite
- React Router DOM
- Tailwind CSS
- Lucide React

### Backend

- Express.js
- MySQL
- JWT Authentication
- bcryptjs
- dotenv
- cors

---

## 📂 Struktur Project

```
smkn11-website/
│
├── src/
│   ├── assets/
│   ├── components/
│   ├── data/
│   ├── layouts/
│   ├── lib/
│   ├── pages/
│   ├── routes/
│   └── styles/
│
├── server/
│   ├── controllers/
│   ├── routes/
│   ├── middleware/
│   ├── config/
│   └── index.js
│
├── public/
├── package.json
└── README.md
```

---

## ⚙️ Instalasi

### 1. Clone Repository

```bash
git clone https://github.com/goonersmania11/websmkn11.git
```

Masuk ke folder project

```bash
cd websmkn11
```

---

### 2. Install Dependency

```bash
npm install
```

---

### 3. Konfigurasi Environment

Salin file

```
.env.example
```

menjadi

```
.env
```

Lalu sesuaikan konfigurasi database.

Contoh:

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=smkn11
DB_USER=root
DB_PASSWORD=

JWT_SECRET=your_secret_key
PORT=3000
```

---

### 4. Jalankan Backend

```bash
npm run server
```

Backend akan berjalan pada

```
http://localhost:3000
```

---

### 5. Jalankan Frontend

```bash
npm run dev
```

Frontend akan berjalan pada

```
http://localhost:5173
```

---

## 📦 Script

Menjalankan frontend

```bash
npm run dev
```

Menjalankan backend

```bash
npm run server
```

Build project

```bash
npm run build
```

Preview build

```bash
npm run preview
```

Lint project

```bash
npm run lint
```

---

## 📱 Responsive

Website telah dibuat responsive untuk:

- Desktop
- Laptop
- Tablet
- Mobile

---

## 🔒 Authentication

Admin menggunakan:

- JWT (JSON Web Token)
- Password Hashing (bcrypt)

---

## 🗄️ Database

Database menggunakan MySQL.

Data yang dikelola meliputi:

- Admin
- Program Keahlian
- Berita
- Prestasi
- PPDB
- Fasilitas
- Struktur Organisasi

---

## 👨‍💻 Tim Pengembang

Proyek ini dikembangkan sebagai Website Resmi **SMKN 11 Kabupaten Tangerang**.

---

## 📄 License

Project ini dibuat untuk kebutuhan akademik dan pengembangan Website SMKN 11 Kabupaten Tangerang.