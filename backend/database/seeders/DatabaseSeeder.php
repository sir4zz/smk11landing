<?php

namespace Database\Seeders;

use App\Models\Achievement;
use App\Models\BkkPartner;
use App\Models\ContentRecord;
use App\Models\EducationStaff;
use App\Models\Extracurricular;
use App\Models\Facility;
use App\Models\Faq;
use App\Models\Gallery;
use App\Models\JobVacancy;
use App\Models\GalleryImage;
use App\Models\Kesemaptaan;
use App\Models\KesemaptaanAchievement;
use App\Models\KesemaptaanActivity;
use App\Models\KesemaptaanInstructor;
use App\Models\KesemaptaanSchedule;
use App\Models\MadingCategory;
use App\Models\MadingPost;
use App\Models\News;
use App\Models\Osis;
use App\Models\OsisActivity;
use App\Models\OsisMember;
use App\Models\Permission;
use App\Models\Profile;
use App\Models\Program;
use App\Models\Role;
use App\Models\RolePermission;
use App\Models\SpmbContent;
use App\Models\Staff;
use App\Models\Student;
use App\Models\StudentAccount;
use App\Models\TeacherActivity;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    use \Illuminate\Database\Console\Seeds\WithoutModelEvents;

    public function run(): void
    {
        $this->seedRbac();
        $this->seedAccounts();
        $this->seedContent();
    }

    protected function seedRbac(): void
    {
        $roles = ['admin' => 'Admin', 'guru' => 'Guru', 'osis' => 'OSIS'];

        $roleIds = [];
        foreach ($roles as $slug => $name) {
            $roleIds[$slug] = Role::firstOrCreate(['slug' => $slug], ['name' => $name, 'created_at' => now()])->id;
        }

        $permissions = [
            ['dashboard.view', 'Dashboard - Lihat', 'dashboard'],

            ['osis.view', 'OSIS - Lihat', 'osis'],
            ['osis.create', 'OSIS - Buat', 'osis'],
            ['osis.edit', 'OSIS - Ubah', 'osis'],
            ['osis.delete', 'OSIS - Hapus', 'osis'],
            ['osis.publish', 'OSIS - Publikasi', 'osis'],

            ['osis.activities.view', 'Kegiatan OSIS - Lihat', 'osis.activities'],
            ['osis.activities.create', 'Kegiatan OSIS - Buat', 'osis.activities'],
            ['osis.activities.edit', 'Kegiatan OSIS - Ubah', 'osis.activities'],
            ['osis.activities.delete', 'Kegiatan OSIS - Hapus', 'osis.activities'],

            ['extracurricular.view', 'Ekstrakurikuler - Lihat', 'extracurricular'],
            ['extracurricular.create', 'Ekstrakurikuler - Buat', 'extracurricular'],
            ['extracurricular.edit', 'Ekstrakurikuler - Ubah', 'extracurricular'],
            ['extracurricular.delete', 'Ekstrakurikuler - Hapus', 'extracurricular'],
            ['extracurricular.publish', 'Ekstrakurikuler - Publikasi', 'extracurricular'],

            ['kesemaptaan.view', 'Kesemaptaan - Lihat', 'kesemaptaan'],
            ['kesemaptaan.create', 'Kesemaptaan - Buat', 'kesemaptaan'],
            ['kesemaptaan.edit', 'Kesemaptaan - Ubah', 'kesemaptaan'],
            ['kesemaptaan.delete', 'Kesemaptaan - Hapus', 'kesemaptaan'],
            ['kesemaptaan.publish', 'Kesemaptaan - Publikasi', 'kesemaptaan'],

            ['mading.view', 'Mading - Lihat', 'mading'],
            ['mading.create', 'Mading - Buat', 'mading'],
            ['mading.edit_own', 'Mading - Ubah Karya Sendiri', 'mading'],
            ['mading.edit_all', 'Mading - Ubah Semua Karya', 'mading'],
            ['mading.delete', 'Mading - Hapus', 'mading'],
            ['mading.submit_review', 'Mading - Kirim Review', 'mading'],
            ['mading.review', 'Mading - Review', 'mading'],
            ['mading.publish', 'Mading - Publikasi', 'mading'],

            ['spmb.view', 'SPMB - Lihat', 'spmb'],
            ['spmb.create', 'SPMB - Buat', 'spmb'],
            ['spmb.edit', 'SPMB - Ubah', 'spmb'],
            ['spmb.delete', 'SPMB - Hapus', 'spmb'],
            ['spmb.verify', 'SPMB - Verifikasi', 'spmb'],

            ['gallery.view', 'Galeri - Lihat', 'gallery'],
            ['gallery.create', 'Galeri - Buat', 'gallery'],
            ['gallery.edit', 'Galeri - Ubah', 'gallery'],
            ['gallery.delete', 'Galeri - Hapus', 'gallery'],
            ['gallery.publish', 'Galeri - Publikasi', 'gallery'],

            ['job.view', 'BKK - Lihat', 'bkk'],
            ['job.create', 'BKK - Buat', 'bkk'],
            ['job.edit', 'BKK - Ubah', 'bkk'],
            ['job.delete', 'BKK - Hapus', 'bkk'],
            ['job.publish', 'BKK - Publikasi', 'bkk'],

            ['management.view', 'Manajemen - Lihat', 'management'],
        ];

        $permissionIds = [];
        foreach ($permissions as [$slug, $name, $module]) {
            $permissionIds[$slug] = Permission::firstOrCreate(
                ['slug' => $slug],
                ['name' => $name, 'module' => $module, 'created_at' => now()]
            )->id;
        }

        // Admin: all permissions (mirrors PermissionService admin = full access).
        foreach ($permissionIds as $permissionId) {
            RolePermission::firstOrCreate([
                'role_id' => $roleIds['admin'],
                'permission_id' => $permissionId,
            ]);
        }

        $guruSlugs = [
            'dashboard.view',
            'mading.view', 'mading.create', 'mading.edit_own', 'mading.submit_review',
            'mading.review', 'mading.publish', 'mading.edit_all', 'mading.delete',
            'management.view',
            'osis.view',
            'spmb.view',
            'gallery.view',
            'job.view', 'job.create', 'job.edit', 'job.publish',
        ];

        $osisSlugs = [
            'dashboard.view',
            'osis.view', 'osis.create', 'osis.edit',
            'osis.activities.view', 'osis.activities.create', 'osis.activities.edit',
            'extracurricular.view', 'extracurricular.create', 'extracurricular.edit', 'extracurricular.delete',
            'kesemaptaan.view', 'kesemaptaan.create', 'kesemaptaan.edit', 'kesemaptaan.delete',
            'mading.view', 'mading.create', 'mading.edit_own', 'mading.submit_review',
            'mading.review', 'mading.publish',
            'spmb.view',
            'gallery.view', 'gallery.create', 'gallery.edit', 'gallery.publish',
            'job.view', 'job.create', 'job.edit', 'job.publish',
        ];

        foreach ([['guru', $guruSlugs], ['osis', $osisSlugs]] as [$roleSlug, $slugs]) {
            foreach ($slugs as $slug) {
                if (! isset($permissionIds[$slug])) {
                    continue;
                }
                RolePermission::firstOrCreate([
                    'role_id' => $roleIds[$roleSlug],
                    'permission_id' => $permissionIds[$slug],
                ]);
            }
        }
    }

    protected function seedAccounts(): void
    {
        $accounts = [
            [
                'id' => 'ea54be9b-1229-442c-aa88-a5ff983b8b60',
                'email' => 'admin.test@smkn11.sch.id',
                'password' => 'smkn11admin',
                'name' => 'Admin Test',
                'role' => 'admin',
            ],
            [
                'id' => 'd5c06893-5d35-4681-b86f-2610c911e64a',
                'email' => 'guru.test@smkn11.sch.id',
                'password' => 'smkn11guru',
                'name' => 'Guru Test',
                'role' => 'guru',
            ],
            [
                'id' => '8fbe17ad-4d21-40e2-a79e-82fc0e302581',
                'email' => 'osis.test@smkn11.sch.id',
                'password' => 'smkn11osis',
                'name' => 'OSIS Test',
                'role' => 'osis',
            ],
        ];

        foreach ($accounts as $account) {
            $user = User::updateOrCreate(
                ['id' => $account['id']],
                [
                    'email' => $account['email'],
                    'password' => Hash::make($account['password']),
                    'name' => $account['name'],
                    'profile' => ['name' => $account['name']],
                    'email_verified_at' => now(),
                ]
            );

            Profile::updateOrCreate(
                ['id' => $account['id']],
                [
                    'role' => $account['role'],
                    'name' => $account['name'],
                    'email' => $account['email'],
                    'updated_at' => now(),
                ]
            );
        }

        $studentId = 'da55f59e-1389-4a13-b19e-34c7e62f1a78';
        $studentEmail = 'nisn-1234567890@mading.smkn11.sch.id';

        User::updateOrCreate(
            ['id' => $studentId],
            [
                'email' => $studentEmail,
                'password' => Hash::make('smkn11student'),
                'name' => 'Student Test',
                'profile' => ['name' => 'Student Test'],
                'email_verified_at' => now(),
            ]
        );

        Profile::updateOrCreate(
            ['id' => $studentId],
            [
                'role' => 'student',
                'name' => 'Student Test',
                'email' => $studentEmail,
                'updated_at' => now(),
            ]
        );

        Student::updateOrCreate(
            ['id' => $studentId],
            [
                'nisn' => '1234567890',
                'name' => 'Student Test',
                'class' => 'XII TJKT 1',
                'major' => 'Teknik Jaringan',
            ]
        );

        StudentAccount::updateOrCreate(
            ['id' => $studentId],
            [
                'student_id' => $studentId,
                'email' => $studentEmail,
                'status' => 'active',
            ]
        );
    }

    // ========================================================================
    // CONTENT SEED (mirrors the static datasets formerly in src/data/)
    // ========================================================================

    protected function seedContent(): void
    {
        $this->seedNews();
        $this->seedPrograms();
        $this->seedFacilities();
        $this->seedStaff();
        $this->seedAchievements();
        $this->seedTeacherActivities();
        $this->seedEducationStaff();
        $this->seedSpmb();
        $this->seedOsis();
        $this->seedExtracurriculars();
        $this->seedKesemaptaan();
        $this->seedMading();
        $this->seedGalleries();
        $this->seedFaqs();
        $this->seedJobVacancies();
        $this->seedBkkSettings();
        $this->seedBkkPartners();
        $this->seedHome();
    }

    protected function seedJobVacancies(): void
    {
        $rows = [
            [
                'company_name' => 'PT Teknologi Nusantara',
                'company_logo' => 'https://images.unsplash.com/photo-1614680376593-902f74cf0d41?auto=format&fit=crop&w=200&q=80',
                'position' => 'Network Administrator',
                'slug' => 'network-administrator-pt-teknologi-nusantara',
                'company_description' => 'PT Teknologi Nusantara adalah perusahaan penyedia layanan infrastruktur IT dan telekomunikasi yang berpusat di Jakarta dan melayani klien korporasi di seluruh Indonesia.',
                'job_description' => 'Mengelola, memantau, dan menjaga stabilitas jaringan perusahaan serta memberikan dukungan teknis kepada pengguna internal.',
                'responsibilities' => 'Melakukan konfigurasi dan maintenance perangkat jaringan (router, switch, firewall), memonitor performa jaringan, mengelola VPN dan akses pengguna, serta membuat dokumentasi jaringan.',
                'requirements' => 'Lulusan SMK jurusan TJKT (Teknik Jaringan Komputer dan Telekomunikasi) atau sederajat, memahami MikroTik dan Cisco, menguasai TCP/IP dan VLAN, serta memiliki kemampuan troubleshooting jaringan.',
                'benefits' => 'Gaji UMK, BPJS Ketenagakerjaan dan Kesehatan, tunjangan transportasi, kesempatan pelatihan bersertifikat, dan jenjang karir yang jelas.',
                'education' => 'Minimal SMK / SMA sederajat',
                'experience' => 'Fresh graduate dipersilakan',
                'major' => ['Teknik Jaringan Komputer dan Telekomunikasi'],
                'city' => 'Jakarta',
                'location' => 'Kuningan, Jakarta Selatan',
                'employment_type' => 'full_time',
                'registration_link' => 'https://career.teknonusantara.co.id',
                'hr_contact' => '0812-3456-7890 (HRD Tekno Nusantara)',
                'deadline' => '2026-09-30',
                'status' => 'open',
                'is_published' => true,
            ],
            [
                'company_name' => 'CV Kreatif Desain Studio',
                'company_logo' => 'https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=200&q=80',
                'position' => 'Desainer Grafis',
                'slug' => 'desainer-grafis-cv-kreatif-desain-studio',
                'company_description' => 'CV Kreatif Desain Studio adalah studio kreatif yang melayani kebutuhan branding, desain kemasan, dan konten digital untuk UMKM dan perusahaan di wilayah Tangerang.',
                'job_description' => 'Membuat desain grafis untuk kebutuhan branding klien, media sosial, dan materi cetak sesuai brief yang diberikan.',
                'responsibilities' => 'Membuat layout desain (poster, brosur, konten sosial media), berkoordinasi dengan tim kreatif, dan menjaga kualitas serta konsistensi brand klien.',
                'requirements' => 'Lulusan SMK jurusan DKV (Desain Komunikasi Visual), mahir menggunakan Adobe Photoshop, CorelDRAW, dan Adobe Illustrator, kreatif serta memiliki portofolio desain.',
                'benefits' => 'Gaji sesuai UMK Tangerang, insentif per proyek, suasana kerja kreatif dan kekeluargaan, serta kesempatan mengembangkan portofolio.',
                'education' => 'Minimal SMK jurusan DKV',
                'experience' => '0-1 tahun',
                'major' => ['Desain Komunikasi Visual'],
                'city' => 'Tangerang',
                'location' => 'Balaraja, Kabupaten Tangerang',
                'employment_type' => 'full_time',
                'registration_link' => 'https://forms.gle/kreatifdesainstudio',
                'hr_contact' => 'HRD Kreatif Desain Studio (0857-1122-3344)',
                'deadline' => '2026-09-15',
                'status' => 'open',
                'is_published' => true,
            ],
            [
                'company_name' => 'PT Astra Motor Sales Operation',
                'company_logo' => 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=200&q=80',
                'position' => 'Mekanik Sepeda Motor',
                'slug' => 'mekanik-sepeda-motor-pt-astra-motor',
                'company_description' => 'PT Astra Motor Sales Operation adalah dealer resmi sepeda motor terkemuka dengan jaringan bengkel servis resmi di berbagai kota, termasuk Tangerang.',
                'job_description' => 'Melakukan perawatan dan perbaikan sepeda motor sesuai standar dealer resmi, memastikan kepuasan pelanggan atas kualitas layanan.',
                'responsibilities' => 'Melakukan servis berkala, perbaikan mesin dan kelistrikan sepeda motor, serta mengisi laporan pengerjaan sesuai standar operasional.',
                'requirements' => 'Lulusan SMK jurusan Teknik Otomotif atau Teknik Sepeda Motor, memahami sistem injeksi (EFI/PGM-FI), memiliki kedisiplinan tinggi, dan bersedia mengikuti pelatihan di dealer.',
                'benefits' => 'Gaji pokok + tunjangan, BPJS, fasilitas makan, serta pelatihan dan sertifikasi mekanik resmi.',
                'education' => 'Minimal SMK Teknik Otomotif',
                'experience' => 'Fresh graduate dipersilakan',
                'major' => ['Teknik Otomotif'],
                'city' => 'Tangerang',
                'location' => 'Pasar Kemis, Kabupaten Tangerang',
                'employment_type' => 'full_time',
                'registration_link' => 'https://recruitment.astra-motor.com',
                'hr_contact' => 'HRD Astra Motor Tangerang (021-592-0000)',
                'deadline' => '2026-08-31',
                'status' => 'open',
                'is_published' => true,
            ],
            [
                'company_name' => 'PT PLN (Persero) Tangerang',
                'company_logo' => 'https://images.unsplash.com/photo-1544882657-fbd6a4f9e5e9?auto=format&fit=crop&w=200&q=80',
                'position' => 'Asisten Teknisi Instalasi Listrik',
                'slug' => 'asisten-teknisi-instalasi-listrik-pln',
                'company_description' => 'PT PLN (Persero) adalah Badan Usaha Milik Negara yang bergerak di bidang kelistrikan dan menjadi tulang punggung penyedia tenaga listrik di Indonesia.',
                'job_description' => 'Membantu teknisi senior dalam pekerjaan pemasangan, pemeliharaan, dan perbaikan instalasi listrik di wilayah kerja PLTU/UP3 Tangerang.',
                'responsibilities' => 'Membantu pemasangan jaringan dan instalasi, melakukan pemeliharaan rutin alat ukur, serta mendampingi teknisi saat kunjungan lapangan.',
                'requirements' => 'Lulusan SMK jurusan TITL (Teknik Ketenagalistrikan) atau Teknik Elektro, memahami dasar instalasi listrik dan K3 kelistrikan, serta siap bekerja di lapangan.',
                'benefits' => 'Honorarium menarik, sertifikat pengalaman kerja, BPJS, dan peluang menjadi pegawai kontrak.',
                'education' => 'Minimal SMK TITL',
                'experience' => 'Fresh graduate dipersilakan',
                'major' => ['Teknik Ketenagalistrikan'],
                'city' => 'Tangerang',
                'location' => 'Kawasan Industri Tangerang',
                'employment_type' => 'contract',
                'registration_link' => 'https://rekrutmen.pln.co.id',
                'hr_contact' => 'HRD PT PLN UP3 Tangerang',
                'deadline' => '2026-09-10',
                'status' => 'open',
                'is_published' => true,
            ],
            [
                'company_name' => 'PT Bank Banten Syariah',
                'company_logo' => 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=200&q=80',
                'position' => 'Teller / Customer Service',
                'slug' => 'teller-customer-service-bank-banten-syariah',
                'company_description' => 'PT Bank Banten Syariah adalah bank pembangunan daerah yang berkomitmen melayani kebutuhan perbankan masyarakat Banten dengan prinsip syariah.',
                'job_description' => 'Melayani nasabah untuk transaksi keuangan (teller) serta memberikan informasi dan penanganan keluhan (customer service) di kantor cabang.',
                'responsibilities' => 'Melayani transaksi setoran dan penarikan tunai, memverifikasi dokumen, memberikan informasi produk perbankan, serta menjaga kerahasiaan data nasabah.',
                'requirements' => 'Lulusan SMK jurusan MPLB (Manajemen Perkantoran dan Layanan Bisnis) atau Akuntansi, komunikatif, teliti, rapi, dan berpenampilan menarik.',
                'benefits' => 'Gaji UMK + tunjangan, BPJS Kesehatan dan Ketenagakerjaan, THR, serta kesempatan karier di perbankan.',
                'education' => 'Minimal SMK MPLB',
                'experience' => 'Fresh graduate dipersilakan',
                'major' => ['Manajemen Perkantoran dan Layanan Bisnis'],
                'city' => 'Tangerang',
                'location' => 'Kantor Cabang Tangerang Kota',
                'employment_type' => 'contract',
                'registration_link' => 'https://karier.bankbantensyariah.co.id',
                'hr_contact' => 'HRD Bank Banten Syariah (021-5577-1234)',
                'deadline' => '2026-08-25',
                'status' => 'closing',
                'is_published' => true,
            ],
            [
                'company_name' => 'CV Busana Nusantara',
                'company_logo' => 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=200&q=80',
                'position' => 'Operator Konveksi & Jahit',
                'slug' => 'operator-konveksi-jahit-cv-busana-nusantara',
                'company_description' => 'CV Busana Nusantara adalah konveksi dan rumah produksi busana yang memproduksi pakaian jadi untuk kebutuhan lokal dan ekspor dari Kabupaten Tangerang.',
                'job_description' => 'Mengerjakan proses produksi busana mulai dari pemotongan pola, menjahit, hingga quality control hasil produksi.',
                'responsibilities' => 'Menjahit komponen busana sesuai standar, melakukan quality control, dan membantu proses finishing serta packing produk.',
                'requirements' => 'Lulusan SMK jurusan Tata Busana, mampu menjahit dengan mesin jahit industri, teliti, dan disiplin dalam bekerja.',
                'benefits' => 'Gaji pokok + upah lembur, bonus produksi, jaminan sosial, dan makan siang.',
                'education' => 'Minimal SMK Tata Busana',
                'experience' => 'Fresh graduate dipersilakan',
                'major' => ['Busana'],
                'city' => 'Tangerang',
                'location' => 'Rajeg, Kabupaten Tangerang',
                'employment_type' => 'full_time',
                'registration_link' => 'https://wa.me/628111223344',
                'hr_contact' => 'Bu Nita (0811-1223-344)',
                'deadline' => '2026-08-20',
                'status' => 'closing',
                'is_published' => true,
            ],
            [
                'company_name' => 'PT Multimedia Kreatif Indonesia',
                'company_logo' => 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=200&q=80',
                'position' => 'Videografer & Editor (Magang)',
                'slug' => 'videografer-editor-magang-pt-multimedia-kreatif',
                'company_description' => 'PT Multimedia Kreatif Indonesia merupakan production house yang memproduksi video promosi, dokumentasi acara, dan konten digital untuk berbagai merek nasional.',
                'job_description' => 'Mendukung tim produksi dalam pengambilan gambar dan editing video untuk berbagai kebutuhan klien.',
                'responsibilities' => 'Membantu persiapan peralatan produksi, melakukan pengambilan gambar, dan mengedit video sesuai brief menggunakan Adobe Premiere atau CapCut.',
                'requirements' => 'Siswa SMK jurusan DKV atau Multimedia yang sedang/sudah menempuh PKL, menguasai dasar videografi dan editing video, serta kreatif.',
                'benefits' => 'Uang saku magang, sertifikat pengalaman kerja, kemungkinan diangkat sebagai karyawan kontrak, dan portofolio produksi.',
                'education' => 'SMK DKV / Multimedia',
                'experience' => 'Magang / fresh graduate',
                'major' => ['Desain Komunikasi Visual'],
                'city' => 'Jakarta',
                'location' => 'Kebayoran Baru, Jakarta Selatan',
                'employment_type' => 'internship',
                'registration_link' => 'https://forms.gle/multimediakreatif-magang',
                'hr_contact' => 'HRD Multimedia Kreatif (0813-9988-7766)',
                'deadline' => '2026-10-15',
                'status' => 'open',
                'is_published' => true,
            ],
            [
                'company_name' => 'PT Jaringan Cepat Indonesia',
                'company_logo' => 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?auto=format&fit=crop&w=200&q=80',
                'position' => 'Teknisi Fiber Optik',
                'slug' => 'teknisi-fiber-optik-pt-jaringan-cepat',
                'company_description' => 'PT Jaringan Cepat Indonesia adalah penyedia layanan internet rumah (ISP) yang memperluas jaringan fiber optik di wilayah Tangerang dan sekitarnya.',
                'job_description' => 'Melakukan instalasi, penyambungan, dan pemeliharaan jaringan fiber optik untuk pelanggan rumah dan korporasi.',
                'responsibilities' => 'Instalasi kabel fiber optik (splicing), setting modem/ont, penanganan gangguan pelanggan, dan pelaporan pekerjaan harian.',
                'requirements' => 'Lulusan SMK TJKT, memahami splicing fiber optik, troubleshooting jaringan, serta mampu bekerja di lapangan dan berkomunikasi baik dengan pelanggan.',
                'benefits' => 'Gaji UMK + insentif, tunjangan transportasi, BPJS, dan peralatan kerja lengkap.',
                'education' => 'Minimal SMK TJKT',
                'experience' => '0-1 tahun',
                'major' => ['Teknik Jaringan Komputer dan Telekomunikasi'],
                'city' => 'Tangerang',
                'location' => 'Jayanti, Kabupaten Tangerang',
                'employment_type' => 'full_time',
                'registration_link' => 'https://karier.jaringancepat.id',
                'hr_contact' => 'HRD Jaringan Cepat (0812-2233-4455)',
                'deadline' => '2026-09-20',
                'status' => 'open',
                'is_published' => true,
            ],
            [
                'company_name' => 'PT Sentral Mesin Otomotif',
                'company_logo' => 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=200&q=80',
                'position' => 'Service Advisor',
                'slug' => 'service-advisor-pt-sentral-mesin-otomotif',
                'company_description' => 'PT Sentral Mesin Otomotif adalah bengkel perawatan kendaraan roda empat yang berlokasi di Tangerang dengan standar pelayanan profesional.',
                'job_description' => 'Melayani pelanggan yang datang melakukan servis, mendiagnosis kebutuhan perawatan, berkoordinasi dengan mekanik, dan memastikan kepuasan pelanggan.',
                'responsibilities' => 'Menerima keluhan dan kebutuhan pelanggan, membuat estimasi biaya, menghubungkan pelanggan dengan mekanik, serta follow-up hasil servis.',
                'requirements' => 'Lulusan SMK Teknik Otomotif, komunikatif, jujur, mampu menjelaskan teknis mesin secara sederhana, dan memiliki pelayanan prima.',
                'benefits' => 'Gaji UMK + komisi, BPJS, tunjangan makan, dan kesempatan mengikuti pelatihan manajemen bengkel.',
                'education' => 'Minimal SMK Teknik Otomotif',
                'experience' => '0-1 tahun',
                'major' => ['Teknik Otomotif'],
                'city' => 'Tangerang',
                'location' => 'Cikupa, Kabupaten Tangerang',
                'employment_type' => 'full_time',
                'registration_link' => 'https://career.sentralmesin.co.id',
                'hr_contact' => 'HRD Sentral Mesin (0856-9911-2233)',
                'deadline' => '2026-08-15',
                'status' => 'closing',
                'is_published' => true,
            ],
            [
                'company_name' => 'PT Listrik Bangun Mandiri',
                'company_logo' => 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?auto=format&fit=crop&w=200&q=80',
                'position' => 'Instalatir Listrik Gedung',
                'slug' => 'instalatir-listrik-gedung-pt-listrik-bangun-mandiri',
                'company_description' => 'PT Listrik Bangun Mandiri adalah kontraktor kelistrikan yang menangani instalasi listrik gedung komersial dan hunian di Jabodetabek.',
                'job_description' => 'Melaksanakan pemasangan instalasi listrik penerangan dan tenaga pada proyek gedung sesuai gambar dan standar K3.',
                'responsibilities' => 'Memasang panel listrik, kabel instalasi, dan stop kontak, melakukan pengecekan dan testing instalasi, serta menjaga keselamatan kerja di lokasi proyek.',
                'requirements' => 'Lulusan SMK TITL, memahami gambar instalasi listrik dan K3, siap bekerja di ketinggian, serta memiliki lisensi SKTT (akan difasilitasi).',
                'benefits' => 'Gaji proyek + tunjangan, fasilitas asuransi kecelakaan kerja, dan pelatihan lisensi kelistrikan.',
                'education' => 'Minimal SMK TITL',
                'experience' => 'Fresh graduate dipersilakan',
                'major' => ['Teknik Ketenagalistrikan'],
                'city' => 'Jakarta',
                'location' => 'Berbagai lokasi proyek Jabodetabek',
                'employment_type' => 'contract',
                'registration_link' => 'https://karier.lbm.co.id',
                'hr_contact' => 'HRD Listrik Bangun Mandiri (021-2200-9988)',
                'deadline' => '2026-10-01',
                'status' => 'open',
                'is_published' => true,
            ],
            [
                'company_name' => 'PT Ritel Makmur Bersama',
                'company_logo' => 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&w=200&q=80',
                'position' => 'Admin & Kasir Minimarket',
                'slug' => 'admin-kasir-minimarket-pt-ritel-makmur',
                'company_description' => 'PT Ritel Makmur Bersama adalah perusahaan ritel modern yang mengoperasikan jaringan minimarket di wilayah Banten dan sekitarnya.',
                'job_description' => 'Melayani transaksi kasir, mengelola administrasi toko, serta menjaga kerapihan dan ketersediaan stok barang.',
                'responsibilities' => 'Proses pembayaran pelanggan, rekap laporan penjualan harian, input data stok, dan membantu pelayanan pelanggan di toko.',
                'requirements' => 'Lulusan SMK MPLB atau Akuntansi, teliti, jujur, komunikatif, dan bersedia bekerja dengan sistem shift.',
                'benefits' => 'Gaji UMK + tunjangan, BPJS, bonus penjualan, dan jenjang karir hingga kepala toko.',
                'education' => 'Minimal SMK MPLB',
                'experience' => 'Fresh graduate dipersilakan',
                'major' => ['Manajemen Perkantoran dan Layanan Bisnis'],
                'city' => 'Tangerang',
                'location' => 'Beberapa cabang di Kabupaten Tangerang',
                'employment_type' => 'full_time',
                'registration_link' => 'https://recruitment.ritelmakmur.co.id',
                'hr_contact' => 'HRD Ritel Makmur (0857-3344-5566)',
                'deadline' => '2026-09-25',
                'status' => 'open',
                'is_published' => true,
            ],
            [
                'company_name' => 'PT Garmen Sejahtera',
                'company_logo' => 'https://images.unsplash.com/photo-1571945153237-4929e783af4a?auto=format&fit=crop&w=200&q=80',
                'position' => 'Quality Control Produk Garmen (Magang)',
                'slug' => 'quality-control-garmen-magang-pt-garmen-sejahtera',
                'company_description' => 'PT Garmen Sejahtera adalah pabrik garmen berorientasi ekspor yang memproduksi berbagai jenis pakaian jadi dengan standar kualitas internasional.',
                'job_description' => 'Melakukan pemeriksaan kualitas produk garmen sebelum packing untuk memastikan celah produk yang cacat tidak lolos ke konsumen.',
                'responsibilities' => 'Memeriksa hasil jahitan dan material, mencatat produk cacat (defect), memberikan feedback ke bagian produksi, dan membantu proses packing.',
                'requirements' => 'Siswa SMK Tata Busana yang sedang melaksanakan PKL atau lulusan baru, teliti, dan memahami dasar knowledge produk garmen.',
                'benefits' => 'Uang saku, sertifikat PKL, penilaian kinerja untuk rekomendasi kerja, dan pengalaman industri garmen ekspor.',
                'education' => 'SMK Tata Busana',
                'experience' => 'Magang / fresh graduate',
                'major' => ['Busana'],
                'city' => 'Tangerang',
                'location' => 'Kawasan Industri Jatake, Tangerang',
                'employment_type' => 'internship',
                'registration_link' => 'https://forms.gle/qc-garmen-sejahtera',
                'hr_contact' => 'HRD Garmen Sejahtera (021-5932-7788)',
                'deadline' => '2026-10-31',
                'status' => 'open',
                'is_published' => true,
            ],
            [
                'company_name' => 'PT Garda Nusa Teknologi',
                'company_logo' => 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=200&q=80',
                'position' => 'IT Support Intern',
                'slug' => 'it-support-intern-pt-garda-nusa-teknologi',
                'company_description' => 'PT Garda Nusa Teknologi adalah perusahaan penyedia solusi keamanan siber dan manajemen infrastruktur TI untuk sektor pemerintahan dan swasta.',
                'job_description' => 'Memberikan dukungan teknis harian untuk perangkat keras dan perangkat lunak karyawan perusahaan serta membantu administrasi sistem.',
                'responsibilities' => 'Menangani tiket helpdesk, instalasi dan konfigurasi perangkat, troubleshooting komputer dan jaringan, serta dokumentasi inventaris.',
                'requirements' => 'Lulusan SMK TJKT atau setara, memahami instalasi Windows/Linux, dasar jaringan LAN, dan memiliki sikap responsif serta mau belajar.',
                'benefits' => 'Uang saku magang, sertifikat, mentoring oleh senior IT, dan kesempatan menjadi karyawan tetap.',
                'education' => 'Minimal SMK TJKT',
                'experience' => 'Magang / fresh graduate',
                'major' => ['Teknik Jaringan Komputer dan Telekomunikasi', 'Desain Komunikasi Visual'],
                'city' => 'Jakarta',
                'location' => 'SCBD, Jakarta Selatan',
                'employment_type' => 'internship',
                'registration_link' => 'https://career.gardanusa.co.id',
                'hr_contact' => 'HRD Garda Nusa (0813-5566-7788)',
                'deadline' => '2026-11-15',
                'status' => 'open',
                'is_published' => true,
            ],
        ];

        foreach ($rows as $row) {
            JobVacancy::updateOrCreate(['slug' => $row['slug']], $row);
        }
    }

    protected function seedBkkSettings(): void
    {
        ContentRecord::updateOrCreate(
            ['content_type' => 'bkk_home'],
            ['data' => [
                'banner' => [
                    'title' => 'Bursa Kerja Khusus (BKK)',
                    'subtitle' => 'Pusat layanan informasi lowongan kerja, penyaluran lulusan, dan bimbingan karir SMKN 11 Kabupaten Tangerang',
                    'image' => 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1600&q=80',
                ],
                'about' => [
                    'title' => 'Apa itu BKK SMKN 11 Kabupaten Tangerang?',
                    'subtitle' => 'Menghubungkan alumni dengan dunia kerja',
                    'paragraphs' => [
                        'Bursa Kerja Khusus (BKK) adalah unit layanan di SMKN 11 Kabupaten Tangerang yang memfasilitasi penempatan lulusan ke dunia usaha dan dunia industri (DUDI). Melalui BKK, alumni dapat mengakses informasi lowongan kerja yang relevan dengan kompetensi keahlian mereka.',
                        'Kami bekerja sama dengan berbagai perusahaan mitra untuk memastikan lulusan mendapatkan peluang karir terbaik, mulai dari lowongan full time, kontrak, hingga program magang.',
                    ],
                ],
                'services' => [
                    ['title' => 'Informasi Lowongan Kerja', 'description' => 'Menyediakan informasi lowongan kerja terbaru dari perusahaan mitra yang sesuai dengan kompetensi lulusan.'],
                    ['title' => 'Penyaluran Lulusan', 'description' => 'Menjembatani alumni dengan dunia usaha dan industri melalui rekrutmen langsung maupun kerja sama mitra.'],
                    ['title' => 'Bimbingan Karir', 'description' => 'Membantu siswa dan alumni mempersiapkan diri memasuki dunia kerja, termasuk penyusunan lamaran dan wawancara.'],
                ],
            ]]
        );

        ContentRecord::updateOrCreate(
            ['content_type' => 'bkk_contact'],
            ['data' => [
                'whatsapp' => '0812 9922 0831',
                'whatsapp_link' => 'https://wa.me/6281299220831',
                'email' => 'admin@smkn11kabtang.sch.id',
                'location' => 'Kp. Saradan RT. 03/01, Desa Pangkat, Kec. Jayanti, Kab. Tangerang, Banten 15610',
                'hours' => 'Senin - Jumat, 07.00 - 15.00 WIB',
            ]]
        );
    }

    protected function seedBkkPartners(): void
    {
        $rows = [
            ['name' => 'PT Teknologi Nusantara', 'industry' => 'Teknologi Informasi & Telekomunikasi', 'location' => 'Jakarta', 'logo' => 'https://images.unsplash.com/photo-1614680376593-902f74cf0d41?auto=format&fit=crop&w=200&q=80'],
            ['name' => 'CV Kreatif Desain Studio', 'industry' => 'Desain & Kreatif', 'location' => 'Tangerang', 'logo' => 'https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=200&q=80'],
            ['name' => 'PT Astra Motor Sales Operation', 'industry' => 'Otomotif', 'location' => 'Tangerang', 'logo' => 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=200&q=80'],
            ['name' => 'PT PLN (Persero) Tangerang', 'industry' => 'Energi & Kelistrikan', 'location' => 'Tangerang', 'logo' => 'https://images.unsplash.com/photo-1544882657-fbd6a4f9e5e9?auto=format&fit=crop&w=200&q=80'],
            ['name' => 'PT Bank Banten Syariah', 'industry' => 'Perbankan', 'location' => 'Tangerang', 'logo' => 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=200&q=80'],
            ['name' => 'CV Busana Nusantara', 'industry' => 'Tekstil & Garmen', 'location' => 'Tangerang', 'logo' => 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=200&q=80'],
            ['name' => 'PT Multimedia Kreatif Indonesia', 'industry' => 'Media & Kreatif', 'location' => 'Jakarta', 'logo' => 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=200&q=80'],
            ['name' => 'PT Jaringan Cepat Indonesia', 'industry' => 'Telekomunikasi', 'location' => 'Tangerang', 'logo' => 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?auto=format&fit=crop&w=200&q=80'],
            ['name' => 'PT Sentral Mesin Otomotif', 'industry' => 'Otomotif', 'location' => 'Tangerang', 'logo' => 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=200&q=80'],
            ['name' => 'PT Listrik Bangun Mandiri', 'industry' => 'Konstruksi & Kelistrikan', 'location' => 'Jakarta', 'logo' => 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?auto=format&fit=crop&w=200&q=80'],
            ['name' => 'PT Ritel Makmur Bersama', 'industry' => 'Ritel', 'location' => 'Tangerang', 'logo' => 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&w=200&q=80'],
            ['name' => 'PT Garmen Sejahtera', 'industry' => 'Tekstil & Garmen', 'location' => 'Tangerang', 'logo' => 'https://images.unsplash.com/photo-1571945153237-4929e783af4a?auto=format&fit=crop&w=200&q=80'],
            ['name' => 'PT Garda Nusa Teknologi', 'industry' => 'Teknologi Informasi', 'location' => 'Jakarta', 'logo' => 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=200&q=80'],
        ];

        foreach ($rows as $index => $row) {
            BkkPartner::updateOrCreate(
                ['name' => $row['name']],
                [
                    'industry' => $row['industry'],
                    'location' => $row['location'],
                    'logo' => $row['logo'],
                    'description' => 'Perusahaan mitra BKK SMKN 11 Kabupaten Tangerang yang membuka lowongan kerja bagi lulusan sekolah.',
                    'is_active' => true,
                    'sort_order' => $index,
                ]
            );
        }
    }

    protected function seedHome(): void
    {
        ContentRecord::updateOrCreate(
            ['content_type' => 'home'],
            ['data' => [
                'hero' => ['images' => ['https://images.unsplash.com/photo-1591123120675-6f7f1aae0e5b?w=500&auto=format&fit=crop&q=60', 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1600&q=80', 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1600&q=80'], 'frame_image' => 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1600&q=80', 'description' => 'Sekolah kejuruan favorit yang menyiapkan lulusan unggul, berkarakter, dan memiliki kompetensi tinggi sesuai kebutuhan industri masa depan.', 'accreditation' => 'Peringkat B', 'facility_title' => 'Fasilitas Modern', 'facility_description' => 'Mendukung penuh kompetensi siswa di era digital.'],
                'welcome' => ['image' => 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=800', 'principal_name' => 'Emma Sukmayati', 'principal_title' => 'Kepala SMKN 11 Kab. Tangerang', 'title' => 'Selamat Datang di Portal Resmi SMKN 11 Kabupaten Tangerang', 'paragraphs' => ['Puji syukur kita panjatkan ke hadirat Allah SWT atas rahmat dan karunia-Nya. Di era digitalisasi dan disrupsi teknologi saat ini, pendidikan vokasi memegang peran krusial dalam mencetak generasi muda yang tidak hanya kompeten, tetapi juga memiliki karakter dan daya adaptasi yang tinggi.', 'SMKN 11 Kabupaten Tangerang berkomitmen penuh untuk menjadi lembaga pendidikan yang inovatif, berdaya saing global, dan berakar pada nilai-nilai luhur bangsa. Melalui sinkronisasi kurikulum dengan industri, kami berupaya memastikan lulusan kami siap menghadapi tantangan dunia kerja masa depan.'], 'quote' => '"SMK BISA, SMK HEBAT, Vokasi Kuat Menguatkan Indonesia!"'],
                'about' => ['title' => 'Tentang SMKN 11 Kabupaten Tangerang', 'subtitle' => 'Sekolah vokasi yang menyiapkan lulusan unggul, kompeten, dan siap bersaing di dunia kerja.', 'paragraphs' => ['SMKN 11 Kabupaten Tangerang adalah lembaga pendidikan kejuruan negeri yang berdiri pada tahun 2013 dan berkomitmen mencetak siswa berprestasi, berakhlaqul karimah, dan memiliki kompetensi sesuai kebutuhan industri.', 'Berlokasi di Kp. Saradan, Desa Pangkat, Kecamatan Jayanti, sekolah ini memiliki 6 program keahlian unggulan dengan 1.124 siswa aktif dan 51 tenaga pengajar profesional yang berdedikasi.', 'Dengan akreditasi B dan didukung fasilitas laboratorium, bengkel, serta lingkungan belajar yang kondusif, lulusan kami tidak hanya siap bekerja, tetapi juga memiliki jiwa kewirausahaan dan akhlak mulia yang kuat.'], 'card_label' => 'Sekolah kami', 'card_title' => 'Lingkungan belajar yang memotivasi', 'quote' => '"Kami terus mendorong setiap siswa untuk tumbuh menjadi pribadi yang unggul, disiplin, dan siap memberikan kontribusi nyata bagi masyarakat dan bangsa."', 'location' => 'Kabupaten Tangerang, Banten'],
                'stats' => [['value' => '1.124+', 'label' => 'Siswa Aktif'], ['value' => '51+', 'label' => 'Tenaga Pengajar'], ['value' => '6', 'label' => 'Program Keahlian'], ['value' => '33', 'label' => 'Rombel']],
                'social' => ['instagram' => 'https://instagram.com/smkn11kabtangerang', 'facebook' => 'https://facebook.com/smkn11kabtangerang', 'tiktok' => 'https://tiktok.com/@smkn11kabtangerang', 'email' => 'admin@smkn11kabtang.sch.id'],
            ]]
        );
    }

    protected function seedNews(): void
    {
        $rows = [
            [
                'title' => 'Siswa SMKN 11 Kabupaten Tangerang Raih Medali Ajang Prestasi 2025',
                'slug' => 'ajang-prestasi-2025',
                'date' => '2025-10-15',
                'excerpt' => 'Febriyani, siswa SMKN 11 Kabupaten Tangerang, berhasil meraih medali perak pada Ajang Prestasi SMK Tingkat Kabupaten Tangerang tahun 2025.',
                'content' => '<p>Prestasi membanggakan kembali diraih oleh siswa SMKN 11 Kabupaten Tangerang. Febriyani berhasil meraih medali perak pada Ajang Prestasi SMK Tingkat Kabupaten Tangerang tahun 2025 yang diselenggarakan di Sub Rayon 03.</p><p>Keberhasilan ini merupakan buah dari persiapan matang dan bimbingan intensif dari para guru pembimbing. "Febriyani menunjukkan dedikasi yang luar biasa dan penguasaan materi yang sangat baik," ujar pembimbing.</p><p>Prestasi ini menjadi motivasi bagi siswa lainnya untuk terus berprestasi di berbagai ajang kompetisi. Pihak sekolah berkomitmen penuh untuk memberikan dukungan fasilitas dan pembimbingan intensif agar siswa dapat terus menorehkan prestasi gemilang.</p>',
                'thumbnail' => 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=900&q=80',
                'category' => 'Prestasi',
                'author' => 'Tim Humas',
            ],
            [
                'title' => 'Penerimaan Peserta Didik Baru (PPDB) Tahun Ajaran 2026/2027 Segera Dibuka',
                'slug' => 'info-ppdb-2026',
                'date' => '2026-06-15',
                'excerpt' => 'Informasi lengkap terkait jadwal, persyaratan, dan alur pendaftaran PPDB SMKN 11 Kabupaten Tangerang tahun ajaran 2026/2027.',
                'content' => '<p>Penerimaan Peserta Didik Baru (PPDB) SMKN 11 Kabupaten Tangerang tahun ajaran 2026/2027 akan segera dibuka secara online (daring) melalui portal resmi PPDB Provinsi Banten. Pendaftaran tahap pertama direncanakan mulai tanggal 20 hingga 25 Juni 2026.</p><p>Untuk tahun ini, SMKN 11 Kabupaten Tangerang membuka pendaftaran untuk 6 Program Keahlian, yaitu TJKT (Teknik Jaringan Komputer dan Telekomunikasi), DKV (Desain Komunikasi Visual), Teknik Otomotif, TITL (Teknik Ketenagalistrikan), MPLB (Manajemen Perkantoran dan Layanan Bisnis), dan Busana. Daya tampung total diperkirakan mencapai 400 siswa yang akan terbagi dalam 11 rombongan belajar. Jalur pendaftaran meliputi jalur zonasi, prestasi akademik/non-akademik, afirmasi, dan perpindahan tugas orang tua.</p><p>Calon peserta didik dan orang tua diimbau untuk menyiapkan dokumen persyaratan seperti SKL, Kartu Keluarga, dan sertifikat prestasi (jika ada) jauh-jauh hari. Informasi petunjuk teknis pendaftaran dapat diunduh melalui halaman utama website ini.</p>',
                'thumbnail' => 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=900&q=80',
                'category' => 'Informasi',
                'author' => 'Panitia PPDB',
            ],
            [
                'title' => 'Kunjungan Industri Jurusan Teknik Otomotif ke Pabrik Perakitan Mobil',
                'slug' => 'kunjungan-industri-otomotif',
                'date' => '2026-05-10',
                'excerpt' => 'Siswa kelas XI Teknik Otomotif mengikuti kegiatan Kunjungan Industri (KI) ke salah satu pabrik perakitan mobil ternama di Cikarang.',
                'content' => '<p>Dalam rangka menyelaraskan kurikulum dengan dunia industri, sebanyak 65 siswa kelas XI jurusan Teknik Otomotif beserta guru pendamping melaksanakan Kunjungan Industri (KI) ke sebuah pabrik perakitan mobil skala internasional di kawasan industri Cikarang pada hari Rabu lalu.</p><p>Selama kunjungan, para siswa diajak mengelilingi fasilitas produksi dan mengamati langsung proses perakitan kendaraan mulai dari pengelasan bodi (welding), pengecatan (painting), hingga tahap perakitan akhir (assembling) dan uji kualitas. Kegiatan ini memberikan gambaran nyata tentang standar operasional kerja dan teknologi mutakhir yang digunakan dalam industri otomotif.</p><p>Kepala Program Keahlian Teknik Otomotif berharap kegiatan KI ini dapat memotivasi siswa untuk terus mengasah keterampilan mereka agar kelak menjadi mekanik dan teknisi andal yang siap bersaing di dunia kerja nyata setelah lulus.</p>',
                'thumbnail' => 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=900&q=80',
                'category' => 'Kegiatan',
                'author' => 'Tim Humas',
            ],
            [
                'title' => 'Peresmian Laboratorium Desain Komunikasi Visual Baru',
                'slug' => 'peresmian-lab-dkv',
                'date' => '2026-04-22',
                'excerpt' => 'SMKN 11 Kabupaten Tangerang resmi membuka laboratorium multimedia baru khusus untuk praktik siswa jurusan Desain Komunikasi Visual (DKV).',
                'content' => '<p>Dalam upaya meningkatkan kualitas pendidikan vokasi, Kepala SMKN 11 Kabupaten Tangerang resmi meresmikan Laboratorium Desain Komunikasi Visual (DKV) yang baru pada Kamis, 22 April 2026. Lab baru ini dilengkapi dengan 35 unit komputer spesifikasi tinggi (Core i7, RAM 16GB, SSD 512GB) yang sangat memadai untuk aktivitas desain grafis, editing video, dan rendering 3D.</p><p>Selain peningkatan perangkat keras, lab ini juga difasilitasi dengan koneksi internet serat optik dedicated, studio mini, dan perangkat kamera untuk praktik fotografi dan videografi. Pembaruan fasilitas ini diharapkan dapat mendukung pembelajaran produktif seperti desain grafis, animasi, dan produksi konten digital.</p><p>Siswa menyambut baik kehadiran lab ini. "Kami sangat senang dengan adanya lab baru ini, sekarang kami bisa melakukan rendering dan editing video dengan jauh lebih lancar tanpa kendala," ungkap salah satu siswa jurusan DKV.</p>',
                'thumbnail' => '/images/news-4.jpg',
                'category' => 'Fasilitas',
                'author' => 'Tim Humas',
            ],
            [
                'title' => 'Pelaksanaan Uji Kompetensi Keahlian (UKK) Tahun 2026 Berjalan Lancar',
                'slug' => 'pelaksanaan-ukk-2026',
                'date' => '2026-03-05',
                'excerpt' => 'Seluruh siswa kelas XII dari enam program keahlian sukses mengikuti Uji Kompetensi Keahlian (UKK) sebagai syarat kelulusan.',
                'content' => '<p>Uji Kompetensi Keahlian (UKK) bagi siswa kelas XII SMKN 11 Kabupaten Tangerang tahun pelajaran 2025/2026 telah selesai diselenggarakan dengan sukses dan lancar. Kegiatan yang berlangsung selama satu pekan ini melibatkan penguji internal (guru produktif) maupun penguji eksternal dari dunia usaha dan industri (DUDI).</p><p>UKK bertujuan mengukur pencapaian kompetensi siswa pada jenjang tertentu sesuai dengan kompetensi keahlian yang ditempuh. Tiap jurusan menyajikan tantangan yang berbeda, misalnya jurusan MPLB dengan ujian praktik administrasi perkantoran, sedangkan jurusan Teknik Otomotif dengan praktik troubleshooting sistem injeksi dan perbaikan mesin.</p><p>Para penguji eksternal mengapresiasi kemampuan dan kedisiplinan kerja para siswa selama ujian. Sebagian besar siswa dinyatakan sangat kompeten dan memenuhi standar yang dibutuhkan oleh industri. Sertifikat kompetensi yang akan mereka peroleh nantinya sangat berguna sebagai bekal melamar pekerjaan.</p>',
                'thumbnail' => '/images/news-5.jpg',
                'category' => 'Akademik',
                'author' => 'Kurikulum',
            ],
            [
                'title' => 'Peringatan Hari Guru Nasional di SMKN 11 Kab. Tangerang',
                'slug' => 'hari-guru-nasional',
                'date' => '2025-11-25',
                'excerpt' => 'Rangkaian acara meriah peringatan Hari Guru Nasional dirayakan oleh seluruh guru dan siswa dengan penuh rasa kekeluargaan.',
                'content' => '<p>Peringatan Hari Guru Nasional (HGN) tahun ini di SMKN 11 Kabupaten Tangerang berlangsung sangat meriah dan penuh makna. Kegiatan diawali dengan upacara bendera di lapangan utama sekolah, di mana petugas upacara merupakan perwakilan dari bapak/ibu guru sendiri. Hal ini memberikan suasana berbeda dan sangat berkesan bagi para siswa.</p><p>Setelah upacara, acara dilanjutkan dengan pemotongan tumpeng dan penampilan pentas seni persembahan dari ekstrakurikuler serta perwakilan setiap kelas. Puncak acara ditandai dengan penyerahan buket bunga secara simbolis oleh pengurus OSIS kepada Kepala Sekolah dan para guru, sebagai bentuk penghormatan dan rasa terima kasih atas jasa mereka dalam mendidik siswa-siswi.</p><p>"Guru adalah pahlawan tanpa tanda jasa. Kami berharap semua guru senantiasa diberikan kesehatan dan kesabaran dalam mencetak generasi penerus bangsa yang unggul, terampil, dan berkarakter," tutur Ketua OSIS dalam sambutannya.</p>',
                'thumbnail' => '/images/news-6.jpg',
                'category' => 'Kegiatan',
                'author' => 'OSIS',
            ],
            [
                'title' => 'Tim Futsal SMKN 11 Juara 1 Bupati Cup Kabupaten Tangerang 2025',
                'slug' => 'juara-futsal-bupati-cup-2025',
                'date' => '2025-09-20',
                'excerpt' => 'Tim futsal putra SMKN 11 Kabupaten Tangerang berhasil meraih juara 1 pada Turnamen Futsal Bupati Cup Kabupaten Tangerang 2025.',
                'content' => '<p>Tim futsal putra SMKN 11 Kabupaten Tangerang berhasil mengukir prestasi gemilang dengan meraih juara 1 pada Turnamen Futsal Bupati Cup Kabupaten Tangerang 2025. Turnamen yang berlangsung selama dua pekan ini diikuti oleh 24 tim SMK se-Kabupaten Tangerang.</p><p>Di partai final yang berlangsung ketat, tim futsal SMKN 11 berhasil mengalahkan tim asal SMKN 2 dengan skor akhir 3-2. Kapten tim, Reza Pratama, mencetak dua gol penentu kemenangan yang membawa tim meraih trofi juara.</p><p>Kepala Sekolah menyampaikan apresiasi tinggi kepada tim dan pelatih atas prestasi membanggakan ini. "Prestasi ini membuktikan bahwa siswa SMKN 11 tidak hanya unggul dalam akademik dan keahlian, tetapi juga dalam bidang olahraga," ujar beliau. Tim futsal berharap prestasi ini dapat memotivasi siswa lain untuk terus berprestasi di berbagai bidang.</p>',
                'thumbnail' => 'https://images.unsplash.com/photo-1552664688-cf1ec3b78426?auto=format&fit=crop&w=900&q=80',
                'category' => 'Prestasi',
                'author' => 'Tim Humas',
            ],
            [
                'title' => 'Praktik Kerja Lapangan (PKL) Siswa Kelas XI Dimulai',
                'slug' => 'pkl-kelas-xi-2026',
                'date' => '2026-07-01',
                'excerpt' => 'Siswa kelas XI dari seluruh program keahlian memulai kegiatan Praktik Kerja Lapangan (PKL) di berbagai perusahaan mitra DUDI.',
                'content' => '<p>Praktik Kerja Lapangan (PKL) bagi siswa kelas XI SMKN 11 Kabupaten Tangerang tahun pelajaran 2025/2026 resmi dimulai pada 1 Juli 2026. Kegiatan ini melibatkan ratusan siswa dari enam program keahlian yang ditempatkan di berbagai perusahaan mitra dunia usaha dan dunia industri (DUDI).</p><p>Penempatan PKL disesuaikan dengan kompetensi masing-masing jurusan. Siswa TJKT ditempatkan di perusahaan teknologi dan ISP, siswa DKV di agensi kreatif dan production house, siswa Teknik Otomotif di bengkel resmi dan dealer, siswa TITL di kontraktor listrik dan industri manufaktur, siswa MPLB di bank dan kantor, serta siswa Busana di butik dan konveksi.</p><p>Kepala Program Keahlian Hubin menyampaikan bahwa PKL merupakan momen penting bagi siswa untuk mengaplikasikan ilmu yang dipelajari di sekolah dalam dunia kerja nyata. "Melalui PKL, siswa dapat membangun jejaring dengan industri dan mempersiapkan diri untuk dunia kerja setelah lulus," tuturnya. Kegiatan PKL akan berlangsung selama tiga bulan hingga akhir September 2026.</p>',
                'thumbnail' => 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=900&q=80',
                'category' => 'Akademik',
                'author' => 'Hubin',
            ],
            [
                'title' => 'Sosialisasi Bahaya Perundungan (Bullying) dan Kenakalan Remaja',
                'slug' => 'sosialisasi-anti-bullying-2026',
                'date' => '2026-04-10',
                'excerpt' => 'Sekolah mengadakan sosialisasi pencegahan perundungan dan kenakalan remaja yang diikuti seluruh siswa dengan narasumber dari Kepolisian.',
                'content' => '<p>Dalam upaya menciptakan lingkungan sekolah yang aman dan nyaman, SMKN 11 Kabupaten Tangerang mengadakan sosialisasi pencegahan perundungan (bullying) dan kenakalan remaja pada 10 April 2026. Kegiatan ini menghadirkan narasumber dari Kepolisian Resor Kabupaten Tangerang dan diikuti oleh seluruh siswa.</p><p>Sosialisasi membahas berbagai topik penting, antara lain jenis-jenis perundungan, dampak psikologis bagi korban dan pelaku, serta cara mencegah dan melaporkan tindakan perundungan. Selain itu, narasumber juga menyampaikan materi tentang bahaya penyalahgunaan narkoba dan pentingnya hukum bagi remaja.</p><p>Kepala Sekolah dalam sambutannya menekankan pentingnya rasa hormat dan empati antar siswa. "Sekolah berkomitmen menciptakan lingkungan belajar yang bebas dari perundungan. Setiap laporan akan kami tindak lanjuti dengan serius," tegas beliau. Kegiatan ini ditutup dengan penandatanganan komitmen anti-bullying oleh perwakilan OSIS dan seluruh ketua kelas.</p>',
                'thumbnail' => 'https://images.unsplash.com/photo-1521791136064-7986c5920bc6?auto=format&fit=crop&w=900&q=80',
                'category' => 'Kegiatan',
                'author' => 'Kesiswaan',
            ],
            [
                'title' => 'SMKN 11 Kabupaten Tangerang Raih Akreditasi "A" Unggul',
                'slug' => 'akreditasi-a-unggul-2025',
                'date' => '2025-12-10',
                'excerpt' => 'SMKN 11 Kabupaten Tangerang berhasil meraih predikat akreditasi "A" Unggul dari Badan Akreditasi Nasional Sekolah/Madrasah (BAN-S/M).',
                'content' => '<p>SMKN 11 Kabupaten Tangerang berhasil meraih prestasi membanggakan dengan memperoleh predikat akreditasi "A" Unggul dari Badan Akreditasi Nasional Sekolah/Madrasah (BAN-S/M) hasil asesmen tahun 2025. Predikat ini diberikan setelah melalui proses asesmen menyeluruh terhadap delapan standar nasional pendidikan.</p><p>Asesmen akreditasi menilai berbagai aspek, mulai dari kualitas pendidik dan tenaga kependidikan, sarana prasarana, pengelolaan, pembiayaan, hingga prestasi siswa baik akademik maupun non-akademik. Sekolah mendapatkan nilai yang sangat memuaskan pada hampir seluruh komponen penilaian.</p><p>"Capaian akreditasi A Unggul ini adalah hasil kerja keras seluruh keluarga besar SMKN 11 Kabupaten Tangerang. Kami akan terus berinovasi dan meningkatkan mutu pendidikan agar lulusan semakin siap kerja dan berdaya saing tinggi," ujar Kepala Sekolah dalam rilis resmi. Predikat akreditasi A Unggul berlaku selama lima tahun dan menjadi bukti komitmen sekolah dalam menyelenggarakan pendidikan vokasi berkualitas.</p>',
                'thumbnail' => 'https://images.unsplash.com/photo-1606857521015-7f7fc63a41f0?auto=format&fit=crop&w=900&q=80',
                'category' => 'Pengumuman',
                'author' => 'Admin',
            ],
            [
                'title' => 'Lowongan Kerja Terbaru PT Teknologi Nusantara untuk Lulusan TJKT',
                'slug' => 'pengumuman-lowongan-tjkt-teknologi-nusantara',
                'date' => '2026-08-05',
                'excerpt' => 'PT Teknologi Nusantara membuka lowongan Network Administrator untuk lulusan TJKT melalui BKK SMKN 11 Kabupaten Tangerang.',
                'content' => '<p>BKK SMKN 11 Kabupaten Tangerang menerima informasi lowongan kerja terbaru dari PT Teknologi Nusantara. Perusahaan penyedia layanan infrastruktur IT dan telekomunikasi tersebut membutuhkan kandidat untuk posisi Network Administrator.</p><p>Posisi ini terbuka bagi lulusan SMK jurusan Teknik Jaringan Komputer dan Telekomunikasi (TJKT) yang memahami MikroTik, Cisco, serta dasar TCP/IP dan VLAN. Fresh graduate dipersilakan untuk mendaftar.</p><p>Alumni yang berminat dapat melihat detail lowongan melalui halaman Lowongan Kerja BKK atau menghubungi petugas BKK pada jam pelayanan. Batas akhir pendaftaran adalah 30 September 2026.</p>',
                'thumbnail' => 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=900&q=80',
                'category' => 'Pengumuman',
                'author' => 'BKK SMKN 11',
            ],
            [
                'title' => 'Pendaftaran Program Magang Batch 2 PT Multimedia Kreatif Dibuka',
                'slug' => 'pendaftaran-magang-multimedia-kreatif-batch-2',
                'date' => '2026-07-28',
                'excerpt' => 'PT Multimedia Kreatif Indonesia kembali membuka program magang bagi siswa dan alumni DKV. Pendaftaran melalui BKK SMKN 11.',
                'content' => '<p>BKK SMKN 11 Kabupaten Tangerang mengumumkan dibukanya pendaftaran program magang batch kedua dari PT Multimedia Kreatif Indonesia. Production house yang menangani berbagai merek nasional ini mencari kandidat untuk posisi Videografer &amp; Editor.</p><p>Program magang ini terbuka bagi siswa SMK jurusan DKV atau Multimedia yang sedang melaksanakan PKL maupun alumni baru. Kandidat diharapkan menguasai dasar videografi dan editing video menggunakan Adobe Premiere atau CapCut.</p><p>Peserta magang akan mendapatkan uang saku, sertifikat pengalaman kerja, dan kesempatan diangkat sebagai karyawan kontrak. Silakan hubungi BKK SMKN 11 untuk informasi pendaftaran lebih lanjut.</p>',
                'thumbnail' => 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=900&q=80',
                'category' => 'Pengumuman',
                'author' => 'BKK SMKN 11',
            ],
            [
                'title' => 'BKK Buka Layanan Konsultasi Karir untuk Alumni',
                'slug' => 'layanan-konsultasi-karir-bkk',
                'date' => '2026-07-20',
                'excerpt' => 'BKK SMKN 11 Kabupaten Tangerang menyediakan layanan konsultasi karir gratis bagi alumni setiap hari kerja.',
                'content' => '<p>BKK SMKN 11 Kabupaten Tangerang membuka layanan konsultasi karir bagi alumni yang ingin mempersiapkan diri memasuki dunia kerja. Layanan ini mencakup bimbingan penyusunan curriculum vitae (CV), tips menghadapi wawancara kerja, serta informasi tren lowongan di berbagai sektor industri.</p><p>Konsultasi dapat dilakukan secara langsung di kantor BKK atau melalui WhatsApp pada jam pelayanan, Senin hingga Jumat pukul 07.00 - 15.00 WIB. Layanan ini gratis dan terbuka untuk seluruh alumni dari semua program keahlian.</p><p>Melalui layanan ini, BKK berharap alumni semakin siap bersaing dan mendapatkan pekerjaan yang sesuai dengan kompetensi masing-masing.</p>',
                'thumbnail' => 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=900&q=80',
                'category' => 'Pengumuman',
                'author' => 'BKK SMKN 11',
            ],
            [
                'title' => 'Rekrutmen Bersama Perusahaan Mitra BKK Tahun 2026',
                'slug' => 'rekrutmen-bersama-mitra-bkk-2026',
                'date' => '2026-07-12',
                'excerpt' => 'BKK SMKN 11 mengadakan rekrutmen bersama yang diikuti perusahaan mitra dari berbagai sektor industri untuk menyalurkan lulusan.',
                'content' => '<p>BKK SMKN 11 Kabupaten Tangerang akan menyelenggarakan kegiatan rekrutmen bersama yang diikuti oleh sejumlah perusahaan mitra dari berbagai sektor industri. Kegiatan ini menjadi wadah bagi alumni untuk bertemu langsung dengan perwakilan perusahaan dan mengajukan lamaran kerja.</p><p>Rekrutmen bersama menghadirkan perusahaan dari sektor teknologi informasi, otomotif, manufaktur, ritel, hingga perbankan. Alumni diharapkan membawa berkas lamaran lengkap dan berpakaian rapi saat mengikuti kegiatan.</p><p>Informasi jadwal dan daftar perusahaan peserta akan diumumkan melalui halaman Lowongan Kerja BKK. Pantau terus informasi terbaru agar tidak ketinggalan kesempatan ini.</p>',
                'thumbnail' => 'https://images.unsplash.com/photo-1521791136064-7986c5920bc6?auto=format&fit=crop&w=900&q=80',
                'category' => 'Pengumuman',
                'author' => 'BKK SMKN 11',
            ],
            [
                'title' => 'Workshop Persiapan Kerja: Tips CV dan Wawancara bagi Calon Lulusan',
                'slug' => 'workshop-persiapan-kerja-bkk',
                'date' => '2026-06-25',
                'excerpt' => 'BKK SMKN 11 menggelar workshop persiapan kerja untuk siswa kelas XII dalam menyusun CV dan menghadapi wawancara kerja.',
                'content' => '<p>Dalam rangka mempersiapkan siswa kelas XII memasuki dunia kerja setelah lulus, BKK SMKN 11 Kabupaten Tangerang menyelenggarakan workshop persiapan kerja. Materi workshop meliputi teknik menyusun CV yang menarik, strategi menjawab wawancara kerja, dan etika berkomunikasi di lingkungan profesional.</p><p>Workshop menghadirkan praktisi dari perusahaan mitra yang membagikan pengalaman dan tips langsung dari dunia industri. Peserta juga berkesempatan melakukan simulasi wawancara kerja.</p><p>Kegiatan ini merupakan bagian dari program bimbingan karir BKK yang diadakan secara rutin setiap tahun menjelang kelulusan siswa kelas XII.</p>',
                'thumbnail' => 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80',
                'category' => 'Pengumuman',
                'author' => 'BKK SMKN 11',
            ],
        ];

        foreach ($rows as $row) {
            News::updateOrCreate(['slug' => $row['slug']], $row);
        }
    }

    protected function seedPrograms(): void
    {
        $rows = [
            [
                'slug' => 'tkj',
                'name' => 'Teknik Jaringan Komputer dan Telekomunikasi',
                'short_name' => 'TJKT',
                'icon' => 'Network',
                'image' => 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=900&q=80',
                'description' => 'Program keahlian Teknik Jaringan Komputer dan Telekomunikasi (TJKT) membekali siswa dengan keterampilan dalam perakitan komputer, instalasi jaringan lokal (LAN) maupun luas (WAN), administrasi server, serta teknologi telekomunikasi. Lulusan dipersiapkan untuk menjadi teknisi jaringan, administrator sistem, dan tenaga ahli di bidang infrastruktur TI dan telekomunikasi.',
                'short_description' => 'Mempelajari perakitan komputer, instalasi jaringan, administrasi server, dan teknologi telekomunikasi.',
                'competencies' => ['Perakitan dan Perbaikan Komputer', 'Instalasi Jaringan (LAN/WAN)', 'Administrasi Server (Windows/Linux)', 'Keamanan Jaringan dan Cyber Security', 'Teknologi Telekomunikasi dan Fiber Optik', 'Troubleshooting Perangkat Keras dan Jaringan'],
                'career_prospects' => ['Network Administrator', 'System Administrator', 'Teknisi Jaringan Telekomunikasi', 'IT Support/Technician', 'Teknisi Fiber Optik', 'Wirausaha di bidang IT'],
                'facilities' => ['Laboratorium Komputer', 'Peralatan Jaringan (Router, Switch, MikroTik)', 'Server Khusus Praktik', 'Koneksi Internet Fiber Optik', 'Toolkit Perbaikan Komputer'],
            ],
            [
                'slug' => 'dkv',
                'name' => 'Desain Komunikasi Visual',
                'short_name' => 'DKV',
                'icon' => 'Code',
                'image' => 'https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=900&q=80',
                'description' => 'Desain Komunikasi Visual (DKV) fokus pada pengembangan kreativitas di bidang desain grafis, multimedia, videografi, fotografi, dan animasi. Siswa akan mempelajari berbagai perangkat lunak desain, teknik fotografi, produksi video, dan pengembangan konten digital kreatif.',
                'short_description' => 'Mempelajari desain grafis, multimedia, videografi, fotografi, dan animasi digital.',
                'competencies' => ['Desain Grafis (CorelDRAW, Adobe Illustrator, Photoshop)', 'Videografi dan Editing Video (Premiere, After Effects)', 'Fotografi Digital', 'Animasi 2D dan 3D', 'Pengembangan Web & UI/UX Design', 'Produksi Konten Digital Kreatif'],
                'career_prospects' => ['Desainer Grafis', 'Videografer / Editor Video', 'Fotografer', 'Animator', 'Social Media Specialist', 'UI/UX Designer'],
                'facilities' => ['Laboratorium Multimedia', 'Kamera DSLR/Mirrorless', 'Studio Fotografi', 'Green Screen Studio', 'Komputer Spesifikasi Tinggi untuk Desain'],
            ],
            [
                'slug' => 'otomotif',
                'name' => 'Teknik Otomotif',
                'short_name' => 'TO',
                'icon' => 'Car',
                'image' => 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=900&q=80',
                'description' => 'Teknik Otomotif mendidik siswa untuk memiliki keahlian dalam perawatan dan perbaikan kendaraan roda empat dan roda dua. Program ini mencakup pemahaman mendalam tentang mesin bensin dan diesel, sistem kelistrikan otomotif, sistem injeksi, serta sistem sasis dan pemindah tenaga.',
                'short_description' => 'Fokus pada perawatan dan perbaikan kendaraan bermotor roda dua dan roda empat.',
                'competencies' => ['Pemeliharaan Mesin Kendaraan Ringan', 'Perbaikan Sistem Kelistrikan Kendaraan', 'Perawatan Sistem Sasis dan Pemindah Tenaga', 'Overhaul Mesin', 'Teknologi Injeksi (EFI & PGM-FI)', 'Spooring dan Balancing'],
                'career_prospects' => ['Mekanik Profesional', 'Service Advisor', 'Teknisi Bengkel Resmi (Dealer)', 'Wirausaha Bengkel', 'Operator Industri Otomotif', 'Kepala Mekanik'],
                'facilities' => ['Bengkel Otomotif Standar Industri', 'Engine Stand', 'Car Lift', 'Alat Uji Emisi', 'Scanner EFI', 'Unit Sepeda Motor Berbagai Tipe'],
            ],
            [
                'slug' => 'titl',
                'name' => 'Teknik Ketenagalistrikan',
                'short_name' => 'TITL',
                'icon' => 'Zap',
                'image' => 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?auto=format&fit=crop&w=900&q=80',
                'description' => 'Teknik Ketenagalistrikan (TITL) membekali siswa dengan kompetensi di bidang instalasi listrik, sistem tenaga listrik, motor listrik, dan kendali otomasi industri. Lulusan siap bekerja di sektor kelistrikan, perawatan gedung, dan industri manufaktur.',
                'short_description' => 'Mempelajari instalasi listrik, sistem tenaga, motor listrik, dan otomasi industri.',
                'competencies' => ['Instalasi Listrik Penerangan dan Tenaga', 'Sistem Distribusi Tenaga Listrik', 'Motor Listrik dan Kontrol', 'PLC (Programmable Logic Controller)', 'Elektronika Daya', 'Instalasi Panel Listrik'],
                'career_prospects' => ['Teknisi Listrik', 'Instalatir Listrik', 'Teknisi Pemeliharaan Gedung', 'Operator Pembangkit Listrik', 'Wirausaha Jasa Instalasi Listrik', 'Staf Teknik di Perusahaan Manufaktur'],
                'facilities' => ['Laboratorium Instalasi Listrik', 'Panel Listrik Praktik', 'Motor Listrik Berbagai Jenis', 'Trainer PLC', 'Peralatan Keselamatan Kerja (K3)'],
            ],
            [
                'slug' => 'mplb',
                'name' => 'Manajemen Perkantoran dan Layanan Bisnis',
                'short_name' => 'MPLB',
                'icon' => 'Calculator',
                'image' => 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=900&q=80',
                'description' => 'Manajemen Perkantoran dan Layanan Bisnis (MPLB) membekali siswa dengan kompetensi dalam mengelola administrasi perkantoran, kemampuan komunikasi bisnis, pengelolaan keuangan, dan pengoperasian aplikasi komputer perkantoran. Lulusan siap bekerja di sektor perkantoran, perbankan, dan perusahaan jasa.',
                'short_description' => 'Mempelajari administrasi perkantoran, manajemen bisnis, dan layanan profesional.',
                'competencies' => ['Administrasi dan Manajemen Perkantoran', 'Komunikasi Bisnis', 'Kearsipan Digital', 'Komputer Akuntansi', 'Public Relation dan Layanan Pelanggan', 'Kewirausahaan'],
                'career_prospects' => ['Staf Administrasi Perkantoran', 'Customer Service Representative', 'Administrasi Keuangan', 'Resepsionis', 'Administrasi Personalia (HR)', 'Wirausaha Jasa Perkantoran'],
                'facilities' => ['Laboratorium Administrasi Perkantoran', 'Bank Mini', 'Perangkat Multimedia', 'Software Administrasi Perkantoran'],
            ],
            [
                'slug' => 'busana',
                'name' => 'Busana',
                'short_name' => 'Busana',
                'icon' => 'Scissors',
                'image' => 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=900&q=80',
                'description' => 'Program keahlian Busana membekali siswa dengan keterampilan di bidang desain busana, pembuatan pola, menjahit, dan produksi busana. Siswa juga dibekali pengetahuan kewirausahaan untuk mengelola butik atau industri fashion skala kecil dan menengah.',
                'short_description' => 'Mempelajari desain busana, pembuatan pola, menjahit, dan produksi fashion.',
                'competencies' => ['Desain Busana (Fashion Design)', 'Pembuatan Pola (Pattern Making)', 'Menjahit (Busana Pria/Wanita/Anak)', 'Teknik Hiasan Busana (Embroidery, Beading)', 'Manajemen Produksi Busana', 'Kewirausahaan Bidang Fashion'],
                'career_prospects' => ['Desainer Busana', 'Penjahit Profesional', 'Pattern Maker', 'Pemilik Butik / Konveksi', 'Quality Control Produk Garmen', 'Konsultan Fashion'],
                'facilities' => ['Ruang Praktik Menjahit', 'Mesin Jahit Industri', 'Mesin Obras dan Neci', 'Manekin (Dress Form)', 'Laboratorium Desain Busana', 'Peralatan Pembuatan Pola'],
            ],
        ];

        foreach ($rows as $row) {
            Program::updateOrCreate(['slug' => $row['slug']], $row);
        }
    }

    protected function seedFacilities(): void
    {
        $rows = [
            ['name' => 'Laboratorium Komputer', 'description' => 'Terdapat 4 ruang laboratorium komputer yang dilengkapi dengan PC spesifikasi tinggi, AC, dan koneksi internet fiber optik untuk menunjang praktik jurusan TJKT dan DKV.', 'category' => 'Akademik', 'photo' => '/images/facilities/lab-komputer.jpg'],
            ['name' => 'Bengkel Otomotif', 'description' => 'Fasilitas bengkel luas standar industri yang dilengkapi dengan peralatan servis lengkap, engine stand, car lift, dan scanner EFI untuk siswa jurusan Teknik Otomotif.', 'category' => 'Akademik', 'photo' => '/images/facilities/bengkel.jpg'],
            ['name' => 'Perpustakaan Digital', 'description' => 'Ruang baca yang nyaman, koleksi buku cetak, serta fasilitas akses e-book dan jurnal online untuk referensi belajar siswa.', 'category' => 'Akademik', 'photo' => '/images/facilities/perpustakaan.jpg'],
            ['name' => 'Lapangan Olahraga Utama', 'description' => 'Lapangan serbaguna yang dapat digunakan untuk kegiatan olahraga seperti futsal, basket, voli, dan lapangan upacara bendera.', 'category' => 'Fasilitas Umum', 'photo' => '/images/facilities/lapangan.jpg'],
            ['name' => 'Masjid Ulil Albab', 'description' => 'Masjid sekolah yang luas dan bersih untuk memfasilitasi ibadah warga sekolah, kegiatan keputrian, dan pembinaan rohani Islam.', 'category' => 'Keagamaan', 'photo' => '/images/facilities/masjid.jpg'],
            ['name' => 'Aula Serbaguna', 'description' => 'Gedung aula berkapasitas 500 orang yang digunakan untuk pertemuan orang tua, seminar, pentas seni, dan perpisahan sekolah.', 'category' => 'Fasilitas Umum', 'photo' => '/images/facilities/aula.jpg'],
            ['name' => 'Laboratorium Akuntansi (Bank Mini)', 'description' => 'Ruang praktik bagi jurusan MPLB yang didesain menyerupai pelayanan teller bank (Bank Mini) dan dilengkapi dengan peralatan administrasi perkantoran serta software manajemen bisnis.', 'category' => 'Akademik', 'photo' => '/images/facilities/lab-akuntansi.jpg'],
            ['name' => 'Ruang Multimedia & Podcast', 'description' => 'Ruangan kedap suara yang dilengkapi perangkat rekaman audio visual terkini untuk memproduksi konten edukasi, siaran sekolah, dan ekskul jurnalistik.', 'category' => 'Pendukung', 'photo' => '/images/facilities/multimedia.jpg'],
            ['name' => 'Laboratorium Listrik & Otomasi', 'description' => 'Laboratorium khusus jurusan TITL yang dilengkapi panel instalasi listrik, trainer motor listrik, modul PLC (Programmable Logic Controller), dan peralatan K3 standar industri untuk praktik otomasi.', 'category' => 'Akademik', 'photo' => '/images/facilities/lab-listrik.jpg'],
            ['name' => 'Ruang Praktik Busana & Atelier', 'description' => 'Ruang praktik menjahit jurusan Busana yang dilengkapi mesin jahit industri, mesin obras, mesin neci, manekin (dress form), dan peralatan pembuatan pola untuk produksi fashion.', 'category' => 'Akademik', 'photo' => '/images/facilities/praktik-busana.jpg'],
        ];

        foreach ($rows as $row) {
            Facility::updateOrCreate(['name' => $row['name']], $row);
        }
    }

    protected function seedStaff(): void
    {
        $rows = [
            ['name' => 'Drs. H. Ahmad Fauzi, M.Pd.', 'position' => 'Kepala Sekolah', 'department' => 'Manajemen', 'photo' => 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80', 'description' => 'Memimpin SMKN 11 Kabupaten Tangerang dengan visi sekolah vokasi yang unggul, berkarakter, dan siap kerja, didukung tata kelola yang transparan dan partisipatif.'],
            ['name' => 'Sri Mulyani, S.Pd., M.Si.', 'position' => 'Wakil Kepala Sekolah Bid. Kurikulum', 'department' => 'Kurikulum', 'photo' => 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80', 'description' => 'Mengoordinasikan pelaksanaan kurikulum, kegiatan belajar mengajar, serta asesmen agar mutu pembelajaran terus meningkat.'],
            ['name' => 'Budi Santoso, S.Kom.', 'position' => 'Wakil Kepala Sekolah Bid. Kesiswaan', 'department' => 'Kesiswaan', 'photo' => 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80', 'description' => 'Membina pengembangan karakter, kedisiplinan, dan kegiatan kesiswaan agar murid tumbuh menjadi pribadi yang berakhlak mulia.'],
            ['name' => 'Haryanto, S.T.', 'position' => 'Wakil Kepala Sekolah Bid. Sarana Prasarana', 'department' => 'Sarana Prasarana', 'photo' => 'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?auto=format&fit=crop&w=800&q=80', 'description' => 'Mengelola sarana dan prasarana sekolah agar mendukung proses pembelajaran yang aman, nyaman, dan optimal.'],
            ['name' => 'Dra. Rini Wulandari', 'position' => 'Wakil Kepala Sekolah Bid. Humas & Hubin', 'department' => 'Humas', 'photo' => 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=800&q=80', 'description' => 'Menjalin kemitraan dengan dunia usaha dan industri serta membangun citra sekolah melalui hubungan masyarakat yang baik.'],
            ['name' => 'Eko Prasetyo, S.Kom.', 'position' => 'Kepala Program Keahlian TJKT', 'department' => 'Teknik Jaringan Komputer dan Telekomunikasi', 'photo' => 'https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=800&q=80', 'description' => 'Memimpin pengembangan kurikulum dan praktik industri jurusan TJKT agar lulusan siap kerja di bidang jaringan dan telekomunikasi.'],
            ['name' => 'Anita Rahmawati, S.Kom., M.Kom.', 'position' => 'Kepala Program Keahlian DKV', 'department' => 'Desain Komunikasi Visual', 'photo' => 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=800&q=80', 'description' => 'Mengarahkan pembelajaran kreatif jurusan DKV dengan fokus pada desain grafis, multimedia, dan produksi konten digital.'],
            ['name' => 'Asep Saepudin, S.Pd.T.', 'position' => 'Kepala Program Keahlian Teknik Otomotif', 'department' => 'Teknik Otomotif', 'photo' => 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80', 'description' => 'Mengelola praktik otomotif standar industri dan menjalin kemitraan dengan bengkel resmi untuk peningkatan kompetensi siswa.'],
            ['name' => 'Deni Setiawan, S.T.', 'position' => 'Kepala Program Keahlian TITL', 'department' => 'Teknik Ketenagalistrikan', 'photo' => 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=800&q=80', 'description' => 'Mengembangkan kompetensi instalasi listrik dan otomasi industri siswa TITL dengan dukungan peralatan praktik terkini.'],
            ['name' => 'Siti Aminah, S.E.', 'position' => 'Kepala Program Keahlian MPLB', 'department' => 'Manajemen Perkantoran dan Layanan Bisnis', 'photo' => 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80', 'description' => 'Membina kompetensi administrasi perkantoran dan layanan bisnis siswa MPLB melalui praktik bank mini dan magang industri.'],
            ['name' => 'Nurhayati, S.Pd.', 'position' => 'Kepala Program Keahlian Busana', 'department' => 'Busana', 'photo' => 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=800&q=80', 'description' => 'Membimbing siswa jurusan Busana dalam mengembangkan keterampilan desain, menjahit, dan kewirausahaan bidang fashion.'],
        ];

        foreach ($rows as $row) {
            Staff::updateOrCreate(['name' => $row['name']], $row);
        }
    }

    protected function seedAchievements(): void
    {
        $rows = [
            ['title' => 'Medali Perak Ajang Prestasi SMK Kabupaten Tangerang', 'event' => 'Ajang Prestasi SMK Kabupaten Tangerang', 'year' => 2025, 'level' => 'Kabupaten', 'rank' => 'Medali Perak', 'students' => ['Febriyani'], 'photo' => 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=900&q=80'],
            ['title' => 'Juara 2 LKS Bidang IT Network Systems Tingkat Kabupaten', 'event' => 'Lomba Kompetensi Siswa (LKS) Kabupaten Tangerang', 'year' => 2024, 'level' => 'Kabupaten', 'rank' => 'Juara 2', 'students' => ['Melati Febriyani', 'Rangga Saputra'], 'photo' => 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=900&q=80'],
            ['title' => 'Juara 3 LKS Bidang Web Technologies Tingkat Provinsi Banten', 'event' => 'Lomba Kompetensi Siswa (LKS) Provinsi Banten', 'year' => 2025, 'level' => 'Provinsi', 'rank' => 'Juara 3', 'students' => ['Bayu Pratama', 'Dinda Aulia'], 'photo' => 'https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?auto=format&fit=crop&w=900&q=80'],
            ['title' => 'Partisipasi LKS Bidang IT Network Cabling Tingkat Kabupaten', 'event' => 'Lomba Kompetensi Siswa (LKS) Kabupaten Tangerang', 'year' => 2025, 'level' => 'Kabupaten', 'rank' => 'Peserta', 'students' => ['Febriyani', 'Ilham Maulana'], 'photo' => 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=900&q=80'],
            ['title' => 'Juara 1 Lomba Cerdas Cermat Tingkat Kabupaten Tangerang', 'event' => 'Lomba Cerdas Cermat SMK Se-Kabupaten Tangerang', 'year' => 2024, 'level' => 'Kabupaten', 'rank' => 'Juara 1', 'students' => ['Tim SMKN 11 Kab. Tangerang'], 'photo' => 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&w=900&q=80'],
            ['title' => 'Juara 1 Turnamen Futsal Bupati Cup Kabupaten Tangerang', 'event' => 'Turnamen Futsal Bupati Cup Kabupaten Tangerang', 'year' => 2025, 'level' => 'Kabupaten', 'rank' => 'Juara 1', 'students' => ['Tim Futsal SMKN 11'], 'photo' => 'https://images.unsplash.com/photo-1552664688-cf1ec3b78426?auto=format&fit=crop&w=900&q=80'],
            ['title' => 'Juara 2 Lomba Baris-Berbaris (PBB) Tingkat Kabupaten', 'event' => 'Lomba Baris-Berbaris PBB SMK Se-Kabupaten Tangerang', 'year' => 2025, 'level' => 'Kabupaten', 'rank' => 'Juara 2', 'students' => ['Tim PBB Satria 11'], 'photo' => 'https://images.unsplash.com/photo-1526976668913-0b7520b8c12d?auto=format&fit=crop&w=900&q=80'],
            ['title' => 'Juara Harapan 1 Lomba Desain Poster Tingkat Provinsi Banten', 'event' => 'Festival Seni dan Desain Pelajar Provinsi Banten', 'year' => 2024, 'level' => 'Provinsi', 'rank' => 'Harapan', 'students' => ['Nabila Putri', 'Salsabila'], 'photo' => 'https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=900&q=80'],
            ['title' => 'Juara 3 Lomba Videografi Pendek Tingkat Kabupaten', 'event' => 'Festival Film Pendek Pelajar Kabupaten Tangerang', 'year' => 2025, 'level' => 'Kabupaten', 'rank' => 'Juara 3', 'students' => ['Reza Pratama', 'Ayunda Kirana', 'Fadli Rahman'], 'photo' => 'https://images.unsplash.com/photo-1492619375914-88005aa9e8fb?auto=format&fit=crop&w=900&q=80'],
            ['title' => 'Partisipasi Olimpiade Matematika Tingkat Provinsi Banten', 'event' => 'Olimpiade Sains Nasional (OSN) Provinsi Banten', 'year' => 2025, 'level' => 'Provinsi', 'rank' => 'Partisipasi', 'students' => ['Ahmad Zaki', 'Lestari Dewi'], 'photo' => 'https://images.unsplash.com/photo-1456513080510-7bf31984b480?auto=format&fit=crop&w=900&q=80'],
        ];

        foreach ($rows as $row) {
            Achievement::updateOrCreate(['title' => $row['title']], $row);
        }
    }

    protected function seedTeacherActivities(): void
    {
        $rows = [
            ['title' => 'Workshop Penyusunan Perangkat Pembelajaran Kurikulum Merdeka', 'date' => '2026-01-15', 'category' => 'Workshop', 'description' => 'Seluruh guru mengikuti workshop penyusunan modul ajar dan asesmen berbasis Kurikulum Merdeka yang dibimbing oleh narasumber dari Dinas Pendidikan Provinsi Banten.', 'photo' => 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=900&q=80'],
            ['title' => 'Rapat Evaluasi Pembelajaran Semester Ganjil', 'date' => '2026-01-10', 'category' => 'Rapat', 'description' => 'Evaluasi hasil pembelajaran semester ganjil untuk perbaikan mutu layanan pembelajaran pada semester genap.', 'photo' => 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=900&q=80'],
            ['title' => 'Pelatihan Asesmen Kompetensi dan Pembelajaran Berbasis Proyek', 'date' => '2026-02-05', 'category' => 'Workshop', 'description' => 'Pelatihan internal guru untuk menguatkan asesmen kompetensi dan penerapan pembelajaran berbasis proyek (PjBL).', 'photo' => 'https://images.unsplash.com/photo-1571260899304-425eee4c7efc?auto=format&fit=crop&w=900&q=80'],
            ['title' => 'Upacara dan Syukuran Peringatan Hari Guru Nasional', 'date' => '2025-11-25', 'category' => 'Hari Besar', 'description' => 'Kegiatan apresiasi kepada seluruh guru atas dedikasi mereka dalam mencerdaskan murid SMKN 11 Kabupaten Tangerang.', 'photo' => 'https://images.unsplash.com/photo-1544923246-77307dd654cb?auto=format&fit=crop&w=900&q=80'],
            ['title' => 'Gotong Royong dan Persiapan Lingkungan Sekolah', 'date' => '2026-02-14', 'category' => 'Kegiatan Sosial', 'description' => 'Seluruh pendidik dan tenaga kependidikan bergotong royong menata lingkungan sekolah menjelang dimulainya semester genap.', 'photo' => 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=900&q=80'],
            ['title' => 'Pelatihan Pemanfaatan Teknologi AI dalam Pembelajaran', 'date' => '2026-04-20', 'category' => 'Workshop', 'description' => 'Guru mengikuti pelatihan pemanfaatan teknologi kecerdasan buatan (AI) untuk mendukung penyusunan bahan ajar dan asesmen yang inovatif.', 'photo' => 'https://images.unsplash.com/photo-1535223289827-42f1e9919769?auto=format&fit=crop&w=900&q=80'],
            ['title' => 'Studi Tiru ke SMK Unggulan di Jakarta', 'date' => '2026-05-12', 'category' => 'Studi Tiru', 'description' => 'Sejumlah guru produktif melaksanakan studi tiru ke SMK unggulan di Jakarta untuk benchmarking kurikulum dan praktik industri.', 'photo' => 'https://images.unsplash.com/photo-1571260899304-425eee4c7efc?auto=format&fit=crop&w=900&q=80'],
            ['title' => 'Rapat Koordinasi dengan Dunia Usaha dan Industri (DUDI)', 'date' => '2026-06-03', 'category' => 'Rapat', 'description' => 'Rapat koordinasi bersama perusahaan mitra untuk membahas program Praktik Kerja Lapangan (PKL) dan penyerapan lulusan tahun ajaran 2026/2027.', 'photo' => 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=900&q=80'],
        ];

        foreach ($rows as $row) {
            TeacherActivity::updateOrCreate(['title' => $row['title']], $row);
        }
    }

    protected function seedEducationStaff(): void
    {
        $rows = [
            ['name' => 'Hj. Yuli Astuti, S.E.', 'position' => 'Kepala Tata Usaha', 'department' => 'Tata Usaha', 'photo' => 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=800&q=80'],
            ['name' => 'Dede Firmansyah', 'position' => 'Operator Sekolah (Dapodik)', 'department' => 'Tata Usaha', 'photo' => 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80'],
            ['name' => 'Rina Kartika, S.Pd.', 'position' => 'Pustakawan', 'department' => 'Perpustakaan', 'photo' => 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=800&q=80'],
            ['name' => 'Maman Suherman', 'position' => 'Staf Perpustakaan', 'department' => 'Perpustakaan', 'photo' => 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=800&q=80'],
            ['name' => 'Yusuf Hidayat, A.Md.', 'position' => 'Laboran', 'department' => 'Laboratorium', 'photo' => 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80'],
            ['name' => 'Titi Maryati', 'position' => 'Staf Kesiswaan', 'department' => 'Kesiswaan', 'photo' => 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80'],
            ['name' => 'Ahmad Rifai', 'position' => 'Staf Sarana Prasarana', 'department' => 'Sarana Prasarana', 'photo' => 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80'],
            ['name' => 'Siti Nurhaliza, A.Md.', 'position' => 'Staf Humas', 'department' => 'Humas', 'photo' => 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80'],
        ];

        foreach ($rows as $row) {
            EducationStaff::updateOrCreate(['name' => $row['name']], $row);
        }
    }

    protected function seedSpmb(): void
    {
        $row = SpmbContent::query()->first();

        if ($row) {
            return;
        }

        SpmbContent::create([
            'status' => 'dibuka',
            'title' => 'Seleksi Penerimaan Murid Baru (SPMB) SMKN 11 Kabupaten Tangerang',
            'description' => 'SPMB adalah sistem penerimaan murid baru untuk jenjang pendidikan menengah kejuruan. SMKN 11 Kabupaten Tangerang mengikuti SPMB Provinsi Banten yang diselenggarakan secara online melalui portal resmi pemerintah.',
            'latest_info' => 'Pendaftaran SPMB Tahun Ajaran 2026/2027 akan dibuka melalui portal resmi SPMB Provinsi Banten. Calon murid wajib mendaftar secara online di portal resmi, bukan melalui website sekolah.',
            'requirements' => ['Ijazah SMP / Surat Keterangan Lulus (SKL)', 'Kartu Keluarga (KK)', 'Akta Kelahiran', 'Pas Foto Berwarna (3x4)', 'SKHUN / Surat Keterangan Hasil Ujian Nasional', 'Rapor SMP Semester 1 - 5', 'Kartu NISN (jika ada)', 'Sertifikat prestasi (jika mendaftar jalur prestasi)'],
            'schedule' => [
                ['category' => 'pendaftaran', 'date' => '20-25 Juni 2026', 'title' => 'Pendaftaran Online'],
                ['category' => 'seleksi', 'date' => '1-5 Juli 2026', 'title' => 'Seleksi Administrasi & Akademik'],
                ['category' => 'pengumuman', 'date' => '10 Juli 2026', 'title' => 'Pengumuman Hasil Seleksi'],
                ['category' => 'daftar_ulang', 'date' => '11-15 Juli 2026', 'title' => 'Daftar Ulang'],
            ],
            'flow_steps' => [
                ['title' => 'Informasi', 'description' => 'Pelajari informasi SPMB, jadwal, dan persyaratan di halaman ini'],
                ['title' => 'Persiapan Persyaratan', 'description' => 'Siapkan dokumen administrasi yang diperlukan'],
                ['title' => 'Daftar di Portal Resmi', 'description' => 'Lakukan pendaftaran melalui portal SPMB Provinsi Banten'],
                ['title' => 'Seleksi', 'description' => 'Ikuti tahap seleksi sesuai jadwal yang ditetapkan'],
                ['title' => 'Pengumuman', 'description' => 'Cek hasil seleksi di portal resmi SPMB'],
                ['title' => 'Daftar Ulang', 'description' => 'Lakukan daftar ulang jika dinyatakan diterima'],
            ],
            'faq' => [
                ['question' => 'Apa itu SPMB?', 'answer' => 'SPMB (Seleksi Penerimaan Murid Baru) adalah sistem penerimaan siswa baru yang diselenggarakan oleh Dinas Pendidikan Provinsi Banten secara terpusat melalui portal online resmi.'],
                ['question' => 'Di mana saya mendaftar?', 'answer' => 'Pendaftaran dilakukan melalui portal resmi SPMB Provinsi Banten, bukan melalui website sekolah. Gunakan tombol DAFTAR SPMB di halaman ini untuk menuju portal resmi.'],
                ['question' => 'Kapan pendaftaran SPMB dibuka?', 'answer' => 'Jadwal pendaftaran mengikuti ketentuan SPMB Provinsi Banten. Lihat bagian Jadwal di halaman ini untuk informasi terbaru.'],
                ['question' => 'Apakah ada biaya pendaftaran?', 'answer' => 'Pendaftaran SPMB tidak dipungut biaya (gratis). Biaya yang timbul hanya pada saat daftar ulang untuk seragam dan keperluan pribadi siswa.'],
                ['question' => 'Apakah menerima siswa dari luar daerah?', 'answer' => 'Ya, SMKN 11 Kabupaten Tangerang menerima siswa sesuai kuota jalur zonasi, prestasi, afirmasi, dan perpindahan tugas orang tua yang ditetapkan SPMB Provinsi Banten.'],
            ],
            'portal_url' => 'https://spmb.bantenprov.go.id',
            'banner_image' => 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1600&q=80',
            'banner_title' => 'SPMB SMKN 11 Kabupaten Tangerang',
            'banner_description' => 'Portal informasi resmi SPMB. Pendaftaran dilakukan melalui portal SPMB Provinsi Banten.',
        ]);
    }

    protected function seedOsis(): void
    {
        $profile = Osis::query()->first();

        if (! $profile) {
            $profile = Osis::create([
                'name' => 'OSIS SMKN 11 Kabupaten Tangerang',
                'description' => 'Organisasi Siswa Intra Sekolah (OSIS) SMKN 11 Kabupaten Tangerang adalah wadah organisasi bagi siswa untuk mengembangkan jiwa kepemimpinan, kreativitas, dan kepedulian sosial di lingkungan sekolah maupun masyarakat.',
                'period' => '2025/2026',
                'logo' => '',
            ]);
        }

        $members = [
            ['name' => 'Andi Pratama', 'position' => 'Ketua', 'division' => 'Ketua OSIS', 'photo' => '', 'sort_order' => 1],
            ['name' => 'Sinta Lestari', 'position' => 'Wakil Ketua', 'division' => 'Wakil Ketua OSIS', 'photo' => '', 'sort_order' => 2],
            ['name' => 'Rizky Ramadhan', 'position' => 'Sekretaris', 'division' => 'Sekretaris', 'photo' => '', 'sort_order' => 3],
            ['name' => 'Dewi Anggraini', 'position' => 'Wakil Sekretaris', 'division' => 'Sekretaris', 'photo' => '', 'sort_order' => 4],
            ['name' => 'Bayu Setiawan', 'position' => 'Bendahara', 'division' => 'Bendahara', 'photo' => '', 'sort_order' => 5],
            ['name' => 'Nabila Putri', 'position' => 'Wakil Bendahara', 'division' => 'Bendahara', 'photo' => '', 'sort_order' => 6],
            ['name' => 'Ahmad Fauzi', 'position' => 'Ketua Bidang', 'division' => 'Pembinaan Karakter', 'photo' => '', 'sort_order' => 7],
            ['name' => 'Rani Marlina', 'position' => 'Ketua Bidang', 'division' => 'Seni & Kreativitas', 'photo' => '', 'sort_order' => 8],
            ['name' => 'Reza Pratama', 'position' => 'Ketua Bidang', 'division' => 'Olahraga', 'photo' => '', 'sort_order' => 9],
            ['name' => 'Salsabila', 'position' => 'Ketua Bidang', 'division' => 'Keagamaan', 'photo' => '', 'sort_order' => 10],
            ['name' => 'Ilham Maulana', 'position' => 'Ketua Bidang', 'division' => 'Wawasan & Teknologi', 'photo' => '', 'sort_order' => 11],
            ['name' => 'Ayunda Kirana', 'position' => 'Ketua Bidang', 'division' => 'Humas & Publikasi', 'photo' => '', 'sort_order' => 12],
        ];

        foreach ($members as $member) {
            OsisMember::updateOrCreate(
                ['osis_id' => $profile->id, 'name' => $member['name']],
                $member
            );
        }

        $activities = [
            ['title' => 'Latihan Kepemimpinan Siswa (LKS)', 'description' => 'Kegiatan pelatihan kepemimpinan yang diikuti oleh pengurus OSIS dan perwakilan kelas untuk membangun jiwa pemimpin yang tangguh dan bertanggung jawab.', 'photo' => 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=900&q=80', 'activity_date' => '2026-01-15', 'status' => 'published'],
            ['title' => 'Peringatan Hari Kemerdekaan RI', 'description' => 'Rangkaian kegiatan perayaan HUT kemerdekaan RI ke-81 yang melibatkan seluruh warga sekolah, mulai dari upacara bendera hingga lomba-lomba kebangsaan.', 'photo' => 'https://images.unsplash.com/photo-1532375810709-75b1da00537c?auto=format&fit=crop&w=900&q=80', 'activity_date' => '2026-08-17', 'status' => 'published'],
            ['title' => 'Bakti Sosial Peduli Lingkungan', 'description' => 'Kegiatan kerja bakti dan penghijauan di sekitar lingkungan sekolah sebagai wujud kepedulian OSIS terhadap kelestarian lingkungan.', 'photo' => 'https://images.unsplash.com/photo-1526392060635-9d6019884377?auto=format&fit=crop&w=900&q=80', 'activity_date' => '2026-03-05', 'status' => 'published'],
            ['title' => 'Festival Seni & Budaya SMKN 11', 'description' => 'Pentas seni tahunan yang menampilkan berbagai penampilan siswa mulai dari tari, musik, teater, hingga pameran karya siswa jurusan DKV dan Busana.', 'photo' => 'https://images.unsplash.com/photo-1516280464613-81e30c6f1f0b?auto=format&fit=crop&w=900&q=80', 'activity_date' => '2026-05-25', 'status' => 'published'],
            ['title' => 'Donor Darah & Sosialisasi Kesehatan', 'description' => 'Kegiatan donor darah bekerja sama dengan PMI Cabang Tangerang serta sosialisasi pola hidup sehat bagi seluruh siswa dan guru.', 'photo' => 'https://images.unsplash.com/photo-1615462136150-49bae8b18b30?auto=format&fit=crop&w=900&q=80', 'activity_date' => '2026-02-20', 'status' => 'published'],
        ];

        foreach ($activities as $activity) {
            OsisActivity::updateOrCreate(['title' => $activity['title']], $activity);
        }
    }

    protected function seedExtracurriculars(): void
    {
        $rows = [
            ['name' => 'Paskibra Satria 11', 'category' => 'Kedisiplinan', 'description' => 'Pasukan Pengibar Bendera yang melatih kedisiplinan, kekompakan, dan jiwa nasionalisme melalui latihan baris-berbaris dan tata upacara bendera.', 'photo' => 'https://images.unsplash.com/photo-1526976668913-0b7520b8c12d?auto=format&fit=crop&w=900&q=80', 'advisor' => 'Aiptu Hendra Gunawan', 'schedule' => 'Jumat & Sabtu'],
            ['name' => 'Futsal', 'category' => 'Olahraga', 'description' => 'Wadah pengembangan bakat olahraga futsal yang telah menorehkan berbagai prestasi di tingkat kabupaten dan provinsi.', 'photo' => 'https://images.unsplash.com/photo-1552664688-cf1ec3b78476?auto=format&fit=crop&w=900&q=80', 'advisor' => 'Pak Rahmat Hidayat', 'schedule' => 'Selasa & Kamis'],
            ['name' => 'Basket', 'category' => 'Olahraga', 'description' => 'Ekstrakurikuler bola basket yang mengedepankan kerja sama tim, ketangkasan, dan sportivitas dalam setiap pertandingan.', 'photo' => 'https://images.unsplash.com/photo-1574623452339-5e2b0dc96d8f?auto=format&fit=crop&w=900&q=80', 'advisor' => 'Pak Dede Supriyadi', 'schedule' => 'Senin & Rabu'],
            ['name' => 'Rohis (Rohani Islam)', 'category' => 'Keagamaan', 'description' => 'Kegiatan kerohanian Islam yang bertujuan memperkuat iman, akhlak mulia, dan wawasan keislaman siswa melalui kajian, mentoring, dan kegiatan sosial.', 'photo' => 'https://images.unsplash.com/photo-1585412727339-54e4bae3bbf9?auto=format&fit=crop&w=900&q=80', 'advisor' => 'Bu Aisyah S.Pd.I', 'schedule' => 'Jumat'],
            ['name' => 'PMR (Palang Merah Remaja)', 'category' => 'Sosial', 'description' => 'Organisasi kepalangmerahan yang melatih siswa menjadi relawan tanggap darurat, pertolongan pertama, dan donor darah.', 'photo' => 'https://images.unsplash.com/photo-1512486130939-2c4f79935e4f?auto=format&fit=crop&w=900&q=80', 'advisor' => 'Bu Dewi Sartika', 'schedule' => 'Sabtu'],
            ['name' => 'Pramuka', 'category' => 'Kedisiplinan', 'description' => 'Kegiatan kepanduan yang membentuk karakter, kemandirian, dan jiwa kepemimpinan melalui berbagai kegiatan outdoor dan keterampilan.', 'photo' => 'https://images.unsplash.com/photo-1521185496952-571e42c3f5b0?auto=format&fit=crop&w=900&q=80', 'advisor' => 'Pak Sutrisno', 'schedule' => 'Jumat'],
            ['name' => 'Jurnalistik & Multimedia', 'category' => 'Seni & Kreatif', 'description' => 'Wadah pengembangan minat di bidang penulisan, fotografi, videografi, dan produksi konten digital untuk publikasi sekolah.', 'photo' => 'https://images.unsplash.com/photo-1574717024653-61f18dee1fb0?auto=format&fit=crop&w=900&q=80', 'advisor' => 'Pak Wahyu Nugroho', 'schedule' => 'Rabu'],
            ['name' => 'Seni Tari & Musik', 'category' => 'Seni & Kreatif', 'description' => 'Eksplorasi bakat seni tari tradisional dan modern, serta musik, yang sering tampil pada acara-acara sekolah dan lomba kebudayaan.', 'photo' => 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=900&q=80', 'advisor' => 'Bu Rina Marlina', 'schedule' => 'Kamis'],
            ['name' => 'English Club', 'category' => 'Akademik', 'description' => 'Klub percakapan bahasa Inggris yang meningkatkan kemampuan speaking, listening, dan public speaking melalui debat, storytelling, dan diskusi.', 'photo' => 'https://images.unsplash.com/photo-1582656894606-c1c9e6ef015d?auto=format&fit=crop&w=900&q=80', 'advisor' => 'Bu Nani Kusmawati', 'schedule' => 'Selasa'],
            ['name' => 'Taekwondo', 'category' => 'Olahraga', 'description' => 'Latihan bela diri taekwondo untuk mengembangkan kesehatan fisik, disiplin, dan kemampuan bela diri dengan pembinaan berjenjang.', 'photo' => 'https://images.unsplash.com/photo-1576200962002-b08bab9ca72f?auto=format&fit=crop&w=900&q=80', 'advisor' => 'Pak Agus Salim', 'schedule' => 'Kamis & Sabtu'],
        ];

        foreach ($rows as $row) {
            $slug = Str::slug($row['name']);
            Extracurricular::updateOrCreate(
                ['slug' => $slug],
                $row + ['slug' => $slug, 'place' => '', 'achievements' => [], 'documentation' => [], 'status' => 'published']
            );
        }
    }

    protected function seedKesemaptaan(): void
    {
        $profile = Kesemaptaan::query()->first();

        if (! $profile) {
            Kesemaptaan::create([
                'title' => 'Kesemaptaan SMKN 11 Kabupaten Tangerang',
                'description' => 'Kesemaptaan adalah program pembinaan kedisiplinan, fisik, dan ketahanan mental serta keterampilan baris-berbaris (PBB) bagi siswa. Kegiatan ini membentuk karakter disiplin, tangguh, dan bertanggung jawab yang sejalan dengan nilai-nilai sekolah.',
                'photo' => '',
            ]);
        }

        $activities = [
            ['title' => 'Latihan Dasar Kedisiplinan (LDK)', 'description' => 'Pelatihan dasar kedisiplinan dan pembinaan fisik untuk membentuk karakter siswa yang tertib, bertanggung jawab, dan siap menghadapi tantangan.', 'activity_date' => '2026-02-10', 'documentation' => [], 'status' => 'published'],
            ['title' => 'Pembinaan Fisik & Keterampilan Baris-Berbaris', 'description' => 'Latihan fisik dan keterampilan PBB yang rutin dilaksanakan untuk menjaga kebugaran dan membangun kekompakan antarsiswa.', 'activity_date' => '2026-03-20', 'documentation' => [], 'status' => 'published'],
            ['title' => 'Latihan Khusus Tim PBB Satria 11', 'description' => 'Latihan intensif bagi tim PBB Satria 11 dalam persiapan mengikuti lomba baris-berbaris tingkat kabupaten dan provinsi.', 'activity_date' => '2026-05-15', 'documentation' => [], 'status' => 'published'],
            ['title' => 'Upacara Apel Besar & Pelantikan Anggota Baru', 'description' => 'Apel besar sekolah sekaligus pelantikan anggota baru tim Kesemaptaan SMKN 11 Kabupaten Tangerang periode 2025/2026.', 'activity_date' => '2026-08-30', 'documentation' => [], 'status' => 'published'],
        ];

        foreach ($activities as $activity) {
            KesemaptaanActivity::updateOrCreate(['title' => $activity['title']], $activity);
        }

        $schedules = [
            ['day' => 'Senin', 'time' => '15.30 - 17.00', 'place' => 'Lapangan Sekolah'],
            ['day' => 'Rabu', 'time' => '15.30 - 17.00', 'place' => 'Lapangan Sekolah'],
            ['day' => 'Sabtu', 'time' => '08.00 - 10.00', 'place' => 'Lapangan Sekolah'],
        ];

        foreach ($schedules as $schedule) {
            KesemaptaanSchedule::updateOrCreate(
                ['day' => $schedule['day'], 'time' => $schedule['time']],
                $schedule
            );
        }

        $instructors = [
            ['name' => 'Serka Ahmad Yani', 'role' => 'Pembina Utama', 'photo' => '', 'sort_order' => 1],
            ['name' => 'Pelda Rina Kusuma', 'role' => 'Instruktur PBB', 'photo' => '', 'sort_order' => 2],
            ['name' => 'Kopda Sutrisno', 'role' => 'Instruktur Fisik & Mental', 'photo' => '', 'sort_order' => 3],
        ];

        foreach ($instructors as $instructor) {
            KesemaptaanInstructor::updateOrCreate(['name' => $instructor['name']], $instructor);
        }

        $achievements = [
            ['name' => 'Juara II Lomba Baris-Berbaris Tingkat Kabupaten', 'year' => '2025', 'description' => 'Tim PBB SMKN 11 meraih juara kedua dalam ajang lomba baris-berbaris tingkat Kabupaten Tangerang.', 'documentation' => []],
            ['name' => 'Juara III Lomba PBB Se-Kabupaten Tangerang', 'year' => '2024', 'description' => 'Tim PBB Satria 11 meraih juara ketiga dalam lomba baris-berbaris antar SMK se-Kabupaten Tangerang tahun 2024.', 'documentation' => []],
            ['name' => 'Best Performance Pasukan Pengibar Bendera', 'year' => '2025', 'description' => 'Paskibra Satria 11 mendapatkan penghargaan Best Performance pada kegiatan upacara peringatan Hari Kemerdekaan tingkat kabupaten.', 'documentation' => []],
        ];

        foreach ($achievements as $achievement) {
            KesemaptaanAchievement::updateOrCreate(['name' => $achievement['name']], $achievement);
        }
    }

    protected function seedMading(): void
    {
        $categories = [
            ['slug' => 'puisi', 'name' => 'Puisi', 'sort_order' => 1],
            ['slug' => 'cerpen', 'name' => 'Cerpen', 'sort_order' => 2],
            ['slug' => 'artikel', 'name' => 'Artikel', 'sort_order' => 3],
            ['slug' => 'pantun', 'name' => 'Pantun', 'sort_order' => 4],
            ['slug' => 'esai', 'name' => 'Esai', 'sort_order' => 5],
            ['slug' => 'opini', 'name' => 'Opini', 'sort_order' => 6],
            ['slug' => 'edukasi', 'name' => 'Edukasi', 'sort_order' => 7],
            ['slug' => 'teknologi', 'name' => 'Teknologi', 'sort_order' => 8],
            ['slug' => 'motivasi', 'name' => 'Motivasi', 'sort_order' => 9],
            ['slug' => 'karya-kreatif', 'name' => 'Karya Kreatif', 'sort_order' => 10],
            ['slug' => 'lainnya', 'name' => 'Lainnya', 'sort_order' => 11],
        ];

        $categoryIds = [];
        foreach ($categories as $category) {
            $categoryIds[$category['slug']] = MadingCategory::updateOrCreate(['slug' => $category['slug']], $category)->id;
        }

        $posts = [
            [
                'title' => 'Menjaga Semangat Belajar di Tengah Kesibukan',
                'content' => 'Di tengah banyaknya kegiatan sekolah, penting bagi kita untuk tetap menjaga semangat belajar. Manajemen waktu yang baik, istirahat yang cukup, dan lingkungan yang mendukung adalah kunci agar tetap produktif dan tidak kehilangan motivasi.',
                'category' => 'motivasi',
                'author_name' => 'Redaksi Mading',
                'published_at' => '2026-07-01 00:00:00',
                'created_at' => '2026-06-28 10:00:00',
            ],
            [
                'title' => 'Puisi: Senyum Hangus Rindu',
                'content' => 'Di balik jendela yang kau tinggal, ada senyum yang malam ini ku simpan. Hingga hari-hari ini semakin panjang, kasih tak pernah kehilangan peta hatimu.',
                'category' => 'puisi',
                'author_name' => 'Siswa Kelas X',
                'published_at' => '2026-06-20 00:00:00',
                'created_at' => '2026-06-18 09:00:00',
            ],
            [
                'title' => 'Tips Sukses Praktik Kerja Lapangan (PKL)',
                'content' => 'PKL adalah kesempatan emas untuk mengenal dunia kerja. Berikut beberapa tips: datang tepat waktu, berpakaian rapi dan sopan, aktif bertanya kepada pembimbing industri, jujur dalam bekerja, dan dokumentasikan kegiatan harian sebagai laporan. Jangan lupa untuk membangun relasi yang baik dengan rekan kerja.',
                'category' => 'edukasi',
                'author_name' => 'Siswa Kelas XII',
                'published_at' => '2026-07-05 00:00:00',
                'created_at' => '2026-07-03 14:00:00',
            ],
            [
                'title' => 'Pantun: Semangat Belajar',
                'content' => 'Pergi ke pasar membeli mangga. Jangan lupa beli rambutan juga. Rajin belajar setiap pagi. Sukses pasti akan kau dapatkan nanti.',
                'category' => 'pantun',
                'author_name' => 'Siswa Kelas XI',
                'published_at' => '2026-06-25 00:00:00',
                'created_at' => '2026-06-22 11:00:00',
            ],
            [
                'title' => 'Esai: Pentingnya Literasi Digital bagi Siswa SMK',
                'content' => 'Di era industri 4.0, literasi digital bukan lagi pilihan melainkan keharusan. Siswa SMK dituntut tidak hanya mampu menggunakan teknologi, tetapi juga memahami etika digital, keamanan siber, dan kemampuan menyaring informasi. Literasi digital yang baik akan mempersiapkan kita menghadapi dunia kerja yang semakin berbasis teknologi.',
                'category' => 'esai',
                'author_name' => 'Redaksi Mading',
                'published_at' => '2026-07-08 00:00:00',
                'created_at' => '2026-07-05 08:00:00',
            ],
            [
                'title' => 'Cerpen: Sepatu Baru Pak Surya',
                'content' => 'Pak Surya adalah seorang guru produktif yang selalu datang lebih awal. Suatu pagi, ia datang memakai sepatu baru yang mengkilap. Para siswa heran, bukan karena sepatunya, melainkan karena Pak Surya tersenyum lebar sepanjang hari. "Sepatu baru, semangat baru," katanya. Ternyata, sepatu itu hadiah dari alumni yang kini sukses menjadi teknisi. Sebuah pengingat bahwa dedikasi guru tak pernah terlupakan.',
                'category' => 'cerpen',
                'author_name' => 'Siswa Kelas X',
                'published_at' => '2026-06-30 00:00:00',
                'created_at' => '2026-06-28 13:00:00',
            ],
        ];

        foreach ($posts as $post) {
            MadingPost::updateOrCreate(
                ['title' => $post['title']],
                [
                    'title' => $post['title'],
                    'content' => $post['content'],
                    'category_id' => $categoryIds[$post['category']],
                    'author_name' => $post['author_name'],
                    'author_role' => 'siswa',
                    'cover_image' => '',
                    'status' => 'published',
                    'feedback' => '',
                    'ai_assisted' => false,
                    'published_at' => $post['published_at'],
                    'created_at' => $post['created_at'],
                ]
            );
        }
    }

    protected function seedGalleries(): void
    {
        $items = [
            ['caption' => 'Kegiatan belajar mengajar di laboratorium komputer', 'category' => 'Akademik', 'date' => '2026-07-10', 'src' => 'https://images.unsplash.com/photo-1529390079861-591de354faf5?auto=format&fit=crop&w=900&q=80'],
            ['caption' => 'Tim futsal SMKN 11 bertanding di Bupati Cup', 'category' => 'Olahraga', 'date' => '2026-06-20', 'src' => 'https://images.unsplash.com/photo-1552664688-cf1ec3b78426?auto=format&fit=crop&w=900&q=80'],
            ['caption' => 'Sosialisasi PPDB oleh panitia sekolah', 'category' => 'Kegiatan', 'date' => '2026-06-15', 'src' => 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=900&q=80'],
            ['caption' => 'Upacara bendera hari Senin yang khidmat', 'category' => 'Kegiatan', 'date' => '2026-06-01', 'src' => 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=900&q=80'],
            ['caption' => 'Siswa TJKT praktik konfigurasi jaringan', 'category' => 'Akademik', 'date' => '2026-05-20', 'src' => 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=900&q=80'],
            ['caption' => 'Kunjungan industri jurusan Teknik Otomotif ke pabrik mobil', 'category' => 'Akademik', 'date' => '2026-05-10', 'src' => 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=900&q=80'],
            ['caption' => 'Penampilan seni pada peringatan Hari Guru', 'category' => 'Kegiatan', 'date' => '2025-11-25', 'src' => 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=900&q=80'],
            ['caption' => 'Kegiatan ekstrakurikuler jurnalistik', 'category' => 'Kegiatan', 'date' => '2026-04-15', 'src' => 'https://images.unsplash.com/photo-1574717024653-61f18dee1fb0?auto=format&fit=crop&w=900&q=80'],
            ['caption' => 'Praktik perbaikan mesin siswa Teknik Otomotif', 'category' => 'Akademik', 'date' => '2026-03-12', 'src' => 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=900&q=80'],
            ['caption' => 'Kegiatan Rohis kajian rutin Jumat berkah', 'category' => 'Keagamaan', 'date' => '2026-02-18', 'src' => 'https://images.unsplash.com/photo-1585412727339-54e4bae3bbf9?auto=format&fit=crop&w=900&q=80'],
            ['caption' => 'Latihan Paskibra Satria 11', 'category' => 'Kegiatan', 'date' => '2026-01-25', 'src' => 'https://images.unsplash.com/photo-1526976668913-0b7520b8c12d?auto=format&fit=crop&w=900&q=80'],
            ['caption' => 'Latihan taekwondo mingguan', 'category' => 'Olahraga', 'date' => '2026-01-10', 'src' => 'https://images.unsplash.com/photo-1576200962002-b08bab9ca72f?auto=format&fit=crop&w=900&q=80'],
        ];

        foreach ($items as $index => $item) {
            $slug = 'galeri-'.($index + 1);
            $gallery = Gallery::updateOrCreate(
                ['slug' => $slug],
                [
                    'title' => $item['caption'],
                    'description' => $item['caption'],
                    'category' => $item['category'],
                    'event_date' => $item['date'],
                    'location' => '',
                    'cover_image' => $item['src'],
                    'is_published' => true,
                ]
            );

            GalleryImage::updateOrCreate(
                ['gallery_id' => $gallery->id, 'image' => $item['src']],
                ['caption' => $item['caption'], 'sort_order' => 0]
            );
        }
    }

    protected function seedFaqs(): void
    {
        $rows = [
            ['question' => 'Apa saja program keahlian yang tersedia di SMKN 11 Kabupaten Tangerang?', 'answer' => 'SMKN 11 Kabupaten Tangerang memiliki 6 program keahlian unggulan, yaitu Teknik Jaringan Komputer dan Telekomunikasi (TJKT), Desain Komunikasi Visual (DKV), Teknik Otomotif (TO), Teknik Ketenagalistrikan (TITL), Manajemen Perkantoran dan Layanan Bisnis (MPLB), dan Busana.', 'category' => 'Umum'],
            ['question' => 'Bagaimana cara mendaftar PPDB di SMKN 11?', 'answer' => 'Pendaftaran PPDB dilakukan secara online melalui portal resmi PPDB Provinsi Banten. Calon siswa dapat mengakses halaman PPDB di website kami untuk informasi lengkap mengenai jadwal, persyaratan, alur pendaftaran, dan dokumen yang perlu disiapkan.', 'category' => 'PPDB'],
            ['question' => 'Apa saja jalur pendaftaran yang tersedia?', 'answer' => 'Terdapat empat jalur pendaftaran: Jalur Zonasi (berdasarkan domisili), Jalur Prestasi (akademik/non-akademik), Jalur Afirmasi (siswa kurang mampu), dan Jalur Perpindahan Tugas Orang Tua.', 'category' => 'PPDB'],
            ['question' => 'Berapa biaya sekolah di SMKN 11 Kabupaten Tangerang?', 'answer' => 'SMKN 11 Kabupaten Tangerang adalah sekolah negeri gratis yang tidak memungut biaya SPP. Terdapat biaya sukarela untuk kegiatan tertentu seperti MPLS, praktik, dan kegiatan ekstrakurikuler yang telah disesuaikan dengan kemampuan orang tua siswa.', 'category' => 'Umum'],
            ['question' => 'Apakah SMKN 11 menyediakan beasiswa?', 'answer' => 'Ya, sekolah menyediakan program beasiswa bagi siswa berprestasi dan kurang mampu melalui berbagai sumber, seperti Program Indonesia Pintar (PIP), Kartu Tangerang Pintar, dan beasiswa dari dunia usaha/industri mitra sekolah.', 'category' => 'Umum'],
            ['question' => 'Bagaimana peluang kerja lulusan SMKN 11?', 'answer' => 'Lulusan SMKN 11 memiliki peluang kerja yang sangat baik karena kurikulum kami selaras dengan kebutuhan industri. Sekolah memiliki kerjasama dengan berbagai DU/DI, BKK (Bursa Kerja Khusus) yang aktif menyalurkan lulusan, dan banyak alumni yang sukses bekerja di perusahaan ternama maupun berwirausaha.', 'category' => 'Karir'],
            ['question' => 'Apakah ada kegiatan ekstrakurikuler di SMKN 11?', 'answer' => 'Tentu saja. SMKN 11 memiliki banyak pilihan ekstrakurikuler, antara lain Paskibra, Futsal, Basket, Rohis, PMR, Pramuka, Jurnalistik, Seni Tari & Musik, English Club, dan Taekwondo. Semua ekskul dibina oleh pembina profesional dan berprestasi.', 'category' => 'Kesiswaan'],
            ['question' => 'Bagaimana jam belajar di SMKN 11?', 'answer' => 'Kegiatan belajar dimulai pukul 07.00 WIB hingga 15.30 WIB untuk hari Senin hingga Kamis, dan pukul 07.00 hingga 11.30 WIB untuk hari Jumat. Jam praktik di bengkel atau laboratorium disesuaikan dengan jadwal masing-masing jurusan.', 'category' => 'Umum'],
            ['question' => 'Apakah siswa diizinkan membawa kendaraan bermotor ke sekolah?', 'answer' => 'Siswa diizinkan membawa kendaraan bermotor dengan syarat memiliki SIM (bagi yang sudah 17 tahun) atau surat izin orang tua, serta mematuhi peraturan parkir dan keselamatan berkendara di lingkungan sekolah.', 'category' => 'Kesiswaan'],
            ['question' => 'Bagaimana cara menghubungi pihak sekolah?', 'answer' => 'Anda dapat menghubungi SMKN 11 melalui telepon di nomor yang tertera di halaman Kontak website ini, mengirimkan pesan melalui form kontak di website, atau datang langsung ke alamat sekolah di Kabupaten Tangerang pada jam kerja.', 'category' => 'Umum'],
        ];

        foreach ($rows as $index => $row) {
            Faq::updateOrCreate(
                ['question' => $row['question']],
                ['answer' => $row['answer'], 'category' => $row['category'], 'sort_order' => $index + 1]
            );
        }
    }
}
