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
use App\Models\Guru;
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
use App\Models\SpmbPoster;
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
        // Seed akun prod minimal agar deploy baru tidak kehilangan akses admin.
        // Idempotent: tidak akan overwrite password jika user sudah ada.
        $this->seedProductionAdmin();
        if (app()->environment(['local', 'testing'])) {
            $this->seedAccounts();
            $this->seedGurus();
        }
        $this->seedContent();
    }

    protected function seedProductionAdmin(): void
    {
        // Akun fallback produksi — dipakai di hosting aaPanel.
        // Jika email sudah ada, password tidak di-overwrite (pakai tinker untuk reset manual).
        $user = User::firstOrCreate(
            ['email' => 'admin@smkn11kabtang.sch.id'],
            [
                'id' => 'prod-admin-smkn11kabtang-0001',
                'name' => 'Admin',
                'password' => Hash::make('1234'),
                'profile' => ['name' => 'Admin'],
                'email_verified_at' => now(),
            ]
        );

        Profile::updateOrCreate(
            ['id' => $user->id],
            [
                'role' => 'admin',
                'name' => 'Admin',
                'email' => 'admin@smkn11kabtang.sch.id',
                'status' => 'active',
                'must_change_password' => false,
                'updated_at' => now(),
            ]
        );
    }

    protected function seedRbac(): void
    {
        $roles = ['admin' => 'Admin', 'operator_sekolah' => 'Operator Sekolah', 'guru' => 'Guru', 'osis' => 'OSIS', 'bkk' => 'BKK'];

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

            ['kelulusan.view', 'Kelulusan Siswa - Lihat', 'kelulusan'],
            ['kelulusan.create', 'Kelulusan Siswa - Buat', 'kelulusan'],
            ['kelulusan.edit', 'Kelulusan Siswa - Ubah', 'kelulusan'],
            ['kelulusan.delete', 'Kelulusan Siswa - Hapus', 'kelulusan'],
            ['kelulusan.verify', 'Kelulusan Siswa - Verifikasi', 'kelulusan'],

            ['sdm.view', 'SDM - Lihat', 'sdm'],
            ['sdm.create', 'SDM - Buat', 'sdm'],
            ['sdm.edit', 'SDM - Ubah', 'sdm'],
            ['sdm.delete', 'SDM - Hapus', 'sdm'],
            ['sdm.import', 'SDM - Import Data', 'sdm'],
            ['sdm.export', 'SDM - Export Data', 'sdm'],
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
            'mading.view', 'mading.create', 'mading.edit_own', 'mading.submit_review',
            'mading.review', 'mading.publish',
            'spmb.view',
            'gallery.view', 'gallery.create', 'gallery.edit', 'gallery.publish',
            'job.view', 'job.create', 'job.edit', 'job.publish',
        ];

        $operatorSekolahSlugs = [
            'dashboard.view',
            'management.view',
            'mading.edit_all',
            'gallery.view', 'gallery.create', 'gallery.edit', 'gallery.delete',
            'sdm.view', 'sdm.create', 'sdm.edit', 'sdm.delete', 'sdm.import', 'sdm.export',
        ];

        $bkkSlugs = [
            'dashboard.view',
            'management.view',
            'job.view', 'job.create', 'job.edit', 'job.delete', 'job.publish',
            'kelulusan.view', 'kelulusan.create', 'kelulusan.edit', 'kelulusan.delete', 'kelulusan.verify',
        ];

        foreach ([['guru', $guruSlugs], ['osis', $osisSlugs], ['operator_sekolah', $operatorSekolahSlugs], ['bkk', $bkkSlugs]] as [$roleSlug, $slugs]) {
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
            [
                'id' => 'a1b2c3d4-5678-4000-8000-operator0001',
                'email' => 'operator.test@smkn11.sch.id',
                'password' => 'smkn11operator',
                'name' => 'Operator Test',
                'role' => 'operator_sekolah',
            ],
            [
                'id' => 'b2c3d4e5-6789-4000-8000-000000000001',
                'email' => 'bkk.test@smkn11.sch.id',
                'password' => 'smkn11bkk',
                'name' => 'BKK Test',
                'role' => 'bkk',
            ],
        ];

        foreach ($accounts as $account) {
            $user = User::firstOrCreate(
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

        User::firstOrCreate(
            ['id' => $studentId],
            [
                'email' => $studentEmail,
                'password' => Hash::make('7890'),
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
                'pin' => '7890',
                'name' => 'Student Test',
                'class' => 'XII TJKT 1',
                'major' => 'Teknik Jaringan Komputer dan Telekomunikasi',
                'gender' => 'Laki-laki',
                'date_of_birth' => '2009-01-15',
                'place_of_birth' => 'Tangerang',
                'address' => 'Kp. Saradan RT. 03/01, Desa Pangkat, Kec. Jayanti, Kab. Tangerang, Banten',
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

    protected function seedGurus(): void
    {
        $rows = [
            ['id' => 'b1b0c1a2-0001-4000-8000-000000000001', 'name' => 'Rudi Hartono, S.Kom.', 'email' => 'rudi.hartono@smkn11.sch.id', 'teacher_id' => 'GR-SMKN11-01', 'subject' => 'Produktif TJKT', 'position' => 'Guru Produktif TJKT', 'photo' => 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=800&q=80'],
            ['id' => 'b1b0c1a2-0002-4000-8000-000000000002', 'name' => 'Novi Lestari, S.Kom.', 'email' => 'novi.lestari@smkn11.sch.id', 'teacher_id' => 'GR-SMKN11-02', 'subject' => 'Produktif DKV', 'position' => 'Guru Produktif DKV', 'photo' => 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80'],
            ['id' => 'b1b0c1a2-0003-4000-8000-000000000003', 'name' => 'Rahmat Hidayat, S.Pd.T.', 'email' => 'rahmat.hidayat@smkn11.sch.id', 'teacher_id' => 'GR-SMKN11-03', 'subject' => 'Produktif Teknik Otomotif', 'position' => 'Guru Produktif Teknik Otomotif', 'photo' => 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80'],
            ['id' => 'b1b0c1a2-0004-4000-8000-000000000004', 'name' => 'Dewi Anggraini, S.T.', 'email' => 'dewi.anggraini@smkn11.sch.id', 'teacher_id' => 'GR-SMKN11-04', 'subject' => 'Produktif TITL', 'position' => 'Guru Produktif TITL', 'photo' => 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=800&q=80'],
            ['id' => 'b1b0c1a2-0005-4000-8000-000000000005', 'name' => 'Bambang Priyadi, S.E.', 'email' => 'bambang.priyadi@smkn11.sch.id', 'teacher_id' => 'GR-SMKN11-05', 'subject' => 'Produktif MPLB', 'position' => 'Guru Produktif MPLB', 'photo' => 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80'],
            ['id' => 'b1b0c1a2-0006-4000-8000-000000000006', 'name' => 'Sri Rahayu, S.Pd.', 'email' => 'sri.rahayu@smkn11.sch.id', 'teacher_id' => 'GR-SMKN11-06', 'subject' => 'Produktif Busana', 'position' => 'Guru Produktif Busana', 'photo' => 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80'],
            ['id' => 'b1b0c1a2-0007-4000-8000-000000000007', 'name' => 'Agus Salim, S.Pd.', 'email' => 'agus.salim@smkn11.sch.id', 'teacher_id' => 'GR-SMKN11-07', 'subject' => 'Matematika', 'position' => 'Guru Mapel Matematika', 'photo' => 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=800&q=80'],
            ['id' => 'b1b0c1a2-0008-4000-8000-000000000008', 'name' => 'Ratna Sari, S.Pd.', 'email' => 'ratna.sari@smkn11.sch.id', 'teacher_id' => 'GR-SMKN11-08', 'subject' => 'Bahasa Indonesia', 'position' => 'Guru Mapel Bahasa Indonesia', 'photo' => 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=800&q=80'],
            ['id' => 'b1b0c1a2-0009-4000-8000-000000000009', 'name' => 'Hendra Gunawan, S.Pd.', 'email' => 'hendra.gunawan@smkn11.sch.id', 'teacher_id' => 'GR-SMKN11-09', 'subject' => 'Bahasa Inggris', 'position' => 'Guru Mapel Bahasa Inggris', 'photo' => 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80'],
            ['id' => 'b1b0c1a2-0010-4000-8000-000000000010', 'name' => 'Siti Maesaroh, M.Pd.', 'email' => 'siti.maesaroh@smkn11.sch.id', 'teacher_id' => 'GR-SMKN11-10', 'subject' => 'Pendidikan Agama Islam', 'position' => 'Guru PAI', 'photo' => 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80'],
            ['id' => 'b1b0c1a2-0011-4000-8000-000000000011', 'name' => 'Fajar Nugroho, S.Kom.', 'email' => 'fajar.nugroho@smkn11.sch.id', 'teacher_id' => 'GR-SMKN11-11', 'subject' => 'Informatika', 'position' => 'Guru Mapel Informatika', 'photo' => 'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?auto=format&fit=crop&w=800&q=80'],
            ['id' => 'b1b0c1a2-0012-4000-8000-000000000012', 'name' => 'Yulia Febrianti, S.Pd.', 'email' => 'yulia.febrianti@smkn11.sch.id', 'teacher_id' => 'GR-SMKN11-12', 'subject' => 'PKWU', 'position' => 'Guru Mapel PKWU', 'photo' => 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80'],
        ];

        foreach ($rows as $row) {
            $user = User::firstOrCreate(
                ['id' => $row['id']],
                [
                    'email' => $row['email'],
                    'password' => Hash::make('smkn11guru'),
                    'name' => $row['name'],
                    'profile' => ['name' => $row['name']],
                    'email_verified_at' => now(),
                ]
            );

            Profile::updateOrCreate(
                ['id' => $row['id']],
                [
                    'role' => 'guru',
                    'name' => $row['name'],
                    'email' => $row['email'],
                    'photo' => $row['photo'],
                    'updated_at' => now(),
                ]
            );

            Guru::updateOrCreate(
                ['id' => $row['id']],
                [
                    'id' => $row['id'],
                    'teacher_id' => $row['teacher_id'],
                    'subject' => $row['subject'],
                    'position' => $row['position'],
                ]
            );
        }
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
        $this->seedSpmbPosters();
        $this->seedOsis();
        $this->seedExtracurriculars();
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
        // Cleaned per user request 2026-08-20: lowongan kerja bkk - dummy data removed
        $rows = [];

        foreach ($rows as $row) {
            JobVacancy::updateOrCreate(['slug' => $row['slug']], $row);
        }
    }

    protected function seedBkkSettings(): void
    {
        ContentRecord::firstOrCreate(
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

        ContentRecord::firstOrCreate(
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
        // Cleaned per user request 2026-08-20: perusahaan partner bkk - dummy data removed
        $rows = [];

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
        ContentRecord::firstOrCreate(
            ['content_type' => 'home'],
            ['data' => [
                'hero' => ['images' => ['/images/hero/hero-1.jpg', '/images/hero/hero-2.jpg', '/images/hero/hero-3.jpg'], 'frame_image' => '/images/hero/frame.jpg', 'description' => 'Sekolah kejuruan favorit yang menyiapkan lulusan unggul, berkarakter, dan memiliki kompetensi tinggi sesuai kebutuhan industri masa depan.', 'accreditation' => 'Peringkat B', 'facility_title' => 'Fasilitas Modern', 'facility_description' => 'Mendukung penuh kompetensi siswa di era digital.'],
                'welcome' => ['principal_name' => 'Emma Sukmayati', 'principal_title' => 'Kepala SMKN 11 Kab. Tangerang', 'title' => 'Selamat Datang di Portal Resmi SMKN 11 Kabupaten Tangerang', 'paragraphs' => ['Puji syukur kita panjatkan ke hadirat Allah SWT atas rahmat dan karunia-Nya. Di era digitalisasi dan disrupsi teknologi saat ini, pendidikan vokasi memegang peran krusial dalam mencetak generasi muda yang tidak hanya kompeten, tetapi juga memiliki karakter dan daya adaptasi yang tinggi.', 'SMKN 11 Kabupaten Tangerang berkomitmen penuh untuk menjadi lembaga pendidikan yang inovatif, berdaya saing global, dan berakar pada nilai-nilai luhur bangsa. Melalui sinkronisasi kurikulum dengan industri, kami berupaya memastikan lulusan kami siap menghadapi tantangan dunia kerja masa depan.'], 'quote' => '"SMK BISA, SMK HEBAT, Vokasi Kuat Menguatkan Indonesia!"'],
                'about' => ['title' => 'Tentang SMKN 11 Kabupaten Tangerang', 'subtitle' => 'Sekolah vokasi yang menyiapkan lulusan unggul, kompeten, dan siap bersaing di dunia kerja.', 'paragraphs' => ['SMKN 11 Kabupaten Tangerang adalah lembaga pendidikan kejuruan negeri yang berdiri pada tahun 2013 dan berkomitmen mencetak siswa berprestasi, berakhlaqul karimah, dan memiliki kompetensi sesuai kebutuhan industri.', 'Berlokasi di Kp. Saradan, Desa Pangkat, Kecamatan Jayanti, sekolah ini memiliki 6 program keahlian unggulan dengan 1.124 siswa aktif dan 51 tenaga pengajar profesional yang berdedikasi.', 'Dengan akreditasi B dan didukung fasilitas laboratorium, bengkel, serta lingkungan belajar yang kondusif, lulusan kami tidak hanya siap bekerja, tetapi juga memiliki jiwa kewirausahaan dan akhlak mulia yang kuat.'], 'card_label' => 'Sekolah kami', 'card_title' => 'Lingkungan belajar yang memotivasi', 'quote' => '"Kami terus mendorong setiap siswa untuk tumbuh menjadi pribadi yang unggul, disiplin, dan siap memberikan kontribusi nyata bagi masyarakat dan bangsa."', 'location' => 'Kabupaten Tangerang, Banten'],
                'stats' => [['value' => '1.124+', 'label' => 'Siswa Aktif'], ['value' => '51+', 'label' => 'Tenaga Pengajar'], ['value' => '6', 'label' => 'Program Keahlian'], ['value' => '33', 'label' => 'Rombel']],
                'social' => ['instagram' => 'https://instagram.com/official_smkn11kab.tng', 'tiktok' => 'https://tiktok.com/@osis_smkn11kabtangeran', 'email' => 'smkn11kabtangschool@gmail.com'],
                'contact' => ['address' => "Kp. Saradan RT. 03/01, Desa Pangkat,\nKec. Jayanti, Kab. Tangerang, Banten 15610", 'phone' => '0812 9922 0831', 'email' => 'smkn11kabtangschool@gmail.com', 'hours' => 'Senin - Jumat, 07:00 - 15:00 WIB', 'map_query' => 'Kp. Saradan RT. 03/01, Pangkat, Jayanti, Kabupaten Tangerang, Banten 15610'],
            ]]
        );
    }

    protected function seedNews(): void
    {
        // Cleaned per user request 2026-08-20: berita - dummy data removed, intentionally left empty
        $rows = [];

        foreach ($rows as $row) {
            $row['slug'] = Str::slug($row['title']);
            News::updateOrCreate(['title' => $row['title']], $row);
        }
    }

    protected function seedPrograms(): void
    {
        $rows = [
            [
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
            $row['slug'] = Str::slug($row['short_name']);
            Program::updateOrCreate(['short_name' => $row['short_name']], $row);
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
            ['name' => 'Budi Santoso, S.Kom.', 'position' => 'Wakil Kepala Sekolah Bid. Keamanan', 'department' => 'Keamanan', 'photo' => 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80', 'description' => 'Membina pengembangan karakter, kedisiplinan, dan kegiatan kesiswaan agar murid tumbuh menjadi pribadi yang berakhlak mulia.'],
            ['name' => 'Haryanto, S.T.', 'position' => 'Wakil Kepala Sekolah Bid. Security', 'department' => 'Keamanan', 'photo' => 'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?auto=format&fit=crop&w=800&q=80', 'description' => 'Mengelola sarana dan prasarana sekolah agar mendukung proses pembelajaran yang aman, nyaman, dan optimal.'],
            ['name' => 'Dra. Rini Wulandari', 'position' => 'Wakil Kepala Sekolah Bid. Keamanan & Hubin', 'department' => 'Keamanan', 'photo' => 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=800&q=80', 'description' => 'Menjalin kemitraan dengan dunia usaha dan industri serta membangun citra sekolah melalui hubungan masyarakat yang baik.'],
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
        // Cleaned per user request 2026-08-20: prestasi siswa - dummy data removed
        $rows = [];

        foreach ($rows as $row) {
            Achievement::updateOrCreate(['title' => $row['title']], $row);
        }
    }

    protected function seedTeacherActivities(): void
    {
        // Cleaned per user request 2026-08-20: teacher_activities - dummy data removed
        $rows = [];

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
            ['name' => 'Titi Maryati', 'position' => 'Staf Keamanan', 'department' => 'Keamanan', 'photo' => 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80'],
            ['name' => 'Ahmad Rifai', 'position' => 'Security', 'department' => 'Keamanan', 'photo' => 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80'],
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

    protected function seedSpmbPosters(): void
    {
        $rows = [
            ['title' => 'Informasi SPMB 2026/2027', 'image' => 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1200&q=80', 'is_active' => true, 'sort_order' => 1],
            ['title' => 'Jadwal Pendaftaran SPMB', 'image' => 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80', 'is_active' => true, 'sort_order' => 2],
            ['title' => 'Persyaratan Pendaftaran', 'image' => 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80', 'is_active' => true, 'sort_order' => 3],
        ];

        foreach ($rows as $row) {
            SpmbPoster::updateOrCreate(['title' => $row['title']], $row);
        }
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

        $activities = [];
        // kegiatan osis - dummy removed per request 2026-08-20

        foreach ($activities as $activity) {
            OsisActivity::updateOrCreate(['title' => $activity['title']], $activity);
        }
    }

    protected function seedExtracurriculars(): void
    {
        // Cleaned per user request 2026-08-20: extracurriculars - dummy data removed
        $rows = [];

        foreach ($rows as $row) {
            $slug = Str::slug($row['name']);
            Extracurricular::updateOrCreate(
                ['slug' => $slug],
                $row + ['slug' => $slug, 'place' => '', 'achievements' => [], 'documentation' => [], 'status' => 'published']
            );
        }
    }

    protected function seedMading(): void
    {
        // Cleaned per user request 2026-08-20: mading - dummy data removed
        $categories = [];

        $categoryIds = [];
        foreach ($categories as $category) {
            $categoryIds[$category['slug']] = MadingCategory::updateOrCreate(['slug' => $category['slug']], $category)->id;
        }

        $posts = [];

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
        // Cleaned per user request 2026-08-20: galeri - dummy data removed
        $items = [];

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
