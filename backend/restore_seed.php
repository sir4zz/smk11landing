<?php

use App\Models\Achievement;
use App\Models\EducationStaff;
use App\Models\Extracurricular;
use App\Models\Facility;
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
use App\Models\Program;
use App\Models\Staff;
use App\Models\TeacherActivity;
use Illuminate\Support\Facades\DB;

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$osisId = '00000000-0000-4000-8000-000000000001';

DB::transaction(function () use ($osisId) {
    $osis = Osis::where('id', $osisId)->first();
    if (! $osis) {
        $osis = new Osis([
            'name' => 'OSIS SMKN 11 Kabupaten Tangerang',
            'description' => 'Organisasi Siswa Intra Sekolah (OSIS) SMKN 11 Kabupaten Tangerang adalah wadah organisasi bagi siswa untuk mengembangkan jiwa kepemimpinan, kreativitas, dan kepedulian sosial di lingkungan sekolah maupun masyarakat.',
            'period' => '2025/2026',
            'logo' => '',
            'updated_at' => now(),
        ]);
        $osis->id = $osisId;
        $osis->save();
    }

    $osisMembers = [
        ['Andi Pratama', 'Ketua', 'Ketua OSIS', 1],
        ['Sinta Lestari', 'Wakil Ketua', 'Wakil Ketua OSIS', 2],
        ['Rizky Ramadhan', 'Sekretaris', 'Sekretaris', 3],
        ['Dewi Anggraini', 'Bendahara', 'Bendahara', 4],
        ['Ahmad Fauzi', 'Ketua Bidang', 'Pembinaan Karakter', 5],
        ['Nabila Putri', 'Ketua Bidang', 'Seni & Kreativitas', 6],
    ];
    foreach ($osisMembers as [$name, $position, $division, $sort]) {
        OsisMember::updateOrCreate(
            ['osis_id' => $osisId, 'name' => $name],
            ['position' => $position, 'division' => $division, 'photo' => '', 'sort_order' => $sort]
        );
    }

    $osisActivities = [
        ['Latihan Kepemimpinan Siswa (LKS)', 'Kegiatan pelatihan kepemimpinan yang diikuti oleh pengurus OSIS dan perwakilan kelas untuk membangun jiwa pemimpin yang tangguh dan bertanggung jawab.', 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=900&q=80', '2026-01-15', 'published'],
        ['Peringatan Hari Kemerdekaan RI', 'Rangkaian kegiatan perayaan HUT kemerdekaan RI yang melibatkan seluruh warga sekolah, mulai dari upacara bendera hingga lomba-lomba kebangsaan.', 'https://images.unsplash.com/photo-1532375810709-75b1da00537c?auto=format&fit=crop&w=900&q=80', '2026-08-17', 'published'],
        ['Bakti Sosial Peduli Lingkungan', 'Kegiatan kerja bakti dan penghijauan di sekitar lingkungan sekolah sebagai wujud kepedulian OSIS terhadap kelestarian lingkungan.', 'https://images.unsplash.com/photo-1526392060635-9d6019884377?auto=format&fit=crop&w=900&q=80', '2026-03-05', 'published'],
    ];
    foreach ($osisActivities as [$title, $desc, $photo, $date, $status]) {
        OsisActivity::updateOrCreate(
            ['title' => $title],
            ['description' => $desc, 'photo' => $photo, 'activity_date' => $date, 'status' => $status]
        );
    }

    $extracurriculars = [
        ['Paskibra Satria 11', 'paskibra-satria-11', 'Kedisiplinan', 'Pasukan Pengibar Bendera yang melatih kedisiplinan, kekompakan, dan jiwa nasionalisme melalui latihan baris-berbaris dan tata upacara bendera.', 'Aiptu Hendra Gunawan', 'Jumat & Sabtu', 'https://images.unsplash.com/photo-1526976668913-0b7520b8c12d?auto=format&fit=crop&w=900&q=80'],
        ['Futsal', 'futsal', 'Olahraga', 'Wadah pengembangan bakat olahraga futsal yang telah menorehkan berbagai prestasi di tingkat kabupaten dan provinsi.', 'Pak Rahmat Hidayat', 'Selasa & Kamis', 'https://images.unsplash.com/photo-1552664688-cf1ec3b78426?auto=format&fit=crop&w=900&q=80'],
        ['Basket', 'basket', 'Olahraga', 'Ekstrakurikuler bola basket yang mengedepankan kerja sama tim, ketangkasan, dan sportivitas.', 'Pak Dede Supriyadi', 'Senin & Rabu', 'https://images.unsplash.com/photo-1574623452339-5e2b0dc96d8f?auto=format&fit=crop&w=900&q=80'],
        ['Rohis (Rohani Islam)', 'rohis-rohani-islam', 'Keagamaan', 'Kegiatan kerohanian Islam yang bertujuan memperkuat iman, akhlak mulia, dan wawasan keislaman siswa melalui kajian, mentoring, dan kegiatan sosial.', 'Bu Aisyah S.Pd.I', 'Jumat', 'https://images.unsplash.com/photo-1585412727339-54e4bae3bbf9?auto=format&fit=crop&w=900&q=80'],
        ['PMR (Palang Merah Remaja)', 'pmr-palang-merah-remaja', 'Sosial', 'Organisasi kepalangmerahan yang melatih siswa menjadi relawan tanggap darurat, pertolongan pertama, dan donor darah.', 'Bu Dewi Sartika', 'Sabtu', 'https://images.unsplash.com/photo-1512486130939-2c6f79935e4f?auto=format&fit=crop&w=900&q=80'],
        ['Pramuka', 'pramuka', 'Kedisiplinan', 'Kegiatan kepanduan yang membentuk karakter, kemandirian, dan jiwa kepemimpinan melalui berbagai kegiatan outdoor dan keterampilan.', 'Pak Sutrisno', 'Jumat', 'https://images.unsplash.com/photo-1521184975302-1c3d0c5355bf?auto=format&fit=crop&w=900&q=80'],
        ['Jurnalistik & Multimedia', 'jurnalistik-multimedia', 'Seni & Kreatif', 'Wadah pengembangan minat di bidang penulisan, fotografi, videografi, dan produksi konten digital untuk publikasi sekolah.', 'Pak Wahyu Nugroho', 'Rabu', 'https://images.unsplash.com/photo-1574688084565-51d6d5f4f2e?auto=format&fit=crop&w=900&q=80'],
        ['Seni Tari & Musik', 'seni-tari-musik', 'Seni & Kreatif', 'Eksplorasi bakat seni tari tradisional dan modern, serta musik, yang sering tampil pada acara-acara sekolah dan lomba kebudayaan.', 'Bu Rina Marlina', 'Kamis', 'https://images.unsplash.com/photo-1516280464613-81e30c6f1f0b?auto=format&fit=crop&w=900&q=80'],
        ['English Club', 'english-club', 'Akademik', 'Klub percakapan bahasa Inggris yang meningkatkan kemampuan speaking, listening, dan public speaking melalui debat, storytelling, dan diskusi.', 'Bu Nani Kusumawati', 'Selasa', 'https://images.unsplash.com/photo-1582656894606-c1c9e6ef015d?auto=format&fit=crop&w=900&q=80'],
        ['Taekwondo', 'taekwondo', 'Olahraga', 'Latihan bela diri taekwondo untuk mengembangkan kesehatan fisik, disiplin, dan kemampuan bela diri dengan pembinaan berjenjang.', 'Pak Agus Salim', 'Kamis & Sabtu', 'https://images.unsplash.com/photo-1576200962002-b08bab9ca72f?auto=format&fit=crop&w=900&q=80'],
    ];
    foreach ($extracurriculars as [$name, $slug, $category, $desc, $advisor, $schedule, $photo]) {
        Extracurricular::updateOrCreate(
            ['slug' => $slug],
            ['name' => $name, 'category' => $category, 'description' => $desc, 'photo' => $photo, 'advisor' => $advisor, 'schedule' => $schedule, 'place' => '', 'achievements' => [], 'documentation' => [], 'status' => 'published']
        );
    }

    $madingCategories = [
        ['puisi', 'Puisi', 1], ['cerpen', 'Cerpen', 2], ['artikel', 'Artikel', 3], ['pantun', 'Pantun', 4],
        ['esai', 'Esai', 5], ['opini', 'Opini', 6], ['edukasi', 'Edukasi', 7], ['teknologi', 'Teknologi', 8],
        ['motivasi', 'Motivasi', 9], ['karya-kreatif', 'Karya Kreatif', 10],
    ];
    foreach ($madingCategories as [$slug, $name, $sort]) {
        MadingCategory::updateOrCreate(['slug' => $slug], ['name' => $name, 'sort_order' => $sort]);
    }

    $madingPosts = [
        ['Menjaga Semangat Belajar di Tengah Kesibukan', 'Di tengah banyaknya kegiatan sekolah, penting bagi kita untuk tetap menjaga semangat belajar. Manajemen waktu yang baik, istirahat yang cukup, dan lingkungan yang mendukung adalah kunci agar tetap produktif.', 'motivasi', 'Redaksi Mading', '2026-07-01 00:00:00', '2026-06-28 10:00:00'],
        ['Puisi: Senyum Hangus Rindu', 'Di balik jendela yang kau tinggal, ada senyum yang malam ini ku simpan. Hingga hari-hari ini semakin panjang, kasih tak pernah kehilangan peta hatimu.', 'puisi', 'Siswa Kelas X', '2026-06-20 00:00:00', '2026-06-18 09:00:00'],
        ['Tips Sukses Praktik Kerja Lapangan (PKL)', 'PKL adalah kesempatan emas untuk mengenal dunia kerja. Datang tepat waktu, berpakaian rapi, aktif bertanya, jujur dalam bekerja, dan dokumentasikan kegiatan harian.', 'edukasi', 'Siswa Kelas XII', '2026-07-05 00:00:00', '2026-07-03 14:00:00'],
        ['Pantun: Semangat Belajar', 'Pergi ke pasar membeli mangga, Jangan lupa beli rambutan juga, Rajin belajar setiap pagi, Sukses pasti akan kau dapatkan nanti.', 'pantun', 'Siswa Kelas XI', '2026-06-25 00:00:00', '2026-06-22 11:00:00'],
        ['Esai: Pentingnya Literasi Digital bagi Siswa SMK', 'Di era industri 4.0, literasi digital bukan lagi pilihan melainkan keharusan. Siswa SMK dituntut memahami etika digital, keamanan siber, dan kemampuan menyaring informasi.', 'esai', 'Redaksi Mading', '2026-07-08 00:00:00', '2026-07-05 08:00:00'],
        ['Cerpen: Sepatu Baru Pak Surya', 'Pak Surya adalah seorang guru produktif yang selalu datang lebih awal. Suatu pagi, ia datang memakai sepatu baru yang mengkilap. "Sepatu baru, semangat baru," katanya. Sepatu itu ternyata hadiah dari alumni yang kini sukses menjadi teknisi.', 'cerpen', 'Siswa Kelas X', '2026-06-30 00:00:00', '2026-06-28 13:00:00'],
    ];
    foreach ($madingPosts as [$title, $content, $catSlug, $authorName, $publishedAt, $createdAt]) {
        $category = MadingCategory::where('slug', $catSlug)->first();
        MadingPost::updateOrCreate(
            ['title' => $title],
            [
                'category_id' => $category?->id,
                'author_id' => null,
                'author_name' => $authorName,
                'author_role' => 'siswa',
                'cover_image' => '',
                'status' => 'published',
                'feedback' => '',
                'published_at' => $publishedAt,
                'created_at' => $createdAt,
                'updated_at' => $createdAt,
            ]
        );
    }

    $kesemaptaanId = '00000000-0000-4000-8000-000000000002';
    $kesemaptaan = Kesemaptaan::where('id', $kesemaptaanId)->first();
    if (! $kesemaptaan) {
        $kesemaptaan = new Kesemaptaan([
            'title' => 'Kesemaptaan SMKN 11 Kabupaten Tangerang',
            'description' => 'Kesemaptaan adalah program pembinaan kedisiplinan, fisik, dan ketahanan mental serta keterampilan baris-berbaris (PBB) bagi siswa. Kegiatan ini membentuk karakter disiplin, tangguh, dan bertanggung jawab.',
            'photo' => '',
            'updated_at' => now(),
        ]);
        $kesemaptaan->id = $kesemaptaanId;
        $kesemaptaan->save();
    }

    $kesemaptaanActivities = [
        ['Latihan Dasar Kedisiplinan (LDK)', 'Pelatihan dasar kedisiplinan dan pembinaan fisik untuk membentuk karakter siswa yang tertib dan bertanggung jawab.', '2026-02-10', 'published'],
        ['Pembinaan Fisik & Keterampilan Baris-Berbaris', 'Latihan fisik dan keterampilan PBB yang rutin dilaksanakan untuk menjaga kebugaran dan membangun kekompakan.', '2026-03-20', 'published'],
        ['Latihan Khusus Tim PBB Satria 11', 'Latihan intensif bagi tim PBB Satria 11 dalam persiapan lomba baris-berbaris tingkat kabupaten dan provinsi.', '2026-05-15', 'published'],
        ['Upacara Apel Besar & Pelantikan Anggota Baru', 'Apel besar sekolah sekaligus pelantikan anggota baru tim Kesemaptaan periode 2025/2026.', '2026-08-30', 'published'],
    ];
    foreach ($kesemaptaanActivities as [$title, $desc, $date, $status]) {
        KesemaptaanActivity::updateOrCreate(['title' => $title], ['description' => $desc, 'activity_date' => $date, 'documentation' => [], 'status' => $status]);
    }

    $kesemaptaanSchedules = [
        ['Senin', '15.30 - 17.00', 'Lapangan Sekolah'],
        ['Rabu', '15.30 - 17.00', 'Lapangan Sekolah'],
        ['Sabtu', '08.00 - 10.00', 'Lapangan Sekolah'],
    ];
    foreach ($kesemaptaanSchedules as [$day, $time, $place]) {
        KesemaptaanSchedule::firstOrCreate(['day' => $day, 'time' => $time], ['place' => $place]);
    }

    $kesemaptaanInstructors = [
        ['Serka Ahmad Yani', 'Pembina Utama', '', 1],
        ['Pelda Rina Kusuma', 'Instruktur PBB', '', 2],
        ['Kopda Sutrisno', 'Instruktur Fisik & Mental', '', 3],
    ];
    foreach ($kesemaptaanInstructors as [$name, $role, $photo, $sort]) {
        KesemaptaanInstructor::firstOrCreate(['name' => $name], ['role' => $role, 'photo' => $photo, 'sort_order' => $sort]);
    }

    $kesemaptaanAchievements = [
        ['Juara II Lomba Baris-Berbaris Tingkat Kabupaten', '2025', 'Tim PBB SMKN 11 meraih juara kedua dalam lomba baris-berbaris tingkat Kabupaten Tangerang.'],
        ['Juara III Lomba PBB Se-Kabupaten Tangerang', '2024', 'Tim PBB Satria 11 meraih juara ketiga dalam lomba baris-berbaris antar SMK se-Kabupaten Tangerang.'],
        ['Best Performance Pasukan Pengibar Bendera', '2025', 'Paskibra Satria 11 mendapatkan penghargaan Best Performance pada upacara Hari Kemerdekaan tingkat kabupaten.'],
    ];
    foreach ($kesemaptaanAchievements as [$name, $year, $desc]) {
        KesemaptaanAchievement::firstOrCreate(['name' => $name], ['year' => $year, 'description' => $desc, 'documentation' => []]);
    }
});

$dummy = json_decode(file_get_contents(__DIR__.'/database/seeders/dummy_data.json'), true);

foreach ($dummy['news'] as $row) {
    News::updateOrCreate(
        ['slug' => $row['slug']],
        ['title' => $row['title'], 'date' => $row['date'], 'excerpt' => $row['excerpt'] ?? '', 'content' => $row['content'] ?? '', 'thumbnail' => $row['thumbnail'] ?? '', 'category' => $row['category'] ?? '', 'author' => $row['author'] ?? '', 'source_type' => 'manual', 'source_label' => 'Berita mandiri', 'source_note' => '', 'source_url' => '']
    );
}

foreach ($dummy['programs'] as $row) {
    Program::updateOrCreate(
        ['slug' => $row['slug']],
        ['name' => $row['name'], 'short_name' => $row['shortName'] ?? '', 'icon' => $row['icon'] ?? '', 'image' => $row['image'] ?? '', 'description' => $row['description'] ?? '', 'short_description' => $row['shortDescription'] ?? '', 'competencies' => $row['competencies'] ?? [], 'career_prospects' => $row['careerProspects'] ?? [], 'facilities' => $row['facilities'] ?? []]
    );
}

foreach ($dummy['facilities'] as $row) {
    Facility::updateOrCreate(
        ['name' => $row['name']],
        ['description' => $row['description'] ?? '', 'category' => $row['category'] ?? '', 'photo' => $row['photo'] ?? '']
    );
}

foreach ($dummy['staff'] as $row) {
    Staff::updateOrCreate(
        ['name' => $row['name']],
        ['position' => $row['position'] ?? '', 'department' => $row['department'] ?? '', 'photo' => $row['photo'] ?? '', 'description' => $row['description'] ?? '']
    );
}

foreach ($dummy['achievements'] as $row) {
    Achievement::updateOrCreate(
        ['title' => $row['title']],
        ['event' => $row['event'] ?? '', 'year' => $row['year'] ?? null, 'level' => $row['level'] ?? '', 'rank' => $row['rank'] ?? '', 'students' => $row['students'] ?? [], 'photo' => $row['photo'] ?? '']
    );
}

foreach ($dummy['teacher_activities'] as $row) {
    TeacherActivity::updateOrCreate(
        ['title' => $row['title']],
        ['date' => $row['date'] ?? null, 'category' => $row['category'] ?? '', 'description' => $row['description'] ?? '', 'photo' => $row['photo'] ?? '']
    );
}

foreach ($dummy['education_staff'] as $row) {
    EducationStaff::updateOrCreate(
        ['name' => $row['name']],
        ['position' => $row['position'] ?? '', 'department' => $row['department'] ?? '', 'photo' => $row['photo'] ?? '']
    );
}

echo "Restore content selesai.\n";
