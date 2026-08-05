
Lanjutkan project website **SMKN 11 Kabupaten Tangerang** yang sudah ada.

**PENTING:** Fitur Mading, authentication siswa, role & permission, moderation, dan database sudah dibuat sebelumnya. Jangan membuat ulang fitur tersebut.

Sekarang fokus hanya pada **menambahkan AI Content Assistant ke fitur Mading**.

Jangan merusak fitur existing.

---

## 1. TUJUAN AI MADING

Buat **AI Content Assistant** yang membantu:

* Siswa
* Guru
* OSIS
* Admin

dalam membuat dan mengembangkan konten Mading.

AI harus menjadi **asisten penulisan**, bukan pengganti penulis.

AI menghasilkan **draft yang masih bisa diedit**, dan tidak boleh langsung mempublikasikan konten.

---

## 2. AKSES AI

Gunakan permission existing:

```text
mading.ai_generate
```

Hanya user yang memiliki permission tersebut yang dapat menggunakan AI.

Untuk Student Account, siswa dapat menggunakan AI dalam pembuatan karya Mading sesuai aturan yang sudah dibuat.

Jangan membuat sistem role baru.

---

# 3. AI CONTENT ASSISTANT

Tambahkan tombol:

```text
✨ Bantu dengan AI
```

pada editor Mading.

Ketika diklik, tampilkan panel/modal AI.

Contoh:

```text
✨ AI Content Assistant

Apa yang ingin kamu buat?

Jenis Konten
[ Puisi ▼ ]

Topik
[ Persahabatan di Sekolah ]

Gaya Bahasa
[ Menyentuh ▼ ]

Panjang
[ Sedang ▼ ]

Konteks tambahan
[................................]

[✨ Generate]
```

UI harus sederhana dan mudah digunakan.

---

# 4. JENIS KONTEN

AI minimal mendukung:

* Puisi
* Cerpen
* Artikel
* Pantun
* Esai
* Opini
* Motivasi
* Edukasi
* Tips
* Pengumuman
* Konten kreatif

AI harus menyesuaikan format output berdasarkan jenis konten.

---

# 5. AI ACTION

Jangan hanya membuat fitur Generate.

Sediakan beberapa action:

### Generate

Membuat draft konten berdasarkan input user.

```text
✨ Generate
```

### Improve

Memperbaiki tulisan yang sudah dibuat tanpa mengubah maksud utama.

```text
🪄 Improve
```

### Shorten

Meringkas tulisan.

```text
✂️ Shorten
```

### Expand

Mengembangkan tulisan menjadi lebih lengkap.

```text
📖 Expand
```

### Change Style

Mengubah gaya penulisan.

Pilihan:

```text
Formal
Santai
Inspiratif
Edukatif
Persuasif
Kreatif
```

### Generate Ideas

Membantu mencari ide konten.

Contoh:

```text
💡 Generate Ideas
```

Input:

> Berikan ide Mading tentang teknologi untuk siswa SMK.

AI memberikan beberapa ide.

User dapat memilih salah satu:

```text
[Gunakan Ide Ini]
```

Kemudian ide tersebut dapat digunakan untuk membuat draft.

---

# 6. AI EDITOR

Hasil AI jangan langsung menggantikan konten user.

Setelah generate, tampilkan hasil di editor yang masih dapat diedit.

Contoh:

```text
AI Generated Draft

Judul
[................................]

Isi
[................................]

Kategori
[................................]

[Gunakan Hasil]
[Regenerate]
[Improve]
[Shorten]
[Expand]
[Change Style]
```

Jika user memilih:

**Gunakan Hasil**

maka hasil AI dimasukkan ke editor Mading.

User masih dapat mengedit sebelum menyimpan atau mengirim review.

---

# 7. JANGAN AUTO PUBLISH

AI tidak boleh:

* Publish
* Approve
* Submit review otomatis
* Mengubah status menjadi published

AI hanya menghasilkan atau memodifikasi draft.

Workflow tetap:

```text
AI
 ↓
Draft
 ↓
User Edit
 ↓
Save
 ↓
Submit Review
 ↓
Guru/Admin Review
 ↓
Approve
 ↓
Publish
```

Tetap gunakan sistem moderation existing.

---

# 8. SCHOOL CONTEXT

AI harus memahami bahwa konten dibuat untuk:

**SMKN 11 Kabupaten Tangerang**

Target audience:

* Siswa SMK
* Guru
* Staff sekolah
* Orang tua
* Pengunjung website

Konteks konten dapat mencakup:

* Pendidikan
* Sekolah
* Teknologi
* Organisasi siswa
* OSIS
* Ekstrakurikuler
* Kesemaptaan
* Prestasi
* Kegiatan sekolah
* Dunia industri
* Karier
* Pengembangan diri
* Kehidupan siswa

AI harus menggunakan konteks tersebut jika relevan.

---

# 9. JANGAN MENGARANG FAKTA SEKOLAH

AI tidak boleh mengarang:

* Nama guru
* Nama kepala sekolah
* Nama siswa
* Prestasi sekolah
* Jadwal sekolah
* Alamat
* Data organisasi
* Nama ekstrakurikuler
* Informasi resmi lainnya

Jika user meminta informasi faktual tentang sekolah tetapi datanya tidak tersedia, AI harus mengatakan bahwa informasi tersebut perlu diberikan atau diambil dari data yang tersedia.

Jangan membuat informasi sekolah palsu.

---

# 10. AI UNTUK PUISI

Contoh input:

```text
Jenis:
Puisi

Tema:
Persahabatan

Gaya:
Menyentuh

Panjang:
Sedang
```

AI menghasilkan puisi yang sesuai.

User tetap dapat mengedit hasilnya.

---

# 11. AI UNTUK ARTIKEL

Untuk artikel, AI dapat menghasilkan struktur:

```text
Judul
Pembuka
Isi
Subheading
Penjelasan
Kesimpulan
```

Sesuaikan panjang berdasarkan pilihan user.

---

# 12. AI UNTUK PENGUMUMAN

Untuk pengumuman, AI dapat membantu membuat:

```text
Judul
Ringkasan
Detail
Tanggal
Tempat
Informasi penting
Call to Action
```

Jika data seperti tanggal/tempat belum diberikan, jangan mengarang.

---

# 13. AI UNTUK IDE

Buat fitur khusus:

**Generate Ideas**

User cukup memasukkan:

```text
Topik:
[ Teknologi ]

Target:
[ Siswa SMK ]

[💡 Generate Ideas]
```

AI memberikan misalnya 5–10 ide.

Setiap ide memiliki:

```text
Judul
Deskripsi singkat
Jenis konten
```

Contoh:

```text
1. 5 Teknologi yang Wajib Dipahami Siswa TKJ
   Artikel
   Membahas teknologi dasar yang relevan...

[Gunakan Ide Ini]
```

---

# 14. AI CONTEXT DARI EDITOR

Jika user sedang mengedit karya yang sudah ada, AI harus dapat menggunakan isi editor sebagai context.

Contoh:

```text
Isi saat ini:
"................................"
```

Kemudian user klik:

**Improve**

AI memperbaiki isi tersebut.

Jangan membuat konten baru jika action yang diminta hanya Improve.

---

# 15. AI OUTPUT TERSTRUKTUR

Jika jenis konten membutuhkan judul dan isi terpisah, AI sebaiknya mengembalikan struktur:

```text
{
  "title": "...",
  "content": "...",
  "category": "...",
  "excerpt": "..."
}
```

Sesuaikan dengan struktur database Mading yang sudah ada.

Jangan mengubah schema existing jika tidak diperlukan.

---

# 16. AI API

Gunakan provider AI yang sesuai dengan environment/project yang sudah tersedia.

**Jangan hardcode API key di frontend.**

Jangan:

```text
const API_KEY = "..."
```

API key harus disimpan di:

* Environment variable
* Secret
* Server-side configuration

Request AI harus dilakukan melalui backend/server-side function yang aman.

Frontend hanya berkomunikasi dengan endpoint aplikasi.

---

# 17. AI ENDPOINT

Buat endpoint/service khusus untuk AI jika project membutuhkan.

Contoh konsep:

```text
POST /api/mading/ai/generate
POST /api/mading/ai/improve
POST /api/mading/ai/shorten
POST /api/mading/ai/expand
POST /api/mading/ai/change-style
POST /api/mading/ai/generate-ideas
```

Sesuaikan dengan routing existing project.

Tidak harus menggunakan endpoint tersebut secara persis jika arsitektur project sudah memiliki pola API sendiri.

---

# 18. VALIDATION

Validasi:

* Jenis konten
* Prompt/topik
* Panjang input
* Action
* User authentication
* Permission

Jangan izinkan request AI dari user yang tidak memiliki akses.

---

# 19. RATE LIMITING

Jika memungkinkan, tambahkan rate limiting agar user tidak dapat melakukan request AI secara tidak terbatas.

Contoh konsep:

```text
Student
→ batas request AI

Guru
→ batas request AI

OSIS
→ batas request AI

Admin
→ batas request AI lebih tinggi
```

Nilainya dapat disesuaikan dengan kemampuan sistem.

Jangan membuat limit yang terlalu ketat sehingga fitur sulit digunakan.

---

# 20. LOADING STATE

Ketika AI sedang bekerja:

```text
✨ AI sedang membuat draft...
```

Tampilkan loading state.

User tidak boleh mengklik Generate berkali-kali ketika request masih berjalan.

---

# 21. ERROR HANDLING

Jika AI gagal:

```text
AI tidak dapat memproses permintaan saat ini.

Silakan coba lagi.
```

Sediakan:

```text
[ Coba Lagi ]
```

Jangan menampilkan API key, stack trace, atau informasi internal ke user.

---

# 22. AI USAGE TRANSPARENCY

Konten yang menggunakan AI dapat memiliki metadata:

```text
AI Assistance: Used
```

Contoh di halaman detail:

> Konten ini dibuat dengan bantuan AI dan telah melalui proses review.

Jangan membuat klaim bahwa sistem dapat mendeteksi AI dengan akurasi 100%.

Tidak perlu membuat AI Detector.

Fokus pada transparansi penggunaan AI.

---

# 23. AI SAFETY

AI harus menolak atau mengarahkan ulang permintaan yang:

* Berbahaya
* Mengandung kebencian
* Seksual
* Pelecehan
* Kekerasan yang tidak sesuai konteks edukasi
* Penipuan
* Konten ilegal
* Konten yang tidak pantas untuk lingkungan sekolah

AI harus menggunakan bahasa yang sesuai untuk lingkungan sekolah dan usia siswa.

---

# 24. AI TIDAK MENGGANTIKAN MODERASI

Walaupun AI sudah melakukan filtering, semua karya yang akan dipublikasikan tetap melewati moderation existing.

```text
AI Generate
 ↓
Student Edit
 ↓
Submit
 ↓
Moderation
 ↓
Approve
 ↓
Publish
```

AI tidak boleh menggantikan Guru/Admin sebagai moderator.

---

# 25. UI/UX

Pertahankan desain website yang sudah ada.

Jangan membuat desain AI yang terlihat seperti aplikasi terpisah.

Gunakan style existing.

AI Assistant dapat menggunakan:

* Modal
* Drawer
* Side panel
* Popover

Pilih yang paling sesuai dengan UI existing.

Pada mobile, pastikan AI Assistant tetap nyaman digunakan.

---

# 26. JANGAN MERUSAK FITUR EXISTING

Pastikan setelah implementasi:

* Login siswa tetap bekerja.
* Mading tetap bekerja.
* CRUD Mading tetap bekerja.
* Draft tetap bekerja.
* Submit review tetap bekerja.
* Approve/reject tetap bekerja.
* Permission tetap bekerja.
* Admin Panel tetap bekerja.
* OSIS tetap bekerja.
* Ekstrakurikuler tetap bekerja.
* Kesemaptaan tetap bekerja.

AI hanya menjadi tambahan fitur.

---

# 27. TESTING

Setelah selesai, test minimal:

### Student

* Login
* Buka Mading
* Generate puisi
* Generate artikel
* Improve tulisan
* Shorten
* Expand
* Change Style
* Generate Ideas
* Edit hasil AI
* Save Draft
* Submit Review

### Guru

* Menggunakan AI jika memiliki permission
* Review karya
* Approve/reject

### OSIS

* Menggunakan AI jika memiliki permission

### Admin

* Menggunakan AI
* Mengubah permission AI

### Security

Pastikan user tanpa:

```text
mading.ai_generate
```

tidak dapat:

* Melihat fitur AI
* Memanggil endpoint AI
* Menggunakan API AI melalui request manual

---

# 28. Acceptance Criteria

Fitur dianggap selesai jika:

* [ ] AI Content Assistant tersedia.
* [ ] AI dapat membuat berbagai jenis konten.
* [ ] AI dapat membantu puisi.
* [ ] AI dapat membantu artikel.
* [ ] AI dapat membantu cerpen.
* [ ] AI dapat membantu pantun.
* [ ] AI dapat membantu esai.
* [ ] AI dapat membantu opini.
* [ ] AI dapat membuat ide.
* [ ] Improve tersedia.
* [ ] Shorten tersedia.
* [ ] Expand tersedia.
* [ ] Change Style tersedia.
* [ ] Hasil AI dapat diedit.
* [ ] AI tidak dapat auto-publish.
* [ ] AI tetap mengikuti workflow moderation.
* [ ] AI memahami konteks SMKN 11 Kabupaten Tangerang.
* [ ] AI tidak mengarang fakta sekolah.
* [ ] API key tidak exposed.
* [ ] AI endpoint terlindungi authentication.
* [ ] AI endpoint terlindungi permission.
* [ ] Error handling tersedia.
* [ ] Loading state tersedia.
* [ ] Responsive.
* [ ] Tidak ada fitur existing yang rusak.
* [ ] Tidak ada error TypeScript.
* [ ] Tidak ada error browser console.
* [ ] Build berhasil.

---

## Instruksi Akhir

**Jangan membuat ulang Mading, Role & Permission, Student Account, OSIS, Ekstrakurikuler, atau Kesemaptaan.**

Semua fitur tersebut sudah ada.

Fokus hanya pada:

```text
Existing Mading
       ↓
AI Content Assistant
       ↓
Generate / Improve / Shorten / Expand /
Change Style / Generate Ideas
       ↓
Editable Draft
       ↓
Existing Moderation
       ↓
Publish
```

Gunakan arsitektur existing project dan InsForge.

Jangan mengubah fitur existing kecuali memang diperlukan untuk integrasi AI.

Setelah implementasi, lakukan testing end-to-end dan pastikan tidak ada regression.
