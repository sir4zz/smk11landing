-- ============================================================
-- Expand seed data for all admin panel menus
-- Adds comprehensive real data themed for SMKN 11 Kab. Tangerang
-- ============================================================

-- NEWS: Add 4 new articles (news-7 to news-10)
insert into public.news (title, slug, date, excerpt, content, thumbnail, category, author)
select * from (values
  ('Tim Futsal SMKN 11 Juara 1 Bupati Cup Kabupaten Tangerang 2025', 'juara-futsal-bupati-cup-2025', '2025-09-20'::date,
   'Tim futsal putra SMKN 11 Kabupaten Tangerang berhasil meraih juara 1 pada Turnamen Futsal Bupati Cup Kabupaten Tangerang 2025.',
   '<p>Tim futsal putra SMKN 11 Kabupaten Tangerang berhasil mengukir prestasi gemilang dengan meraih juara 1 pada Turnamen Futsal Bupati Cup Kabupaten Tangerang 2025. Turnamen yang berlangsung selama dua pekan ini diikuti oleh 24 tim SMK se-Kabupaten Tangerang.</p><p>Di partai final yang berlangsung ketat, tim futsal SMKN 11 berhasil mengalahkan tim asal SMKN 2 dengan skor akhir 3-2. Kapten tim, Reza Pratama, mencetak dua gol penentu kemenangan yang membawa tim meraih trofi juara.</p>',
   'https://images.unsplash.com/photo-1552664688-cf1ec3b78426?auto=format&fit=crop&w=900&q=80', 'Prestasi', 'Tim Humas'),
  ('Praktik Kerja Lapangan (PKL) Siswa Kelas XI Dimulai', 'pkl-kelas-xi-2026', '2026-07-01'::date,
   'Siswa kelas XI dari seluruh program keahlian memulai kegiatan Praktik Kerja Lapangan (PKL) di berbagai perusahaan mitra DUDI.',
   '<p>Praktik Kerja Lapangan (PKL) bagi siswa kelas XI SMKN 11 Kabupaten Tangerang tahun pelajaran 2025/2026 resmi dimulai pada 1 Juli 2026. Kegiatan ini melibatkan ratusan siswa dari enam program keahlian yang ditempatkan di berbagai perusahaan mitra dunia usaha dan dunia industri (DUDI).</p><p>Penempatan PKL disesuaikan dengan kompetensi masing-masing jurusan. Siswa TJKT ditempatkan di perusahaan teknologi dan ISP, siswa DKV di agensi kreatif dan production house, siswa Teknik Otomotif di bengkel resmi dan dealer, siswa TITL di kontraktor listrik dan industri manufaktur, siswa MPLB di bank dan kantor, serta siswa Busana di butik dan konveksi.</p>',
   'https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=900&q=80', 'Akademik', 'Hubin'),
  ('Sosialisasi Bahaya Perundungan (Bullying) dan Kenakalan Remaja', 'sosialisasi-anti-bullying-2026', '2026-04-10'::date,
   'Sekolah mengadakan sosialisasi pencegahan perundungan dan kenakalan remaja yang diikuti seluruh siswa dengan narasumber dari Kepolisian.',
   '<p>Dalam upaya menciptakan lingkungan sekolah yang aman dan nyaman, SMKN 11 Kabupaten Tangerang mengadakan sosialisasi pencegahan perundungan (bullying) dan kenakalan remaja pada 10 April 2026. Kegiatan ini menghadirkan narasumber dari Kepolisian Resor Kabupaten Tangerang dan diikuti oleh seluruh siswa.</p><p>Sosialisasi membahas berbagai topik penting, antara lain jenis-jenis perundungan, dampak psikologis bagi korban dan pelaku, serta cara mencegah dan melaporkan tindakan perundungan. Selain itu, narasumber juga menyampaikan materi tentang bahaya penyalahgunaan narkoba dan pentingnya hukum bagi remaja.</p>',
   'https://images.unsplash.com/photo-1521791136064-7986c5920bc6?auto=format&fit=crop&w=900&q=80', 'Kegiatan', 'Kesiswaan'),
  ('SMKN 11 Kabupaten Tangerang Raih Akreditasi A Unggul', 'akreditasi-a-unggul-2025', '2025-12-10'::date,
   'SMKN 11 Kabupaten Tangerang berhasil meraih predikat akreditasi A Unggul dari Badan Akreditasi Nasional Sekolah/Madrasah (BAN-S/M).',
   '<p>SMKN 11 Kabupaten Tangerang berhasil meraih prestasi membanggakan dengan memperoleh predikat akreditasi A Unggul dari Badan Akreditasi Nasional Sekolah/Madrasah (BAN-S/M) hasil asesmen tahun 2025. Predikat ini diberikan setelah melalui proses asesmen menyeluruh terhadap delapan standar nasional pendidikan.</p><p>Asesmen akreditasi menilai berbagai aspek, mulai dari kualitas pendidik dan tenaga kependidikan, sarana prasarana, pengelolaan, pembiayaan, hingga prestasi siswa baik akademik maupun non-akademik. Sekolah mendapatkan nilai yang sangat memuaskan pada hampir seluruh komponen penilaian.</p>',
   'https://images.unsplash.com/photo-1606857521015-7f7fc63a41f0?auto=format&fit=crop&w=900&q=80', 'Pengumuman', 'Admin')
) as seed(title, slug, date, excerpt, content, thumbnail, category, author)

-- ACHIEVEMENTS: Add 5 new achievements (ach-6 to ach-10)
insert into public.achievements (title, event, year, level, rank, students, photo)
select * from (values
  ('Juara 1 Lomba Cerdas Cermat Tingkat Kabupaten Tangerang', 'Lomba Cerdas Cermat SMK Se-Kabupaten Tangerang', 2024, 'Kabupaten', 'Juara 1',
   '["Tim SMKN 11 Kab. Tangerang"]'::jsonb, 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&w=900&q=80'),
  ('Juara 1 Turnamen Futsal Bupati Cup Kabupaten Tangerang', 'Turnamen Futsal Bupati Cup Kabupaten Tangerang', 2025, 'Kabupaten', 'Juara 1',
   '["Tim Futsal SMKN 11"]'::jsonb, 'https://images.unsplash.com/photo-1552664688-cf1ec3b78426?auto=format&fit=crop&w=900&q=80'),
  ('Juara 2 Lomba Baris-Berbaris PBB Tingkat Kabupaten', 'Lomba Baris-Berbaris PBB SMK Se-Kabupaten Tangerang', 2025, 'Kabupaten', 'Juara 2',
   '["Tim PBB Satria 11"]'::jsonb, 'https://images.unsplash.com/photo-1526976668913-0b7520b8c12d?auto=format&fit=crop&w=900&q=80'),
  ('Juara Harapan 1 Lomba Desain Poster Tingkat Provinsi Banten', 'Festival Seni dan Desain Pelajar Provinsi Banten', 2024, 'Provinsi', 'Harapan',
   '["Nabila Putri", "Salsabila"]'::jsonb, 'https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=900&q=80'),
  ('Juara 3 Lomba Videografi Pendek Tingkat Kabupaten', 'Festival Film Pendek Pelajar Kabupaten Tangerang', 2025, 'Kabupaten', 'Juara 3',
   '["Reza Pratama", "Ayunda Kirana", "Fadli Rahman"]'::jsonb, 'https://images.unsplash.com/photo-1492619375914-88005aa9e8fb?auto=format&fit=crop&w=900&q=80')
) as seed(title, event, year, level, rank, students, photo)
where not exists (select 1 from public.achievements where title = seed.title);

-- FACILITIES: Add 2 new facilities (fac-9, fac-10)
insert into public.facilities (name, description, category, photo)
select * from (values
  ('Laboratorium Listrik & Otomasi', 'Laboratorium khusus jurusan TITL yang dilengkapi panel instalasi listrik, trainer motor listrik, modul PLC, dan peralatan K3 standar industri untuk praktik otomasi.', 'Akademik', '/images/facilities/lab-listrik.jpg'),
  ('Ruang Praktik Busana & Atelier', 'Ruang praktik menjahit jurusan Busana yang dilengkapi mesin jahit industri, mesin obras, mesin neci, manekin, dan peralatan pembuatan pola untuk produksi fashion.', 'Akademik', '/images/facilities/praktik-busana.jpg')
) as seed(name, description, category, photo)
where not exists (select 1 from public.facilities where name = seed.name);

-- STAFF: Update descriptions for department heads
update public.staff set description = 'Memimpin pengembangan kurikulum dan praktik industri jurusan TJKT agar lulusan siap kerja di bidang jaringan dan telekomunikasi.' where position = 'Kepala Program Keahlian TJKT' and (description = '' or description is null);
update public.staff set description = 'Mengarahkan pembelajaran kreatif jurusan DKV dengan fokus pada desain grafis, multimedia, dan produksi konten digital.' where position = 'Kepala Program Keahlian DKV' and (description = '' or description is null);
update public.staff set description = 'Mengelola praktik otomotif standar industri dan menjalin kemitraan dengan bengkel resmi untuk peningkatan kompetensi siswa.' where position = 'Kepala Program Keahlian Teknik Otomotif' and (description = '' or description is null);
update public.staff set description = 'Mengembangkan kompetensi instalasi listrik dan otomasi industri siswa TITL dengan dukungan peralatan praktik terkini.' where position = 'Kepala Program Keahlian TITL' and (description = '' or description is null);
update public.staff set description = 'Membina kompetensi administrasi perkantoran dan layanan bisnis siswa MPLB melalui praktik bank mini dan magang industri.' where position = 'Kepala Program Keahlian MPLB' and (description = '' or description is null);
update public.staff set description = 'Membimbing siswa jurusan Busana dalam mengembangkan keterampilan desain, menjahit, dan kewirausahaan bidang fashion.' where position = 'Kepala Program Keahlian Busana' and (description = '' or description is null);

-- TEACHER ACTIVITIES: Add 3 new activities (ta-6 to ta-8)
insert into public.teacher_activities (title, date, category, description, photo)
select * from (values
  ('Pelatihan Pemanfaatan Teknologi AI dalam Pembelajaran', '2026-04-20'::date, 'Workshop',
   'Guru mengikuti pelatihan pemanfaatan teknologi kecerdasan buatan (AI) untuk mendukung penyusunan bahan ajar dan asesmen yang inovatif.',
   'https://images.unsplash.com/photo-1535223289827-42f1e9919769?auto=format&fit=crop&w=900&q=80'),
  ('Studi Tirah ke SMK Unggulan di Jakarta', '2026-05-12'::date, 'Studi Tirah',
   'Sejumlah guru produktif melaksanakan studi tirah ke SMK unggulan di Jakarta untuk benchmarking kurikulum dan praktik industri.',
   'https://images.unsplash.com/photo-1571260899304-425eee4c7efc?auto=format&fit=crop&w=900&q=80'),
  ('Rapat Koordinasi dengan Dunia Usaha dan Industri (DUDI)', '2026-06-03'::date, 'Rapat',

-- ============================================================
-- OSIS: Add 6 new members (m7-m12) and 2 new activities (a4, a5)
-- ============================================================
insert into public.osis_members (osis_id, name, position, division, photo, sort_order)
select '00000000-0000-4000-8000-000000000001', * from (values
  ('Dewi Anggraini', 'Wakil Sekretaris', 'Sekretaris', '', 4),
  ('Bayu Setiawan', 'Bendahara', 'Bendahara', '', 5),
  ('Nabila Putri', 'Wakil Bendahara', 'Bendahara', '', 6),
  ('Ahmad Fauzi', 'Ketua Bidang', 'Pembinaan Karakter', '', 7),
  ('Rani Marlina', 'Ketua Bidang', 'Seni & Kreativitas', '', 8),
  ('Reza Pratama', 'Ketua Bidang', 'Olahraga', '', 9),
  ('Salsabila', 'Ketua Bidang', 'Keagamaan', '', 10),
  ('Ilham Maulana', 'Ketua Bidang', 'Wawasan & Teknologi', '', 11),
  ('Ayunda Kirana', 'Ketua Bidang', 'Humas & Publikasi', '', 12)
) as seed(name, position, division, photo, sort_order)
where not exists (select 1 from public.osis_members where osis_id = '00000000-0000-4000-8000-000000000001' and name = seed.name and division = seed.division);

insert into public.osis_activities (title, description, photo, activity_date, status)
select * from (values
  ('Festival Seni & Budaya SMKN 11', 'Pentas seni tahunan yang menampilkan berbagai penampilan siswa mulai dari tari, musik, teater, hingga pameran karya siswa jurusan DKV dan Busana.', 'https://images.unsplash.com/photo-1516280464613-81e30c6f1f0b?auto=format&fit=crop&w=900&q=80', '2026-05-25'::date, 'published'),
  ('Donor Darah & Sosialisasi Kesehatan', 'Kegiatan donor darah bekerja sama dengan PMI Cabang Tangerang serta sosialisasi pola hidup sehat bagi seluruh siswa dan guru.', 'https://images.unsplash.com/photo-1615462136150-49bae8b18b30?auto=format&fit=crop&w=900&q=80', '2026-02-20'::date, 'published')
) as seed(title, description, photo, activity_date, status)
where not exists (select 1 from public.osis_activities where title = seed.title);

-- ============================================================
-- KESEMAPTAAN: Add activities, instructors, achievements
-- ============================================================
insert into public.kesemaptaan_activities (title, description, activity_date, documentation, status)
select * from (values
  ('Latihan Khusus Tim PBB Satria 11', 'Latihan intensif bagi tim PBB Satria 11 dalam persiapan mengikuti lomba baris-berbaris tingkat kabupaten dan provinsi.', '2026-05-15'::date, '[]'::jsonb, 'published'),
  ('Upacara Apel Besar & Pelantikan Anggota Baru', 'Apel besar sekolah sekaligus pelantikan anggota baru tim Kesemaptaan SMKN 11 Kabupaten Tangerang periode 2025/2026.', '2026-08-30'::date, '[]'::jsonb, 'published')
) as seed(title, description, activity_date, documentation, status)
where not exists (select 1 from public.kesemaptaan_activities where title = seed.title);

insert into public.kesemaptaan_instructors (name, role, photo, sort_order)
select * from (values
  ('Kopda Sutrisno', 'Instruktur Fisik & Mental', '', 3)
) as seed(name, role, photo, sort_order)
where not exists (select 1 from public.kesemaptaan_instructors where name = seed.name);

insert into public.kesemaptaan_achievements (name, year, description, documentation)

-- ============================================================
-- MADING POSTS: Add 4 new published posts (mp3 to mp6)
-- Temporarily disable the guard trigger since migration runs
-- outside an auth context.
-- ============================================================
alter table public.mading_posts disable trigger guard_mading_post_insert;

insert into public.mading_posts (title, content, category_id, author_name, author_role, cover_image, status, feedback, published_at, created_at)
select seed.title, seed.content, c.id, seed.author_name, seed.author_role, '', 'published', '', seed.published_at, seed.created_at
from (values
  ('Tips Sukses Praktik Kerja Lapangan (PKL)', 'PKL adalah kesempatan emas untuk mengenal dunia kerja. Berikut beberapa tips: datang tepat waktu, berpakaian rapi dan sopan, aktif bertanya kepada pembimbing industri, jujur dalam bekerja, dan dokumentasikan kegiatan harian sebagai laporan. Jangan lupa untuk membangun relasi yang baik dengan rekan kerja.', 'edukasi', 'Siswa Kelas XII', 'siswa', '2026-07-05T00:00:00.000Z'::timestamptz, '2026-07-03T14:00:00.000Z'::timestamptz),
  ('Pantun: Semangat Belajar', 'Pergi ke pasar membeli mangga
Jangan lupa beli rambutan juga
Rajin belajar setiap pagi
Sukses pasti akan kau dapatkan nanti', 'pantun', 'Siswa Kelas XI', 'siswa', '2026-06-25T00:00:00.000Z'::timestamptz, '2026-06-22T11:00:00.000Z'::timestamptz),
  ('Esai: Pentingnya Literasi Digital bagi Siswa SMK', 'Di era industri 4.0, literasi digital bukan lagi pilihan melainkan keharusan. Siswa SMK dituntut tidak hanya mampu menggunakan teknologi, tetapi juga memahami etika digital, keamanan siber, dan kemampuan menyaring informasi. Literasi digital yang baik akan mempersiapkan kita menghadapi dunia kerja yang semakin berbasis teknologi.', 'esai', 'Redaksi Mading', 'siswa', '2026-07-08T00:00:00.000Z'::timestamptz, '2026-07-05T08:00:00.000Z'::timestamptz),
  ('Cerpen: Sepatu Baru Pak Surya', 'Pak Surya adalah seorang guru produktif yang selalu datang lebih awal. Suatu pagi, ia datang memakai sepatu baru yang mengkilap. Para siswa heran, bukan karena sepatunya, melainkan karena Pak Surya tersenyum lebar sepanjang hari. "Sepatu baru, semangat baru," katanya. Ternyata, sepatu itu hadiah dari alumni yang kini sukses menjadi teknisi. Sebuah pengingat bahwa dedikasi guru tak pernah terlupakan.', 'cerpen', 'Siswa Kelas X', 'siswa', '2026-06-30T00:00:00.000Z'::timestamptz, '2026-06-28T13:00:00.000Z'::timestamptz)
) as seed(title, content, category_slug, author_name, author_role, published_at, created_at)
join public.mading_categories c on c.slug = seed.category_slug
where not exists (select 1 from public.mading_posts where title = seed.title);

alter table public.mading_posts enable trigger guard_mading_post_insert;

select * from (values
  ('Juara III Lomba PBB Se-Kabupaten Tangerang', '2024', 'Tim PBB Satria 11 meraih juara ketiga dalam lomba baris-berbaris antar SMK se-Kabupaten Tangerang tahun 2024.', '[]'::jsonb),
  ('Best Performance Pasukan Pengibar Bendera', '2025', 'Paskibra Satria 11 mendapatkan penghargaan Best Performance pada kegiatan upacara peringatan Hari Kemerdekaan tingkat kabupaten.', '[]'::jsonb)
) as seed(name, year, description, documentation)
where not exists (select 1 from public.kesemaptaan_achievements where name = seed.name);

   'Rapat koordinasi bersama perusahaan mitra untuk membahas program Praktik Kerja Lapangan (PKL) dan penyerapan lulusan tahun ajaran 2026/2027.',
   'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=900&q=80')
) as seed(title, date, category, description, photo)
where not exists (select 1 from public.teacher_activities where title = seed.title);

where not exists (select 1 from public.news where slug = seed.slug);
