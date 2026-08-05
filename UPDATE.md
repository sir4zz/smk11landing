Lanjutkan pengembangan project website **SMKN 11 Kabupaten Tangerang** yang sudah ada.

**PENTING:**

* Jangan membuat project baru.
* Jangan menghapus atau merusak fitur yang sudah berjalan.
* Jangan membuat atau mengintegrasikan fitur AI apa pun pada tahap ini.
* Fokus pada sistem Role & Permission, OSIS, Ekstrakurikuler, Kesemaptaan, Mading, dan Student Account.
* Gunakan InsForge yang sudah digunakan project.
* Sebelum coding, audit terlebih dahulu struktur project, authentication, Admin Panel, database InsForge, API, routing, dan komponen UI yang sudah tersedia.

---

# 1. ARSITEKTUR AKSES

Pisahkan sistem menjadi dua area:

```text
Website Publik
│
├── Pengunjung
│   ├── Beranda
│   ├── Berita
│   ├── Manajemen
│   ├── OSIS
│   ├── Mading
│   └── SPMB
│
└── Mading
    └── Login Siswa

Admin Panel
│
├── Admin
├── Guru
└── OSIS
```

**Siswa tidak boleh memiliki akses ke Admin Panel.**

Siswa memiliki akun khusus untuk fitur Mading.

---

# 2. ROLE ADMIN PANEL

Admin Panel memiliki 3 role:

* Admin
* Guru
* OSIS

Jangan menentukan akses secara hardcode berdasarkan role.

Gunakan **Dynamic Role-Based Access Control (RBAC)**.

Konsep:

```text
Role
 ↓
Permission
 ↓
Menu + Action
```

---

# 3. ADMIN

Admin memiliki akses penuh.

Admin juga dapat menentukan permission untuk Guru dan OSIS.

Admin dapat mengatur:

* Akses menu
* View
* Create
* Edit
* Delete
* Publish
* Review
* Permission lainnya

Admin tidak boleh kehilangan akses penuh akibat konfigurasi permission biasa.

---

# 4. GURU

Guru hanya dapat mengakses menu dan action yang diberikan Admin.

Contoh permission awal:

```text
Dashboard
☑ View

Mading
☑ View
☑ Create
☑ Edit Own
☑ Submit Review
☑ Review
☑ Publish
☐ Edit All
☐ Delete

Manajemen
☑ View

OSIS
☐ View

SPMB
☐ View
```

Ini hanya default.

Admin tetap dapat mengubah semuanya melalui Role & Permission.

---

# 5. OSIS

OSIS hanya dapat mengakses fitur yang diberikan Admin.

Contoh permission awal:

```text
Dashboard
☑ View

OSIS
☑ View
☑ Create
☑ Edit
☑ Manage Activities

Ekstrakurikuler
☑ View
☑ Create
☑ Edit
☑ Delete

Kesemaptaan
☑ View
☑ Create
☑ Edit
☑ Delete

Mading
☑ View
☑ Create
☑ Edit Own
☑ Submit Review
☐ Review
☐ Publish

SPMB
☐ View
```

Semua permission tersebut harus tetap dapat diubah oleh Admin.

Jangan hardcode bahwa OSIS selalu mendapatkan akses tersebut.

---

# 6. DYNAMIC ROLE & PERMISSION

Tambahkan menu Admin Panel:

**Role & Permission**

Admin dapat memilih:

```text
[ Admin ]
[ Guru ]
[ OSIS ]
```

Kemudian muncul daftar permission berbentuk checkbox.

Contoh:

```text
Mading
☑ View
☑ Create
☑ Edit Own
☐ Edit All
☐ Delete
☑ Submit Review
☐ Review
☐ Publish

OSIS
☑ View
☑ Create
☑ Edit
☐ Delete
☑ Publish

Ekstrakurikuler
☑ View
☑ Create
☑ Edit
☑ Delete

Kesemaptaan
☑ View
☑ Create
☑ Edit
☑ Delete
```

Admin dapat:

* Centang permission
* Hapus centang
* Simpan
* Mengubah permission kapan saja

Permission harus tersimpan secara persistent di InsForge.

---

# 7. GRANULAR PERMISSION

Gunakan permission berbasis action.

Contoh:

```text
dashboard.view

osis.view
osis.create
osis.edit
osis.delete
osis.publish

osis.activities.view
osis.activities.create
osis.activities.edit
osis.activities.delete

extracurricular.view
extracurricular.create
extracurricular.edit
extracurricular.delete
extracurricular.publish

kesemaptaan.view
kesemaptaan.create
kesemaptaan.edit
kesemaptaan.delete
kesemaptaan.publish

mading.view
mading.create
mading.edit_own
mading.edit_all
mading.delete
mading.submit_review
mading.review
mading.publish

spmb.view
spmb.create
spmb.edit
spmb.delete
spmb.verify
```

Buat sistem permission yang mudah diperluas.

---

# 8. SECURITY RBAC

Permission harus divalidasi di:

**Frontend + Backend/API**

Jangan hanya menyembunyikan menu.

Jika user tidak memiliki permission:

```text
spmb.view
```

maka:

* Menu SPMB tidak muncul
* Route tidak dapat diakses
* API menolak request
* Direct API request juga harus ditolak

User tidak boleh:

* Mengubah role sendiri
* Memberikan permission kepada dirinya sendiri
* Mengakses endpoint tanpa permission
* Mengedit data orang lain tanpa permission
* Publish tanpa permission

---

# 9. NAVBAR WEBSITE PUBLIK

Tambahkan menu:

**OSIS**

dan:

**Mading**

Pertahankan menu existing yang masih digunakan.

---

# 10. STRUKTUR MENU OSIS

Menu **OSIS** menjadi menu utama untuk kegiatan organisasi dan kegiatan siswa.

Struktur:

```text
OSIS
├── Profil OSIS
├── Struktur OSIS
├── Kegiatan OSIS
├── Ekstrakurikuler
└── Kesemaptaan
```

**Ekstrakurikuler dan Kesemaptaan tidak perlu menjadi menu navbar utama terpisah.**

Keduanya berada di dalam area OSIS.

---

# 11. HALAMAN PUBLIK OSIS

Buat halaman:

**OSIS SMKN 11 Kabupaten Tangerang**

Tampilkan:

### Profil OSIS

* Logo/foto
* Nama
* Deskripsi
* Periode kepengurusan

### Struktur OSIS

* Ketua
* Wakil Ketua
* Sekretaris
* Bendahara
* Bidang/seksi

### Kegiatan OSIS

Setiap kegiatan dapat memiliki:

* Foto
* Judul
* Tanggal
* Deskripsi
* Status

Semua data berasal dari InsForge.

---

# 12. EKSTRAKURIKULER

Buat halaman publik:

**Ekstrakurikuler**

Tampilkan daftar kegiatan ekstrakurikuler sekolah.

Setiap ekskul minimal memiliki:

```text
Nama Ekskul
Logo/Foto
Deskripsi
Pembina
Jadwal
Tempat
Prestasi
Dokumentasi
Status
```

Buat halaman detail untuk setiap ekstrakurikuler.

Contoh kategori jika relevan:

* Olahraga
* Seni
* Teknologi
* Organisasi
* Akademik
* Keterampilan

Jangan membuat kategori yang tidak diperlukan jika data sebenarnya belum tersedia.

---

# 13. ADMIN PANEL → EKSTRAKURIKULER

Di dalam menu:

**Admin Panel → OSIS → Ekstrakurikuler**

Sediakan:

* Daftar ekskul
* Tambah
* Edit
* Hapus
* Publish/unpublish
* Upload foto/logo
* Kelola pembina
* Kelola jadwal
* Kelola tempat
* Kelola prestasi

Gunakan permission:

```text
extracurricular.view
extracurricular.create
extracurricular.edit
extracurricular.delete
extracurricular.publish
```

---

# 14. KESEMAPTAAN

Buat halaman publik:

**Kesemaptaan**

Tampilkan informasi mengenai kegiatan kesemaptaan sekolah.

Struktur dapat meliputi:

### Profil Kesemaptaan

* Judul
* Deskripsi
* Foto

### Program/Kegiatan

* Nama kegiatan
* Tanggal
* Deskripsi
* Dokumentasi

### Jadwal

* Hari
* Jam
* Tempat

### Pembina/Instruktur

* Nama
* Jabatan/peran
* Foto jika tersedia

### Prestasi

* Nama prestasi
* Tahun
* Keterangan
* Dokumentasi

Gunakan data dinamis dari InsForge.

---

# 15. ADMIN PANEL → KESEMAPTAAN

Di dalam:

**Admin Panel → OSIS → Kesemaptaan**

Sediakan:

* Daftar kegiatan
* Tambah
* Edit
* Hapus
* Publish/unpublish
* Upload dokumentasi
* Kelola jadwal
* Kelola pembina/instruktur
* Kelola prestasi

Permission:

```text
kesemaptaan.view
kesemaptaan.create
kesemaptaan.edit
kesemaptaan.delete
kesemaptaan.publish
```

---

# 16. MADING PUBLIK

Buat halaman publik:

**Mading SMKN 11 Kabupaten Tangerang**

Mading menjadi tempat publikasi karya sekolah.

Jenis konten:

* Puisi
* Cerpen
* Artikel
* Pantun
* Esai
* Opini
* Motivasi
* Edukasi
* Tips
* Karya siswa
* Karya guru
* Informasi sekolah
* Teknologi
* Dunia industri
* Karier
* Konten kreatif lainnya

**Jangan membuat fitur AI pada tahap ini.**

---

# 17. KATEGORI MADING

Gunakan kategori untuk mengelompokkan karya.

Contoh:

```text
Puisi
Cerpen
Artikel
Pantun
Esai
Opini
Edukasi
Teknologi
Motivasi
Karya Kreatif
Lainnya
```

Kategori sebaiknya dapat dikelola Admin jika struktur project memungkinkan.

---

# 18. DATA MADING

Setiap konten minimal memiliki:

```text
title
content
category
author_id
author_name
author_role
cover_image
status
created_at
updated_at
published_at
```

Status:

```text
draft
pending_review
approved
rejected
published
```

---

# 19. STUDENT ACCOUNT

Siswa bukan role Admin Panel.

Buat **Student Account** khusus untuk Mading.

Struktur:

```text
Admin Panel
├── Admin
├── Guru
└── OSIS

Mading Student Area
└── Siswa
```

Siswa hanya dapat menggunakan fitur Mading.

---

# 20. LOGIN SISWA

Tambahkan:

**Login Siswa**

Gunakan:

```text
NISN
PIN / Password
```

Jangan menggunakan NISN saja sebagai autentikasi.

NISN adalah identitas siswa.

PIN/password adalah autentikasi.

Jika database siswa sudah tersedia, hubungkan akun Mading dengan data siswa existing.

Jangan membuat database siswa duplikat jika data siswa sudah tersedia.

---

# 21. MADING STUDENT AREA

Setelah login siswa:

```text
Mading Saya
├── Jelajahi
├── Karya Saya
├── Buat Karya
└── Profil
```

Siswa dapat melihat:

* Karya sendiri
* Draft
* Pending Review
* Published
* Rejected
* Feedback moderator

---

# 22. SISWA → BUAT KARYA

Siswa dapat membuat:

* Puisi
* Cerpen
* Artikel
* Pantun
* Esai
* Opini
* Motivasi
* Karya kreatif lainnya

Form:

```text
Jenis Karya
[ Puisi ▼ ]

Judul
[........................]

Isi
[........................]

[Simpan Draft]
[Kirim untuk Review]
```

**Jangan tambahkan tombol AI atau fitur AI pada tahap ini.**

AI akan ditambahkan pada tahap pengembangan berikutnya.

---

# 23. WORKFLOW MODERASI MADING

Gunakan:

```text
Siswa
 ↓
Buat Karya
 ↓
Draft
 ↓
Kirim untuk Review
 ↓
Pending Review
 ↓
Guru / Admin
 ↓
Approve / Reject
 ↓
Published
```

Jika ditolak:

```text
Rejected
 ↓
Feedback
 ↓
Siswa memperbaiki
 ↓
Submit Review lagi
```

Siswa tidak dapat langsung publish.

OSIS tidak otomatis memiliki permission review/publish.

Admin menentukan permission tersebut melalui Role & Permission.

---

# 24. REVIEW MADING

Guru/Admin yang memiliki permission:

```text
mading.review
```

dapat melihat:

* Judul
* Penulis
* Jenis karya
* Isi
* Tanggal submit
* Status

Action:

```text
[Approve]
[Reject]
```

Jika Reject, wajib tersedia kolom:

**Alasan / Feedback**

Contoh:

> "Silakan perbaiki bagian pembuka dan sesuaikan dengan tema Mading."

---

# 25. ADMIN PANEL → MADING

Tambahkan:

```text
Mading
├── Semua
├── Draft
├── Pending Review
├── Published
└── Buat Konten
```

Fitur:

* Create
* Edit
* Delete
* Review
* Approve
* Reject
* Publish/unpublish
* Search
* Filter kategori
* Filter status
* Filter author

Semua action mengikuti permission.

---

# 26. DATABASE INSFORGE

Sebelum membuat tabel baru, audit database InsForge.

Gunakan tabel existing jika masih relevan.

Jangan membuat tabel duplikat.

Jika belum tersedia, sesuaikan kebutuhan dengan struktur existing untuk:

```text
roles
permissions
role_permissions

students
student_accounts

osis
osis_members
osis_activities

extracurriculars
extracurricular_achievements
extracurricular_schedules

kesemaptaan
kesemaptaan_activities
kesemaptaan_schedules
kesemaptaan_achievements

mading_categories
mading_posts
mading_reviews
```

Tidak harus menggunakan nama tabel di atas secara persis jika project sudah memiliki konvensi berbeda.

Yang penting struktur dan relasinya benar.

---

# 27. STORAGE

Jika InsForge Storage sudah digunakan, gunakan untuk:

* Logo OSIS
* Foto OSIS
* Foto kegiatan
* Foto ekstrakurikuler
* Dokumentasi kesemaptaan
* Cover Mading

Jangan menyimpan file besar langsung sebagai database text/blob jika storage sudah tersedia.

---

# 28. UI/UX

Pertahankan desain existing website.

Jangan mengubah secara besar-besaran:

* Warna
* Typography
* Navbar
* Footer
* Existing layout
* Existing components

Gunakan komponen existing jika memungkinkan.

Untuk halaman baru:

* Responsive
* Modern
* Konsisten dengan website
* Tidak berlebihan
* Loading state
* Empty state
* Error state
* Toast/feedback

---

# 29. RESPONSIVE

Pastikan semua fitur berjalan di:

* Desktop
* Tablet
* Mobile

Termasuk:

* Admin Panel
* Role & Permission
* OSIS
* Ekstrakurikuler
* Kesemaptaan
* Mading
* Student Area
* Review Mading

---

# 30. SECURITY

Pastikan:

* Siswa tidak dapat masuk Admin Panel.
* Siswa tidak dapat mengakses endpoint Admin Panel.
* Siswa hanya dapat mengedit karya miliknya sendiri.
* Siswa tidak dapat publish sendiri.
* User tidak dapat mengubah role sendiri.
* User tidak dapat memberikan permission kepada dirinya sendiri.
* Permission divalidasi backend.
* Input divalidasi.
* Konten user disanitasi sebelum ditampilkan.
* Endpoint sensitif membutuhkan authorization.
* Tidak ada bypass permission melalui direct API request.

---

# 31. TIDAK ADA AI PADA TAHAP INI

**PENTING: Jangan implementasikan AI sekarang.**

Jangan membuat:

* AI Content Assistant
* AI Generate
* AI Improve
* AI Rewrite
* AI Generate Ideas
* AI API integration
* AI endpoint
* AI button

Namun, struktur Mading harus dibuat **mudah dikembangkan untuk AI di tahap berikutnya**.

Misalnya arsitektur Mading dibuat modular sehingga nanti fitur:

```text
Mading
├── Manual Editor
└── AI Assistant ← tahap berikutnya
```

dapat ditambahkan tanpa mengubah sistem Mading secara besar-besaran.

---

# 32. URUTAN IMPLEMENTASI

Kerjakan dengan urutan:

### Phase 1 — Audit

Periksa project existing dan InsForge.

### Phase 2 — Authentication

Pastikan Admin, Guru, OSIS, dan Student Account dapat dipisahkan.

### Phase 3 — Dynamic Permission

Implementasikan:

* Permissions
* Role permissions
* Role & Permission UI
* Backend authorization

### Phase 4 — OSIS

Implementasikan:

* Navbar
* Public OSIS
* Profil
* Struktur
* Kegiatan
* Admin CRUD

### Phase 5 — Ekstrakurikuler

Implementasikan:

* Public page
* Detail
* Admin CRUD
* Jadwal
* Pembina
* Prestasi
* Dokumentasi

### Phase 6 — Kesemaptaan

Implementasikan:

* Public page
* Kegiatan
* Jadwal
* Pembina/instruktur
* Prestasi
* Dokumentasi
* Admin CRUD

### Phase 7 — Mading

Implementasikan:

* Public Mading
* Kategori
* CRUD
* Draft
* Submit Review
* Approve
* Reject
* Publish

### Phase 8 — Student Account

Implementasikan:

* Login NISN + PIN/password
* Student Area
* Karya Saya
* Buat Karya
* Edit karya sendiri
* Submit Review

### Phase 9 — Security & Testing

Test:

* Role
* Permission
* API authorization
* Student isolation
* CRUD
* Review workflow

### Phase 10 — Build & Deployment

* TypeScript check
* Build
* Browser console
* Responsive test
* API test
* Permission test
* Deploy

---

# 33. ACCEPTANCE CRITERIA

### Role

* [ ] Admin tersedia.
* [ ] Guru tersedia.
* [ ] OSIS tersedia.
* [ ] Student Account terpisah dari Admin Panel.

### Permission

* [ ] Permission tidak hardcode.
* [ ] Admin dapat mengatur permission dengan checkbox.
* [ ] Permission tersimpan di InsForge.
* [ ] Permission divalidasi backend.
* [ ] Direct API request tetap dilindungi.

### OSIS

* [ ] Menu OSIS tersedia.
* [ ] Halaman OSIS tersedia.
* [ ] Profil OSIS tersedia.
* [ ] Struktur OSIS tersedia.
* [ ] Kegiatan OSIS tersedia.
* [ ] Admin CRUD berfungsi.

### Ekstrakurikuler

* [ ] Terintegrasi di area OSIS.
* [ ] Daftar ekskul tersedia.
* [ ] Detail ekskul tersedia.
* [ ] Pembina tersedia.
* [ ] Jadwal tersedia.
* [ ] Prestasi tersedia.
* [ ] Dokumentasi tersedia.
* [ ] CRUD Admin berfungsi.

### Kesemaptaan

* [ ] Terintegrasi di area OSIS.
* [ ] Halaman publik tersedia.
* [ ] Kegiatan tersedia.
* [ ] Jadwal tersedia.
* [ ] Pembina/instruktur tersedia.
* [ ] Prestasi tersedia.
* [ ] Dokumentasi tersedia.
* [ ] CRUD Admin berfungsi.

### Mading

* [ ] Mading publik tersedia.
* [ ] Kategori tersedia.
* [ ] CRUD tersedia.
* [ ] Draft tersedia.
* [ ] Pending Review tersedia.
* [ ] Approve tersedia.
* [ ] Reject tersedia.
* [ ] Feedback tersedia.
* [ ] Publish tersedia.
* [ ] Siswa dapat membuat karya.
* [ ] Siswa hanya dapat mengedit karya sendiri.

### Student Account

* [ ] Login NISN + PIN/password tersedia.
* [ ] Siswa tidak dapat masuk Admin Panel.
* [ ] Student Area tersedia.
* [ ] Karya Saya tersedia.
* [ ] Buat Karya tersedia.
* [ ] Submit Review tersedia.

### AI

* [ ] **Tidak ada fitur AI yang dibuat pada tahap ini.**
* [ ] Struktur Mading siap untuk integrasi AI di tahap berikutnya.

### Quality

* [ ] Tidak ada fitur existing yang rusak.
* [ ] Tidak ada error TypeScript.
* [ ] Tidak ada error browser console.
* [ ] Build berhasil.
* [ ] Responsive.
* [ ] Semua data terhubung ke InsForge.
* [ ] API berjalan dengan benar.
* [ ] Security permission sudah diuji.
* [ ] Deploy berhasil.

**PENTING:** Jangan hanya membuat UI. Implementasikan seluruh fitur end-to-end: database, authentication, authorization, API, CRUD, dynamic permission, student account, moderation, validation, security, testing, dan deployment.

Jika struktur existing berbeda dari asumsi prompt ini, adaptasikan dengan struktur project yang sudah ada dan jangan mengganti arsitektur secara sembarangan.

**Sekali lagi: jangan implementasikan AI pada tahap ini.**
