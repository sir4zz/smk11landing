<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $now = now()->toDateTimeString();

        $extracurriculars = [
            [
                'name' => 'Karate',
                'slug' => 'karate',
                'logo' => '',
                'category' => 'Olahraga',
                'description' => 'Ekstrakurikuler bela diri Karate melatih fisik, mental, dan karakter siswa melalui teknik tendangan, pukulan, dan kuda-kuda.',
                'short_description' => 'Bela diri Karate untuk melatih fisik dan mental.',
                'full_description' => "Karate adalah salah satu ekstrakurikuler bela diri yang paling diminati di SMKN 11. Melalui latihan yang teratur, siswa tidak hanya mempelajari teknik tendangan, pukulan, dan kuda-kuda, tetapi juga menanamkan nilai-nilai disiplin, hormat, dan pantang menyerah.\n\nSetiap sesi latihan dimulai dengan pemanasan, diikuti latihan teknik dasar (kihon), latihan bentuk (kata), dan sparing (kumite). Siswa akan dibimbing untuk mencapai tingkatan sabuk secara bertahap.\n\nKarate membentuk siswa yang disiplin, percaya diri, dan memiliki kemampuan membela diri yang baik.",
                'photo' => 'https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&w=900&q=80',
                'advisor' => 'Pak Hendra',
                'schedule' => 'Selasa & Kamis, 15:30 - 17:00',
                'place' => 'Dojo Karate SMKN 11',
                'achievements' => json_encode(['Juara 2 Karate Tingkat Kabupaten 2024', 'Juara 3 Kumite Putra Se-Kota 2023']),
                'documentation' => json_encode([]),
                'gallery' => json_encode([]),
                'status' => 'published',
            ],
            [
                'name' => 'Marawis',
                'slug' => 'marawis',
                'logo' => '',
                'category' => 'Seni & Keagamaan',
                'description' => 'Kelompok rebana Marawis yang menampilkan musik Islami dalam berbagai acara keagamaan dan kegiatan sekolah.',
                'short_description' => 'Musik rebana Islami untuk acara keagamaan.',
                'full_description' => "Marawis adalah kelompok seni musik Islami yang menggunakan instrumen rebana dan alat perkusi lainnya. Ekstrakurikuler ini menjadi wadah bagi siswa yang memiliki minat dalam seni musik Islam.\n\nSelain mempelajari teknik bermain rebana, siswa juga belajar vokal, harmoni, dan memainkan sholawat. Marawis sering tampil pada acara-acara keagamaan seperti Maulid Nabi, Isra Mi'raj, dan berbagai acara sekolah lainnya.\n\nMelalui Marawis, siswa dapat mengekspresikan bakat seni mereka sekaligus memperkuat keimanan dan kebersamaan.",
                'photo' => 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&w=900&q=80',
                'advisor' => 'Bu Fatimah',
                'schedule' => 'Rabu, 15:30 - 17:00',
                'place' => 'Ruang Seni SMKN 11',
                'achievements' => json_encode(['Juara 1 Festival Marawis Se-Kabupaten 2024']),
                'documentation' => json_encode([]),
                'gallery' => json_encode([]),
                'status' => 'published',
            ],
            [
                'name' => 'Paskib',
                'slug' => 'paskib',
                'logo' => '',
                'category' => 'Kedisiplinan',
                'description' => 'Pasukan Pengibar Bendera yang melatih kedisiplinan, kekompakan, dan jiwa nasionalisme melalui latihan baris-berbaris.',
                'short_description' => 'Latihan baris-berbaris dan pengibaran bendera.',
                'full_description' => "Paskib (Pasukan Pengibar Bendera) adalah ekstrakurikuler yang bertanggung jawab atas pengibaran bendera merah putih pada upacara bendera di SMKN 11. Anggota Paskib mendapatkan pelatihan intensif dalam baris-berbaris, formasi, dan protokol upacara.\n\nLatihan meliputi ketangkasan baris, formasi variabel, pengaturan napas, dan kedisiplinan mental. Anggota Paskib juga aktif dalam berbagai kegiatan kenegaraan dan upacara hari besar nasional.\n\nMenjadi bagian dari Paskib merupakan kebanggaan tersendiri karena menuntut dedikasi, ketelitian, dan kekompakan yang tinggi.",
                'photo' => 'https://images.unsplash.com/photo-1526976668913-0b7520b8c12d?auto=format&fit=crop&w=900&q=80',
                'advisor' => 'Aiptu Hendra Gunawan',
                'schedule' => 'Jumat & Sabtu, 14:00 - 17:00',
                'place' => 'Lapangan Utama SMKN 11',
                'achievements' => json_encode(['Juara 1 Paskibra Tingkat Kabupaten 2024', 'Peserta Terbaik Upacara HUT RI ke-79']),
                'documentation' => json_encode([]),
                'gallery' => json_encode([]),
                'status' => 'published',
            ],
            [
                'name' => 'PIK-R',
                'slug' => 'pik-r',
                'logo' => '',
                'category' => 'Kepemudaan',
                'description' => 'Pusat Informasi dan Konseling Remaja yang memberikan edukasi, konseling, dan informasi kesehatan reproduksi bagi remaja.',
                'short_description' => 'Konseling dan informasi kesehatan remaja.',
                'full_description' => "PIK-R (Pusat Informasi dan Konseling Remaja) adalah wadah edukasi dan konseling bagi siswa SMKN 11. Program ini membantu remaja memahami perkembangan diri, kesehatan reproduksi, dan pengambilan keputusan yang bijak.\n\nAnggota PIK-R dilatih untuk menjadi teman sebaya (peer counselor) yang mampu memberikan informasi dan dukungan kepada sesama siswa. Kegiatan meliputi seminar kesehatan, diskusi kelompok, kampanye hidup sehat, dan konseling individu.\n\nPIK-R berperan penting dalam menciptakan lingkungan sekolah yang sehat, aman, dan suportif bagi seluruh siswa.",
                'photo' => 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=900&q=80',
                'advisor' => 'Bu Siti Nurhaliza',
                'schedule' => 'Kamis, 15:00 - 16:30',
                'place' => 'Ruang Konseling SMKN 11',
                'achievements' => json_encode(['Sekolah PIK-R Berprestasi Tingkat Provinsi 2024']),
                'documentation' => json_encode([]),
                'gallery' => json_encode([]),
                'status' => 'published',
            ],
            [
                'name' => 'PMI',
                'slug' => 'pmi',
                'logo' => '',
                'category' => 'Sosial',
                'description' => 'Palang Merah Remaja yang melatih siswa menjadi relawan tanggap darurat, pertolongan pertama, dan donor darah.',
                'short_description' => 'Relawan tanggap darurat dan donor darah.',
                'full_description' => "PMI (Palang Merah Remaja) adalah organisasi kepalangmerahan yang berada di bawah naungan Palang Merah Indonesia. Ekstrakurikuler ini melatih siswa untuk menjadi relawan yang siap membantu dalam situasi darurat.\n\nAnggota PMI mempelajari Pertolongan Pertama Pada Kecelakaan (P3K), teknik evakuasi, prosedur evakuasi, dan pengelolaan darah. PMI juga aktif mengorganisir donor darah dan kegiatan sosial lainnya.\n\nMelalui PMI, siswa belajar empati, kepedulian sosial, dan kesiapan menghadapi situasi darurat dengan tenang dan terorganisir.",
                'photo' => 'https://images.unsplash.com/photo-1512486130939-2c4f79935e4f?auto=format&fit=crop&w=900&q=80',
                'advisor' => 'Bu Dewi Sartika',
                'schedule' => 'Sabtu, 08:00 - 10:00',
                'place' => 'Ruang PMI SMKN 11',
                'achievements' => json_encode(['Juara 2 Lomba PMR Tingkat Kabupaten 2024', 'Relawan Terbaik Donor Darah Sukarela']),
                'documentation' => json_encode([]),
                'gallery' => json_encode([]),
                'status' => 'published',
            ],
            [
                'name' => 'Pramuka',
                'slug' => 'pramuka',
                'logo' => '',
                'category' => 'Kepanduan',
                'description' => 'Kegiatan kepanduan yang membentuk karakter, kemandirian, dan jiwa kepemimpinan melalui kegiatan outdoor dan keterampilan.',
                'short_description' => 'Kepanduan untuk karakter dan kepemimpinan.',
                'full_description' => "Pramuka (Praja Muda Karana) adalah kegiatan kepanduan yang merupakan bagian penting dari pendidikan karakter di SMKN 11. Melalui kegiatan Pramuka, siswa belajar kemandirian, kepemimpinan, kerja sama, dan cinta alam.\n\nKegiatan Pramuka meliputi perkemahan, hiking, pembacaan tanda jejak (tracking), survival skills, dan berbagai kegiatan lapangan lainnya. Siswa juga mempelajari tali-temali, sandi, dan keterampilan kepramukaan lainnya.\n\nPramuka membentuk generasi muda yang tangguh, mandiri, dan peduli lingkungan sekitar.",
                'photo' => 'https://images.unsplash.com/photo-1521185496952-571e42c3f5b0?auto=format&fit=crop&w=900&q=80',
                'advisor' => 'Pak Sutrisno',
                'schedule' => 'Jumat, 14:30 - 17:00',
                'place' => 'Lapangan & Hutan Sekolah',
                'achievements' => json_encode(['Juara 1 Perkemahan Pramuka Tingkat Kabupaten 2024', 'Juara Survival Skills Se-Kota 2023']),
                'documentation' => json_encode([]),
                'gallery' => json_encode([]),
                'status' => 'published',
            ],
            [
                'name' => 'Robotik',
                'slug' => 'robotik',
                'logo' => '',
                'category' => 'Teknologi',
                'description' => 'Ekstrakurikuler yang mengajarkan siswa merancang, membangun, dan memprogram robot untuk kompetisi dan proyek STEM.',
                'short_description' => 'Rancang, bangun, dan program robot.',
                'full_description' => "Robotik adalah ekstrakurikuler yang mengembangkan keterampilan STEM (Science, Technology, Engineering, Mathematics) melalui aktivitas merancang, membangun, dan memprogram robot.\n\nSiswa belajar menggunakan mikrokontroler Arduino, sensor, motor, dan berbagai komponen elektronik untuk membuat robot yang dapat menjalankan tugas tertentu. Kegiatan meliputi workshop pemrograman, sesi desain robot, dan persiapan kompetisi.\n\nRobotik membuka wawasan siswa tentang teknologi masa depan dan melatih kemampuan berpikir logis, kreatif, dan problem solving.",
                'photo' => 'https://images.unsplash.com/photo-1535378917042-10a22c95931a?auto=format&fit=crop&w=900&q=80',
                'advisor' => 'Pak Ahmad Rifai',
                'schedule' => 'Selasa & Kamis, 15:30 - 17:30',
                'place' => 'Lab Komputer SMKN 11',
                'achievements' => json_encode(['Juara 1 Lomba Robot Line Following Tingkat Provinsi 2024', 'Best Design Robot COMTECH 2023']),
                'documentation' => json_encode([]),
                'gallery' => json_encode([]),
                'status' => 'published',
            ],
            [
                'name' => 'Rohis',
                'slug' => 'rohis',
                'logo' => '',
                'category' => 'Keagamaan',
                'description' => 'Kegiatan kerohanian Islam yang memperkuat iman, akhlak mulia, dan wawasan keislaman siswa melalui kajian dan mentoring.',
                'short_description' => 'Kajian keislaman untuk memperkuat iman.',
                'full_description' => "Rohis (Rohani Islam) adalah ekstrakurikuler yang berfokus pada pengembangan spiritual dan keilmuan Islam bagi siswa. Kegiatan meliputi kajian tafsir, hadits, fiqih, dan akhlak.\n\nAnggota Rohis mengikuti program mentoring mingguan, tadarus Al-Qur'an, peringatan hari besar Islam, dan kegiatan sosial seperti berbagi kepada yang membutuhkan.\n\nRohis menjadi wadah bagi siswa untuk memperdalam pemahaman keagamaan, memperkuat iman, dan mengamalkan nilai-nilai Islam dalam kehidupan sehari-hari.",
                'photo' => 'https://images.unsplash.com/photo-1585412727339-54e4bae3bbf9?auto=format&fit=crop&w=900&q=80',
                'advisor' => 'Bu Aisyah S.Pd.I',
                'schedule' => 'Jumat, 13:30 - 15:00',
                'place' => 'Musholla SMKN 11',
                'achievements' => json_encode(['Juara 1 MTQ Tingkat Pelajar Kabupaten 2024']),
                'documentation' => json_encode([]),
                'gallery' => json_encode([]),
                'status' => 'published',
            ],
            [
                'name' => 'Silat',
                'slug' => 'silat',
                'logo' => '',
                'category' => 'Olahraga',
                'description' => 'Bela diri Pencak Silat yang melestarikan budaya bangsa sekaligus melatih fisik, kelincahan, dan ketangkasan siswa.',
                'short_description' => 'Bela diri Pencak Silat warisan budaya.',
                'full_description' => "Pencak Silat adalah bela diri asli Indonesia yang diajarkan di SMKN 11 sebagai ekstrakurikuler. Selain sebagai olahraga, Silat juga merupakan warisan budaya yang harus dilestarikan.\n\nLatihan meliputi jurus dasar, teknik tendangan, pukolan, tangkish, dan seni pertunjukan. Siswa juga mempelajari filosofi dan nilai-nilai luhur yang terkandung dalam Pencak Silat.\n\nSilat melatih kelincahan, ketangkasan, kekuatan, dan disiplin. Siswa yang mengikuti Silat akan memiliki kemampuan membela diri sekaligus kecintaan terhadap budaya bangsa.",
                'photo' => 'https://images.unsplash.com/photo-1562088287-bde35a1ea917?auto=format&fit=crop&w=900&q=80',
                'advisor' => 'Pak Agus Setiawan',
                'schedule' => 'Senin & Rabu, 15:30 - 17:00',
                'place' => 'Gelanggang Silat SMKN 11',
                'achievements' => json_encode(['Juara 2 Silat Tingkat Provinsi 2024', 'Juara 1 Seni Pertunjukan Silat Se-Kabupaten 2023']),
                'documentation' => json_encode([]),
                'gallery' => json_encode([]),
                'status' => 'published',
            ],
            [
                'name' => 'Voli',
                'slug' => 'voli',
                'logo' => '',
                'category' => 'Olahraga',
                'description' => 'Ekstrakurikuler bola voli yang melatih kerja sama tim, ketangkasan, dan sportivitas melalui latihan dan pertandingan.',
                'short_description' => 'Bola voli untuk kerja sama tim dan sportivitas.',
                'full_description' => "Voli adalah ekstrakurikuler olahraga bola yang sangat populer di SMKN 11. Permainan ini melatih kerja sama tim, refleks, dan strategi permainan.\n\nLatihan meliputi teknik dasar passing, smash, servis, dan blocking. Siswa juga berlatih formasi permainan, strategi menyerang dan bertahan, serta membangun kekompakan tim.\n\nVoli menjadi sarana bagi siswa untuk menjaga kebugaran, mengembangkan kemampuan atletik, dan membangun semangat sportivitas serta kebersamaan.",
                'photo' => 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d6?auto=format&fit=crop&w=900&q=80',
                'advisor' => 'Pak Rudi Hartono',
                'schedule' => 'Senin & Jumat, 16:00 - 17:30',
                'place' => 'Lapangan Voli SMKN 11',
                'achievements' => json_encode(['Juara 3 Voli Putra Turnamen Pelajar Se-Kabupaten 2024', 'Fair Play Team Award 2023']),
                'documentation' => json_encode([]),
                'gallery' => json_encode([]),
                'status' => 'published',
            ],
        ];

        $targetSlugs = array_column($extracurriculars, 'slug');
        DB::table('extracurriculars')->whereNotIn('slug', $targetSlugs)->delete();

        foreach ($extracurriculars as $data) {
            DB::table('extracurriculars')->updateOrInsert(
                ['slug' => $data['slug']],
                array_merge($data, [
                    'created_at' => $now,
                    'updated_at' => $now,
                ])
            );
        }
    }

    public function down(): void
    {
        $targetSlugs = ['karate', 'marawis', 'paskib', 'pik-r', 'pmi', 'pramuka', 'robotik', 'rohis', 'silat', 'voli'];
        DB::table('extracurriculars')->whereIn('slug', $targetSlugs)->delete();
    }
};
