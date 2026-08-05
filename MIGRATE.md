# MIGRASI BACKEND PROJECT SMKN11 WEBSITE DARI INSFORGE KE LARAVEL

## TUJUAN UTAMA

Saya ingin memigrasikan project ini dari backend **InsForge + TypeScript/SDK** menjadi **Laravel**, tetapi **TIDAK ingin mengubah logic, behavior, flow, fitur, UI, permission, maupun cara kerja aplikasi yang sekarang**.

### Prinsip utama:

> **Laravel hanya menggantikan backend InsForge. Aplikasi harus tetap bekerja sama seperti sebelum migrasi.**

Jangan melakukan redesign.

Jangan membuat ulang aplikasi.

Jangan menyederhanakan fitur.

Jangan mengubah business logic.

Jangan mengubah flow user.

Jangan mengubah behavior hanya karena ingin mengikuti preferensi atau best practice Laravel.

Jika implementasi existing sudah bekerja, pertahankan behavior tersebut dan hanya pindahkan implementasinya ke Laravel.

---

# 1. AUDIT PROJECT TERLEBIH DAHULU

Sebelum melakukan perubahan apa pun, baca dan pahami seluruh repository.

Project ini saat ini merupakan frontend React + TypeScript + Vite dengan backend/data layer yang menggunakan InsForge.

Periksa minimal:

```text
src/
src/lib/
src/components/
src/pages/
src/data/
migrations/
init_schema.sql
server/
package.json
.env.example
insforge.toml
AGENTS.md
```

Jangan hanya membaca beberapa file.

Cari seluruh penggunaan:

```text
@insforge/sdk
insforge.database
insforge.auth
insforge.storage
RPC/function
RLS
role
permission
authentication
upload
```

Buat pemetaan internal dari:

```text
Existing implementation
        ↓
Laravel implementation
```

Sebelum coding.

---

# 2. TARGET ARSITEKTUR

### SEBELUM

```text
React + TypeScript
        │
        ▼
InsForge SDK
        │
        ├── Authentication
        ├── PostgreSQL
        ├── Storage
        ├── RLS
        ├── RPC / PostgreSQL Functions
        └── RBAC
```

### SESUDAH

```text
React + TypeScript
        │
        │ HTTP / REST API
        ▼
Laravel
        │
        ├── Authentication
        ├── Authorization / RBAC
        ├── API
        ├── Validation
        ├── File Storage
        ├── Business Logic
        └── Database Access
        │
        ▼
PostgreSQL
```

Frontend tetap digunakan.

Laravel menjadi backend utama.

InsForge harus sepenuhnya dilepas setelah migrasi berhasil.

---

# 3. JANGAN MENGUBAH FRONTEND

Frontend existing harus tetap dipertahankan.

Jangan mengubah:

* desain
* layout
* styling
* component
* navigation
* routing
* halaman
* flow user
* behavior UI
* fitur

File frontend hanya boleh diubah jika memang diperlukan untuk mengganti koneksi InsForge menjadi Laravel API.

Prioritaskan agar perubahan frontend seminimal mungkin.

Jangan melakukan redesign atau refactor besar-besaran.

---

# 4. JANGAN MENGUBAH LOGIC

Ini adalah requirement paling penting.

Jangan mengubah:

* business logic
* validation logic
* status logic
* permission logic
* role logic
* authentication flow
* authorization flow
* upload behavior
* CRUD behavior
* data relationship
* user flow
* SPMB flow
* PPDB flow
* Mading flow
* OSIS flow
* Kesemaptaan flow
* Student login flow

Jika existing code memiliki logic tertentu, pindahkan logic tersebut ke Laravel dengan hasil dan behavior yang sama.

### Contoh

Jika existing:

```text
User melakukan A
↓
Sistem mengecek B
↓
Jika B terpenuhi → C
↓
Jika tidak → D
```

Maka Laravel harus tetap:

```text
User melakukan A
↓
Sistem mengecek B
↓
Jika B terpenuhi → C
↓
Jika tidak → D
```

Jangan mengubah flow tersebut.

---

# 5. DATABASE

Gunakan **PostgreSQL** sebagai database utama.

Jangan mengganti PostgreSQL menjadi MySQL.

Project memiliki migration dan schema PostgreSQL yang harus dijadikan sumber referensi utama.

Periksa seluruh:

```text
init_schema.sql
migrations/*.sql
```

dan migrasikan struktur tersebut ke Laravel.

Gunakan:

```text
database/migrations/
database/seeders/
app/Models/
```

Pertahankan:

* table
* column
* type
* UUID
* primary key
* foreign key
* unique constraint
* nullable
* default value
* relationship
* status
* JSON/JSONB
* timestamp
* data existing

Jangan membuat schema baru berdasarkan asumsi.

Gunakan schema existing sebagai referensi.

---

# 6. TABEL DAN DOMAIN YANG WAJIB DIPERIKSA

Pastikan seluruh tabel yang digunakan project tetap tersedia setelah migrasi.

Minimal periksa domain berikut:

### Authentication / User

```text
profiles
users / auth users
student_accounts
students
```

### Content

```text
news
programs
facilities
staff
achievements
teacher_activities
education_staff
```

### SPMB

```text
spmb_content
```

### PPDB

Periksa seluruh tabel PPDB pada schema existing, termasuk:

```text
ppdb_registrations
ppdb_documents
ppdb_activity_log
```

dan tabel/struktur terkait lainnya jika ditemukan saat audit.

### OSIS

```text
osis
osis_members
osis_activities
```

### Ekstrakurikuler

```text
extracurriculars
```

### Kesemaptaan

```text
kesemaptaan
kesemaptaan_activities
kesemaptaan_schedules
kesemaptaan_instructors
kesemaptaan_achievements
```

### Mading

```text
mading_categories
mading_posts
mading_reviews
```

### RBAC

```text
roles
permissions
role_permissions
```

### Contact

Periksa juga:

```text
contact_messages
```

dan semua tabel lain yang ditemukan pada schema/migration.

Jangan menghapus tabel hanya karena tidak terlihat digunakan pada halaman tertentu.

---

# 7. MIGRASI INSFORGE DATABASE

Semua penggunaan:

```text
insforge.database.from(...)
```

harus digantikan dengan Laravel API.

Contoh existing:

```text
insforge.database.from('news').select('*')
```

harus menjadi request frontend ke Laravel:

```text
GET /api/news
```

Kemudian Laravel mengambil data menggunakan Eloquent/Query Builder.

Namun **hasil yang diterima frontend harus tetap equivalent**.

---

# 8. PUBLIC CONTENT

Project memiliki public content yang saat ini menggunakan InsForge.

Pastikan seluruh content tetap berjalan:

```text
News
Programs
Facilities
Staff
Achievements
Teacher Activities
Education Staff
SPMB Content
OSIS
Extracurricular
Kesemaptaan
Mading
```

Pertahankan behavior fallback yang sudah ada.

Jika frontend existing memiliki fallback data ketika API/database gagal, **jangan menghapus fallback tersebut hanya karena backend sudah Laravel**.

---

# 9. AUTHENTICATION

Migrasikan authentication InsForge ke Laravel.

Namun flow existing harus dipertahankan.

Periksa:

```text
src/lib/staffAuth.tsx
src/components/auth/RouteGuards.tsx
src/pages/ppdb/Login.tsx
src/pages/ppdb/PPDBAuth.tsx
src/pages/ppdb/Register.tsx
src/pages/mading/StudentLogin.tsx
src/pages/mading/StudentArea.tsx
```

Pastikan Laravel dapat menggantikan:

```text
getCurrentUser()
login
logout
register
authenticated user
profile
role
session/token
```

tanpa mengubah behavior aplikasi.

Gunakan mekanisme authentication Laravel yang sesuai untuk SPA/API.

Jika menggunakan token-based authentication, gunakan solusi Laravel yang sesuai dan aman.

---

# 10. ROLE DAN PERMISSION

Jangan mengubah sistem permission existing.

Project memiliki role:

```text
admin
guru
osis
```

Dan permission yang sudah didefinisikan pada:

```text
src/lib/permissions.ts
```

Pertahankan permission existing.

Minimal periksa:

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

management.view
```

Jangan menghapus permission.

Jangan mengganti nama permission tanpa alasan.

Jangan memberikan akses tambahan kepada role.

Jangan mengurangi akses role.

---

# 11. MIGRASI RBAC

Existing project menggunakan PostgreSQL functions/RPC untuk permission.

Periksa logic seperti:

```text
has_permission
get_my_permissions
guard_profile_role
```

dan fungsi lain pada migration.

Logic tersebut harus dipindahkan ke Laravel.

Implementasikan dengan:

```text
Middleware
Policies
Gates
Services
Database relationship
```

atau kombinasi yang paling sesuai.

Tetapi hasil permission harus sama.

### Contoh

Jika existing:

```text
OSIS tidak boleh mengakses fitur tertentu
```

maka setelah migrasi:

```text
OSIS tetap tidak boleh mengakses fitur tersebut.
```

---

# 12. MIGRASI RPC / POSTGRESQL FUNCTIONS

Jangan menghapus PostgreSQL function/RPC sebelum memahami fungsinya.

Periksa seluruh function pada migration.

Termasuk function yang berkaitan dengan:

```text
handle_new_user
guard_profile_role
has_permission
get_my_permissions
guard_mading_post_insert
guard_mading_post_update
submit_mading_post
review_mading_post
publish_mading_post
admin_create_student
admin_reset_student_pin
get_student_login_email
```

Pahami logic masing-masing.

Kemudian migrasikan logic tersebut ke Laravel dengan behavior yang sama.

Jika function tersebut masih dibutuhkan oleh database dan aman untuk dipertahankan, jangan menghapusnya secara sembarangan.

Prioritasnya adalah behavior tetap sama.

---

# 13. MADING

Mading adalah fitur penting dan memiliki workflow khusus.

Pastikan workflow existing tetap sama:

```text
Student Login
      ↓
Create Mading Post
      ↓
Submit / Review
      ↓
Review
      ↓
Publish
      ↓
Public Mading
```

Pertahankan:

* author
* category
* status
* feedback
* review
* publish
* edit own
* edit all
* permission
* published_at
* created_at
* updated_at

Jangan mengubah workflow.

---

# 14. STUDENT LOGIN

Project memiliki student authentication.

Periksa:

```text
students
student_accounts
get_student_login_email
```

dan implementasi:

```text
StudentLogin.tsx
StudentArea.tsx
```

Migrasikan logic login tersebut ke Laravel.

Jangan mengubah flow login siswa.

Jika existing menggunakan:

```text
NISN
PIN
```

maka flow tersebut harus tetap tersedia.

---

# 15. OSIS

Pertahankan semua functionality OSIS.

Minimal:

```text
OSIS profile
OSIS members
OSIS activities
```

Termasuk:

* view
* create
* edit
* delete
* publish
* permission
* sorting
* tanggal kegiatan
* data relationship

Jangan mengubah behavior.

---

# 16. EKSTRAKURIKULER

Migrasikan:

```text
extracurriculars
```

termasuk:

* CRUD
* slug
* detail
* publish
* permission
* public display
* sorting

Frontend existing harus tetap dapat menampilkan data yang sama.

---

# 17. KESEMAPTAAN

Migrasikan seluruh domain:

```text
kesemaptaan
kesemaptaan_activities
kesemaptaan_schedules
kesemaptaan_instructors
kesemaptaan_achievements
```

Pertahankan seluruh logic CRUD dan permission.

---

# 18. SPMB / PPDB

Jangan mengubah flow SPMB/PPDB.

Periksa seluruh implementasi existing pada:

```text
src/pages/ppdb/
src/pages/Admissions.tsx
Admin.tsx
```

Pertahankan:

* registration
* authentication
* applicant data
* documents
* status
* verification
* admin note
* activity log
* edit
* delete
* upload
* validation
* permission
* filtering
* pagination
* status transition

Jangan membuat flow PPDB baru.

Jangan menyederhanakan flow PPDB.

---

# 19. FILE STORAGE / UPLOAD

Project menggunakan InsForge Storage.

Periksa seluruh penggunaan:

```text
insforge.storage
```

terutama:

```text
ImageField.tsx
ImportModal.tsx
Admin.tsx
PPDB Dashboard
```

Migrasikan ke:

```text
Laravel Storage
```

Tetapi behavior tetap sama.

Pastikan:

* upload
* update
* delete
* URL
* file path
* image
* document
* validation
* file size
* mime type

tetap bekerja.

---

# 20. IMPORT DATA

Project memiliki:

```text
ImportModal.tsx
```

Periksa fitur import yang ada.

Jika menggunakan XLSX:

* jangan menghapus fitur import
* pertahankan format input
* pertahankan validation
* pertahankan proses import
* pertahankan hasil data

Laravel harus dapat menerima data dari frontend dengan behavior yang sama.

---

# 21. API DESIGN

Buat Laravel API yang menggantikan seluruh operasi InsForge.

Contoh pola:

```text
GET    /api/news
GET    /api/news/{slug}

GET    /api/programs
GET    /api/programs/{slug}

GET    /api/facilities
GET    /api/staff
GET    /api/achievements

GET    /api/spmb
GET    /api/osis
GET    /api/osis/members
GET    /api/osis/activities

GET    /api/extracurriculars
GET    /api/extracurriculars/{slug}

GET    /api/kesemaptaan
GET    /api/kesemaptaan/activities
GET    /api/kesemaptaan/schedules
GET    /api/kesemaptaan/instructors
GET    /api/kesemaptaan/achievements

GET    /api/mading/categories
GET    /api/mading/posts
```

Namun jangan menganggap daftar di atas sudah lengkap.

**Audit seluruh project dan buat endpoint berdasarkan penggunaan existing.**

---

# 22. RESPONSE API

Usahakan response Laravel kompatibel dengan data yang sekarang diterima frontend.

Jangan mengubah nama field hanya untuk mengikuti style Laravel.

Misalnya jika frontend existing membutuhkan:

```text
shortName
shortDescription
careerProspects
```

jangan sembarangan mengubah menjadi:

```text
short_name
short_description
career_prospects
```

Jika database menggunakan snake_case tetapi frontend menggunakan camelCase, gunakan mapping/resource di backend agar frontend tidak perlu dirombak.

---

# 23. FALLBACK DATA

Perhatikan bahwa `src/lib/api.ts` memiliki fallback data.

Contohnya:

```text
fetchPublicContent(...)
fetchSpmbContent(...)
fetchOsisProfile(...)
...
```

Jangan menghapus behavior fallback.

Jika API Laravel gagal, behavior frontend harus tetap sama seperti sebelumnya.

---

# 24. HAPUS INSFORGE SETELAH MIGRASI BERHASIL

Setelah seluruh functionality telah berhasil dipindahkan:

Cari dan hapus dependency yang tidak lagi digunakan:

```text
@insforge/sdk
insforge client
InsForge auth
InsForge database
InsForge storage
InsForge configuration
InsForge environment variables
```

Perbarui:

```text
package.json
.env.example
source code
documentation
```

Jangan menghapus sesuatu sebelum penggantinya benar-benar berfungsi.

---

# 25. JANGAN MENGGUNAKAN MOCK DATA

Jangan menyelesaikan migrasi dengan:

```text
mock API
hardcoded response
dummy database
localStorage
temporary JSON
```

Semua data utama harus berasal dari:

```text
Frontend
   ↓
Laravel API
   ↓
PostgreSQL
```

Fallback existing boleh tetap dipertahankan karena itu merupakan behavior frontend existing.

---

# 26. FRONTEND API CLIENT

Setelah Laravel selesai, ubah layer API frontend agar memanggil Laravel.

Idealnya seluruh request backend dipusatkan pada layer seperti:

```text
src/lib/api.ts
```

Jika memungkinkan, jangan menyebarkan fetch logic baru ke banyak halaman.

Namun jangan melakukan refactor besar yang mengubah behavior.

---

# 27. STRUKTUR LARAVEL

Hasil akhir harus benar-benar menjadi backend Laravel.

Gunakan struktur Laravel standar:

```text
app/
├── Http/
│   ├── Controllers/
│   ├── Middleware/
│   └── Requests/
│
├── Models/
├── Policies/
└── Services/

database/
├── migrations/
└── seeders/

routes/
├── api.php
└── web.php

storage/
```

Sesuaikan dengan kebutuhan project.

Jangan membuat struktur aneh hanya untuk meniru backend TypeScript.

---

# 28. JANGAN MEMBUAT PROJECT BARU YANG TERPISAH

Jika memungkinkan, integrasikan Laravel ke project existing secara rapi.

Jangan membuang frontend existing.

Jangan membuat frontend Laravel baru.

Jangan mengganti React dengan Blade.

Frontend React + TypeScript tetap menjadi frontend utama.

Targetnya:

```text
React + TypeScript
        ↓
Laravel REST API
        ↓
PostgreSQL
```

---

# 29. TESTING

Setelah implementasi selesai, lakukan testing nyata.

### Backend

Test:

```text
Database connection
Migrations
Seeders
Authentication
Authorization
RBAC
API
CRUD
Validation
Upload
Delete
Update
```

### Frontend

Test seluruh flow:

```text
Homepage
Public content
News
Programs
Facilities
Staff
Achievements
Management
OSIS
Extracurricular
Kesemaptaan
Mading
Student Login
Student Area
SPMB
PPDB
Admin Panel
Contact
```

### Role

Test:

```text
Admin
Guru
OSIS
Student
Applicant
Guest/Public
```

Pastikan akses setiap role sama seperti sebelum migrasi.

---

# 30. COMPARISON TEST

Sebelum menyatakan selesai, bandingkan behavior:

```text
BEFORE: InsForge
AFTER : Laravel
```

Untuk setiap fitur pastikan:

```text
Input sama
↓
Logic sama
↓
Database result sama
↓
Response equivalent
↓
UI behavior sama
```

Jika ada perbedaan behavior, perbaiki Laravel implementation.

Jangan mengubah frontend untuk menutupi kesalahan migrasi backend kecuali memang diperlukan untuk mengganti API client.

---

# 31. JANGAN REFACTOR BESAR

Selama migrasi:

JANGAN:

* redesign
* mengganti UI
* mengganti React
* mengganti TypeScript
* mengganti PostgreSQL
* mengganti flow
* menghapus fitur
* mengubah permission
* mengubah authentication behavior
* mengubah database behavior
* mengubah business logic
* melakukan optimasi yang mengubah behavior

Fokus hanya:

> **InsForge → Laravel**

---

# 32. URUTAN PENGERJAAN

Kerjakan secara bertahap.

### STEP 1

Audit repository.

### STEP 2

Mapping seluruh:

```text
Tables
Models
Auth
Roles
Permissions
RPC
Storage
API
Features
```

### STEP 3

Buat Laravel backend.

### STEP 4

Migrasikan database schema.

### STEP 5

Migrasikan models + relationships.

### STEP 6

Migrasikan authentication.

### STEP 7

Migrasikan RBAC + permission.

### STEP 8

Migrasikan API/public content.

### STEP 9

Migrasikan Admin CRUD.

### STEP 10

Migrasikan SPMB/PPDB.

### STEP 11

Migrasikan OSIS.

### STEP 12

Migrasikan Extracurricular.

### STEP 13

Migrasikan Kesemaptaan.

### STEP 14

Migrasikan Mading + Student Login.

### STEP 15

Migrasikan Storage/Upload.

### STEP 16

Hubungkan frontend ke Laravel.

### STEP 17

Test seluruh fitur.

### STEP 18

Hapus InsForge dependency setelah semuanya berhasil.

---

# 33. JANGAN LANGSUNG MENGHAPUS KODE LAMA

Selama proses migrasi, jangan langsung menghapus InsForge.

Gunakan pendekatan:

```text
Audit
↓
Implement Laravel
↓
Test Laravel
↓
Switch frontend
↓
Test ulang
↓
Pastikan semua fitur bekerja
↓
Baru hapus InsForge
```

Jangan menghapus InsForge di awal dan membuat project rusak.

---

# 34. ENVIRONMENT

Jangan membaca atau menyalin secret dari `.env` ke source code.

Gunakan `.env.example` sebagai template konfigurasi.

Laravel harus menggunakan environment variable untuk:

```text
APP_KEY
DB_CONNECTION
DB_HOST
DB_PORT
DB_DATABASE
DB_USERNAME
DB_PASSWORD
```

dan konfigurasi lainnya.

Jangan hardcode credentials.

---

# 35. FINAL CHECKLIST

Sebelum selesai, pastikan:

### Backend

* [ ] Laravel berjalan
* [ ] PostgreSQL terhubung
* [ ] Migration berhasil
* [ ] Seeder berhasil
* [ ] Models tersedia
* [ ] Relationships benar
* [ ] API berjalan
* [ ] Authentication berjalan
* [ ] Authorization berjalan
* [ ] RBAC berjalan
* [ ] Permission sama
* [ ] Validation sama
* [ ] Upload berjalan
* [ ] CRUD berjalan

### Features

* [ ] Public website
* [ ] News
* [ ] Programs
* [ ] Facilities
* [ ] Staff
* [ ] Achievements
* [ ] Management
* [ ] SPMB
* [ ] PPDB
* [ ] OSIS
* [ ] Extracurricular
* [ ] Kesemaptaan
* [ ] Mading
* [ ] Student Login
* [ ] Student Area
* [ ] Contact
* [ ] Admin Panel

### Behavior

* [ ] Logic tidak berubah
* [ ] Flow tidak berubah
* [ ] UI tidak berubah
* [ ] Permission tidak berubah
* [ ] Role tidak berubah
* [ ] Database behavior tidak berubah
* [ ] Authentication behavior tidak berubah
* [ ] Upload behavior tidak berubah
* [ ] Fallback behavior tidak berubah

### InsForge

* [ ] Tidak ada API call InsForge
* [ ] Tidak ada InsForge authentication
* [ ] Tidak ada InsForge storage
* [ ] Tidak ada dependency `@insforge/sdk`
* [ ] Tidak ada environment variable InsForge yang tidak digunakan
* [ ] Tidak ada fitur yang masih bergantung pada InsForge

---

# HASIL AKHIR YANG DIINGINKAN

Project harus berakhir seperti ini:

```text
                    SMKN11 WEBSITE
                          │
                          ▼
              ┌─────────────────────┐
              │ React + TypeScript  │
              │ Existing Frontend   │
              └──────────┬──────────┘
                         │
                      REST API
                         │
                         ▼
              ┌─────────────────────┐
              │       Laravel       │
              │                     │
              │ Auth                │
              │ RBAC                │
              │ Permission          │
              │ API                 │
              │ Business Logic      │
              │ Validation          │
              │ Storage             │
              └──────────┬──────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │     PostgreSQL      │
              │ Existing Structure  │
              └─────────────────────┘
```

### Intinya:

```text
INSFORGE → LARAVEL
```

**BUKAN:**

```text
WEBSITE LAMA → WEBSITE BARU
```

Dan bukan:

```text
LOGIC LAMA → LOGIC BARU
```

Melainkan:

```text
LOGIC LAMA
    ↓
IMPLEMENTASI BARU DI LARAVEL
    ↓
BEHAVIOR TETAP SAMA
```

Jika ada bagian yang belum dipahami, **jangan menebak dan jangan mengubah behavior**. Baca implementation existing, migration SQL, component, dan data flow terkait terlebih dahulu.

**Prioritas mutlak:**

1. Behavior existing
2. Logic existing
3. Data existing
4. Permission existing
5. Feature existing
6. Frontend existing
7. Baru kemudian Laravel best practices
