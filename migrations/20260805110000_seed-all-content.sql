-- ============================================================
-- COMPREHENSIVE SEED: All admin panel content data
-- For SMKN 11 Kabupaten Tangerang
-- ============================================================

-- NEWS (10 articles)
insert into public.news (title, slug, date, excerpt, content, thumbnail, category, author)
select * from (values
  ('Siswa SMKN 11 Kabupaten Tangerang Raih Medali Ajang Prestasi 2025', 'ajang-prestasi-2025', '2025-10-15'::date, 'Febriyani, siswa SMKN 11 Kabupaten Tangerang, berhasil meraih medali perak pada Ajang Prestasi SMK Tingkat Kabupaten Tangerang tahun 2025.', '<p>Prestasi membanggakan kembali diraih oleh siswa SMKN 11 Kabupaten Tangerang. Febriyani berhasil meraih medali perak pada Ajang Prestasi SMK Tingkat Kabupaten Tangerang tahun 2025 yang diselenggarakan di Sub Rayon 03.</p><p>Keberhasilan ini merupakan buah dari persiapan matang dan bimbingan intensif dari para guru pembimbing.</p>', 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=900&q=80', 'Prestasi', 'Tim Humas'),
  ('Penerimaan Peserta Didik Baru (PPDB) Tahun Ajaran 2026/2027 Segera Dibuka', 'info-ppdb-2026', '2026-06-15'::date, 'Informasi lengkap terkait jadwal, persyaratan, dan alur pendaftaran PPDB SMKN 11 Kabupaten Tangerang tahun ajaran 2026/2027.', '<p>Penerimaan Peserta Didik Baru (PPDB) SMKN 11 Kabupaten Tangerang tahun ajaran 2026/2027 akan segera dibuka secara online melalui portal resmi PPDB Provinsi Banten. Pendaftaran tahap pertama direncanakan mulai tanggal 20 hingga 25 Juni 2026.</p>', 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=900&q=80', 'Informasi', 'Panitia PPDB'),
  ('Kunjungan Industri Jurusan Teknik Otomotif ke Pabrik Perakitan Mobil', 'kunjungan-industri-otomotif', '2026-05-10'::date, 'Siswa kelas XI Teknik Otomotif mengikuti kegiatan Kunjungan Industri (KI) ke salah satu pabrik perakitan mobil ternama di Cikarang.', '<p>Dalam rangka menyelaraskan kurikulum dengan dunia industri, sebanyak 65 siswa kelas XI jurusan Teknik Otomotif beserta guru pendamping melaksanakan Kunjungan Industri (KI) ke sebuah pabrik perakitan mobil skala internasional di kawasan industri Cikarang.</p>', 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=900&q=80', 'Akademik', 'Tim Humas'),
  ('Pelatihan Sertifikasi Kompetensi Guru Produktif', 'pelatihan-sertifikasi-guru', '2026-04-28'::date, 'Guru produktif mengikuti pelatihan sertifikasi kompetensi untuk meningkatkan kualitas pembelajaran vokasi.', '<p>Guru-guru produktif SMKN 11 Kabupaten Tangerang mengikuti pelatihan sertifikasi kompetensi yang diselenggarakan oleh Pusat Pengembangan Sumber Daya Manusia (PPSDM).</p>', 'https://images.unsplash.com/photo-1524178232363-1fb2a075b655?auto=format&fit=crop&w=900&q=80', 'Akademik', 'Kurikulum'),
  ('Pengadaan Laboratorium DKV Baru dengan 35 Unit Komputer Spesifikasi Tinggi', 'lab-dkv-baru', '2026-04-22'::date, 'SMKN 11 Kabupaten Tangerang mengresmikan laboratorium Desain Komunikasi Visual (DKV) yang baru.', '<p>SMKN 11 Kabupaten Tangerang meresmikan laboratorium Desain Komunikasi Visual (DKV) yang baru pada Kamis, 22 April 2026. Lab baru ini dilengkapi dengan 35 unit komputer spesifikasi tinggi.</p>', '/images/news-4.jpg', 'Fasilitas', 'Tim Humas'),
  ('Pelaksanaan Uji Kompetensi Keahlian (UKK) Tahun 2026 Berjalan Lancar', 'pelaksanaan-ukk-2026', '2026-03-05'::date, 'Seluruh siswa kelas XII dari enam program keahlian sukses mengikuti Uji Kompetensi Keahlian (UKK) sebagai syarat kelulusan.', '<p>Uji Kompetensi Keahlian (UKK) bagi siswa kelas XII SMKN 11 Kabupaten Tangerang tahun pelajaran 2025/2026 telah selesai diselenggarakan dengan sukses dan lancar.</p>', '/images/news-5.jpg', 'Akademik', 'Kurikulum'),
  ('Peringatan Hari Guru Nasional di SMKN 11 Kab. Tangerang', 'hari-guru-nasional', '2025-11-25'::date, 'Rangkaian acara meriah peringatan Hari Guru Nasional dirayakan oleh seluruh guru dan siswa dengan penuh rasa kekeluargaan.', '<p>Peringatan Hari Guru Nasional (HGN) tahun ini di SMKN 11 Kabupaten Tangerang berlangsung sangat meriah dan penuh makna.</p>', '/images/news-6.jpg', 'Kegiatan', 'OSIS'),
  ('Tim Futsal SMKN 11 Juara 1 Bupati Cup Kabupaten Tangerang 2025', 'juara-futsal-bupati-cup-2025', '2025-09-20'::date, 'Tim futsal putra SMKN 11 Kabupaten Tangerang berhasil meraih juara 1 pada Turnamen Futsal Bupati Cup.', '<p>Tim futsal putra SMKN 11 Kabupaten Tangerang berhasil mengukir prestasi gemilang dengan meraih juara 1 pada Turnamen Futsal Bupati Cup Kabupaten Tangerang 2025.</p>', 'https://images.unsplash.com/photo-1552664688-cf1ec3b78426?auto=format&fit=crop&w=900&q=80', 'Prestasi', 'Tim Humas'),
  ('Praktik Kerja Lapangan (PKL) Siswa Kelas XI Dimulai', 'pkl-kelas-xi-2026', '2026-07-01'::date, 'Siswa kelas XI dari seluruh program keahlian memulai kegiatan Praktik Kerja Lapangan (PKL).', '<p>Praktik Kerja Lapangan (PKL) bagi siswa kelas XI SMKN 11 Kabupaten Tangerang tahun pelajaran 2025/2026 resmi dimulai pada 1 Juli 2026.</p>', 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=900&q=80', 'Akademik', 'Hubin'),
  ('Sosialisasi Bahaya Perundungan (Bullying) dan Kenakalan Remaja', 'sosialisasi-anti-bullying-2026', '2026-04-10'::date, 'Sekolah mengadakan sosialisasi pencegahan perundungan dan kenakalan remaja.', '<p>Dalam upaya menciptakan lingkungan sekolah yang aman dan nyaman, SMKN 11 Kabupaten Tangerang mengadakan sosialisasi pencegahan perundungan (bullying) dan kenakalan remaja pada 10 April 2026.</p>', 'https://images.unsplash.com/photo-1521791136064-7986c5920bc6?auto=format&fit=crop&w=900&q=80', 'Kegiatan', 'Kesiswaan')
) as seed(title, slug, date, excerpt, content, thumbnail, category, author)

-- PROGRAMS (6 programs)
insert into public.programs (name, slug, short_name, icon, image, description, short_description, competencies, career_prospects, facilities)
select * from (values
  ('Teknik Jaringan Komputer dan Telekomunikasi', 'tkj', 'TJKT', 'Network', 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=900&q=80', 'Program keahlian TJKT membekali siswa dengan keterampilan dalam perakitan komputer, instalasi jaringan, administrasi server, serta teknologi telekomunikasi.', 'Mempelajari perakitan komputer, instalasi jaringan, administrasi server, dan teknologi telekomunikasi.',
   '["Perakitan dan Perbaikan Komputer","Instalasi Jaringan (LAN/WAN)","Administrasi Server (Windows/Linux)","Keamanan Jaringan dan Cyber Security","Teknologi Telekomunikasi dan Fiber Optik","Troubleshooting Perangkat Keras dan Jaringan"]'::jsonb,
   '["Network Administrator","System Administrator","Teknisi Jaringan Telekomunikasi","IT Support/Technician","Teknisi Fiber Optik","Wirausaha di bidang IT"]'::jsonb,
   '["Laboratorium Komputer","Peralatan Jaringan (Router, Switch, MikroTik)","Server Khusus Praktik","Koneksi Internet Fiber Optik","Toolkit Perbaikan Komputer"]'::jsonb),
  ('Desain Komunikasi Visual', 'dkv', 'DKV', 'Code', 'https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=900&q=80', 'DKV fokus pada pengembangan kreativitas di bidang desain grafis, multimedia, videografi, fotografi, dan animasi.', 'Mempelajari desain grafis, multimedia, videografi, fotografi, dan animasi digital.',
   '["Desain Grafis (CorelDRAW, Adobe Illustrator, Photoshop)","Videografi dan Editing Video (Premiere, After Effects)","Fotografi Digital","Animasi 2D dan 3D","Pengembangan Web & UI/UX Design","Produksi Konten Digital Kreatif"]'::jsonb,
   '["Desainer Grafis","Videografer / Editor Video","Fotografer","Animator","Social Media Specialist","UI/UX Designer"]'::jsonb,
   '["Laboratorium Multimedia","Kamera DSLR/Mirrorless","Studio Fotografi","Green Screen Studio","Komputer Spesifikasi Tinggi untuk Desain"]'::jsonb),
  ('Teknik Otomotif', 'otomotif', 'TO', 'Car', 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=900&q=80', 'Teknik Otomotif mendidik siswa untuk memiliki keahlian dalam perawatan dan perbaikan kendaraan roda empat dan roda dua.', 'Fokus pada perawatan dan perbaikan kendaraan bermotor roda dua dan roda empat.',
   '["Pemeliharaan Mesin Kendaraan Ringan","Perbaikan Sistem Kelistrikan Kendaraan","Perawatan Sistem Sasis dan Pemindah Tenaga","Overhaul Mesin","Teknologi Injeksi (EFI & PGM-FI)","Spooring dan Balancing"]'::jsonb,
   '["Mekanik Profesional","Service Advisor","Teknisi Bengkel Resmi (Dealer)","Wirausaha Bengkel","Operator Industri Otomotif","Kepala Mekanik"]'::jsonb,
   '["Bengkel Otomotif Standar Industri","Engine Stand","Car Lift","Alat Uji Emisi","Scanner EFI","Unit Sepeda Motor Berbagai Tipe"]'::jsonb),
  ('Teknik Ketenagalistrikan', 'titl', 'TITL', 'Zap', 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?auto=format&fit=crop&w=900&q=80', 'TITL membekali siswa dengan kompetensi di bidang instalasi listrik, sistem tenaga listrik, motor listrik, dan kendali otomasi industri.', 'Mempelajari instalasi listrik, sistem tenaga, motor listrik, dan otomasi industri.',
   '["Instalasi Listrik Penerangan dan Tenaga","Sistem Distribusi Tenaga Listrik","Motor Listrik dan Kontrol","PLC (Programmable Logic Controller)","Elektronika Daya","Instalasi Panel Listrik"]'::jsonb,
   '["Teknisi Listrik","Instalatir Listrik","Teknisi Pemeliharaan Gedung","Operator Pembangkit Listrik","Wirausaha Jasa Instalasi Listrik","Staf Teknik di Perusahaan Manufaktur"]'::jsonb,
   '["Laboratorium Instalasi Listrik","Panel Listrik Praktik","Motor Listrik Berbagai Jenis","Trainer PLC","Peralatan Keselamatan Kerja (K3)"]'::jsonb),
  ('Manajemen Perkantoran dan Layanan Bisnis', 'mplb', 'MPLB', 'Calculator', 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=900&q=80', 'MPLB membekali siswa dengan kompetensi dalam mengelola administrasi perkantoran, komunikasi bisnis, pengelolaan keuangan, dan pengoperasian aplikasi perkantoran.', 'Mempelajari administrasi perkantoran, manajemen bisnis, dan layanan profesional.',
   '["Administrasi dan Manajemen Perkantoran","Komunikasi Bisnis","Kearsipan Digital","Komputer Akuntansi","Public Relation dan Layanan Pelanggan","Kewirausahaan"]'::jsonb,
   '["Staf Administrasi Perkantoran","Customer Service Representative","Administrasi Keuangan","Resepsionis","Administrasi Personalia (HR)","Wirausaha Jasa Perkantoran"]'::jsonb,
   '["Laboratorium Administrasi Perkantoran","Bank Mini","Perangkat Multimedia","Software Administrasi Perkantoran"]'::jsonb),
  ('Busana', 'busana', 'Busana', 'Scissors', 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=900&q=80', 'Program keahlian Busana membekali siswa dengan keterampilan di bidang desain busana, pembuatan pola, menjahit, dan produksi busana.', 'Mempelajari desain busana, pembuatan pola, menjahit, dan produksi fashion.',
   '["Desain Busana (Fashion Design)","Pembuatan Pola (Pattern Making)","Menjahit (Busana Pria/Wanita/Anak)","Teknik Hiasan Busana (Embroidery, Beading)","Manajemen Produksi Busana","Kewirausahaan Bidang Fashion"]'::jsonb,
   '["Desainer Busana","Penjahit Profesional","Pattern Maker","Pemilik Butik / Konveksi","Quality Control Produk Garmen","Konsultan Fashion"]'::jsonb,
   '["Ruang Praktik Menjahit","Mesin Jahit Industri","Mesin Obras dan Neci","Manekin (Dress Form)","Laboratorium Desain Busana","Peralatan Pembuatan Pola"]'::jsonb)
) as seed(name, slug, short_name, icon, image, description, short_description, competencies, career_prospects, facilities)

-- FACILITIES (10 facilities)
insert into public.facilities (name, description, category, photo)
select * from (values
  ('Laboratorium Komputer', 'Terdapat 4 ruang laboratorium komputer yang dilengkapi dengan PC spesifikasi tinggi, AC, dan koneksi internet fiber optik.', 'Akademik', '/images/facilities/lab-komputer.jpg'),
  ('Bengkel Otomotif', 'Fasilitas bengkel luas standar industri yang dilengkapi dengan peralatan servis lengkap, engine stand, car lift, dan scanner EFI.', 'Akademik', '/images/facilities/bengkel.jpg'),
  ('Perpustakaan Digital', 'Ruang baca yang nyaman, koleksi buku cetak, serta fasilitas akses e-book dan jurnal online.', 'Akademik', '/images/facilities/perpustakaan.jpg'),
  ('Lapangan Olahraga Utama', 'Lapangan serbaguna untuk futsal, basket, voli, dan lapangan upacara bendera.', 'Fasilitas Umum', '/images/facilities/lapangan.jpg'),
  ('Masjid Ulil Albab', 'Masjid sekolah yang luas untuk ibadah warga sekolah, kegiatan keputrian, dan pembinaan rohani Islam.', 'Keagamaan', '/images/facilities/masjid.jpg'),
  ('Aula Serbaguna', 'Gedung aula berkapasitas 500 orang untuk pertemuan, seminar, pentas seni, dan perpisahan sekolah.', 'Fasilitas Umum', '/images/facilities/aula.jpg'),
  ('Laboratorium Akuntansi (Bank Mini)', 'Ruang praktik jurusan MPLB dengan layanan teller bank mini dan peralatan administrasi perkantoran.', 'Akademik', '/images/facilities/lab-akuntansi.jpg'),
  ('Ruang Multimedia & Podcast', 'Ruangan kedap suara dengan perangkat rekaman audio visual untuk produksi konten edukasi.', 'Pendukung', '/images/facilities/multimedia.jpg'),
  ('Laboratorium Listrik & Otomasi', 'Lab jurusan TITL dengan panel instalasi listrik, trainer motor listrik, modul PLC, dan peralatan K3.', 'Akademik', '/images/facilities/lab-listrik.jpg'),
  ('Ruang Praktik Busana & Atelier', 'Ruang praktik menjahit jurusan Busana dengan mesin jahit industri, mesin obras, mesin neci, dan manekin.', 'Akademik', '/images/facilities/praktik-busana.jpg')
) as seed(name, description, category, photo)
where not exists (select 1 from public.facilities where name = seed.name);

-- STAFF (11 staff with descriptions)
insert into public.staff (name, position, department, photo, description)
select * from (values
  ('Drs. H. Ahmad Fauzi, M.Pd.', 'Kepala Sekolah', 'Manajemen', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80', 'Memimpin SMKN 11 Kabupaten Tangerang dengan visi sekolah vokasi yang unggul, berkarakter, dan siap kerja.'),
  ('Sri Mulyani, S.Pd., M.Si.', 'Wakil Kepala Sekolah Bid. Kurikulum', 'Kurikulum', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80', 'Mengoordinasikan pelaksanaan kurikulum, kegiatan belajar mengajar, serta asesmen agar mutu pembelajaran terus meningkat.'),
  ('Budi Santoso, S.Kom.', 'Wakil Kepala Sekolah Bid. Kesiswaan', 'Kesiswaan', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80', 'Membina pengembangan karakter, kedisiplinan, dan kegiatan kesiswaan agar murid tumbuh menjadi pribadi yang berakhlak mulia.'),
  ('Haryanto, S.T.', 'Wakil Kepala Sekolah Bid. Sarana Prasarana', 'Sarana Prasarana', 'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?auto=format&fit=crop&w=800&q=80', 'Mengelola sarana dan prasarana sekolah agar mendukung proses pembelajaran yang aman, nyaman, dan optimal.'),
  ('Dra. Rini Wulandari', 'Wakil Kepala Sekolah Bid. Humas & Hubin', 'Humas', 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=800&q=80', 'Menjalin kemitraan dengan dunia usaha dan industri serta membangun citra sekolah melalui hubungan masyarakat yang baik.'),
  ('Eko Prasetyo, S.Kom.', 'Kepala Program Keahlian TJKT', 'Teknik Jaringan Komputer dan Telekomunikasi', 'https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=800&q=80', 'Memimpin pengembangan kurikulum dan praktik industri jurusan TJKT agar lulusan siap kerja.'),
  ('Anita Rahmawati, S.Kom., M.Kom.', 'Kepala Program Keahlian DKV', 'Desain Komunikasi Visual', 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=800&q=80', 'Mengarahkan pembelajaran kreatif jurusan DKV dengan fokus pada desain grafis, multimedia, dan produksi konten digital.'),
  ('Asep Saepudin, S.Pd.T.', 'Kepala Program Keahlian Teknik Otomotif', 'Teknik Otomotif', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80', 'Mengelola praktik otomotif standar industri dan menjalin kemitraan dengan bengkel resmi.'),
  ('Deni Setiawan, S.T.', 'Kepala Program Keahlian TITL', 'Teknik Ketenagalistrikan', 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=800&q=80', 'Mengembangkan kompetensi instalasi listrik dan otomasi industri siswa TITL.'),
  ('Siti Aminah, S.E.', 'Kepala Program Keahlian MPLB', 'Manajemen Perkantoran dan Layanan Bisnis', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80', 'Membina kompetensi administrasi perkantoran dan layanan bisnis siswa MPLB melalui praktik bank mini.'),
  ('Nurhayati, S.Pd.', 'Kepala Program Keahlian Busana', 'Busana', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=800&q=80', 'Membimbing siswa jurusan Busana dalam mengembangkan keterampilan desain, menjahit, dan kewirausahaan fashion.')

-- ACHIEVEMENTS (10 achievements)
insert into public.achievements (title, event, year, level, rank, students, photo)
select * from (values
  ('Medali Perak Ajang Prestasi SMK Kabupaten Tangerang', 'Ajang Prestasi SMK Kabupaten Tangerang', 2025, 'Kabupaten', 'Medali Perak', '["Febriyani"]'::jsonb, 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=900&q=80'),
  ('Juara 2 LKS Bidang IT Network Systems Tingkat Kabupaten', 'LKS Kabupaten Tangerang', 2024, 'Kabupaten', 'Juara 2', '["Melati Febriyani","Rangga Saputra"]'::jsonb, 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=900&q=80'),
  ('Juara 3 LKS Bidang Web Technologies Tingkat Provinsi Banten', 'LKS Provinsi Banten', 2025, 'Provinsi', 'Juara 3', '["Bayu Pratama","Dinda Aulia"]'::jsonb, 'https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?auto=format&fit=crop&w=900&q=80'),
  ('Partisipasi LKS Bidang IT Network Cabling Tingkat Kabupaten', 'LKS Kabupaten Tangerang', 2025, 'Kabupaten', 'Peserta', '["Febriyani","Ilham Maulana"]'::jsonb, 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=900&q=80'),
  ('Juara 1 Lomba Cerdas Cermat Tingkat Kabupaten Tangerang', 'Lomba Cerdas Cermat SMK Se-Kabupaten Tangerang', 2024, 'Kabupaten', 'Juara 1', '["Tim SMKN 11 Kab. Tangerang"]'::jsonb, 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&w=900&q=80'),
  ('Juara 1 Turnamen Futsal Bupati Cup Kabupaten Tangerang', 'Turnamen Futsal Bupati Cup', 2025, 'Kabupaten', 'Juara 1', '["Tim Futsal SMKN 11"]'::jsonb, 'https://images.unsplash.com/photo-1552664688-cf1ec3b78426?auto=format&fit=crop&w=900&q=80'),
  ('Juara 2 Lomba Baris-Berbaris PBB Tingkat Kabupaten', 'Lomba PBB SMK Se-Kabupaten Tangerang', 2025, 'Kabupaten', 'Juara 2', '["Tim PBB Satria 11"]'::jsonb, 'https://images.unsplash.com/photo-1526976668913-0b7520b8c12d?auto=format&fit=crop&w=900&q=80'),
  ('Juara Harapan 1 Lomba Desain Poster Tingkat Provinsi Banten', 'Festival Seni dan Desain Pelajar Provinsi Banten', 2024, 'Provinsi', 'Harapan', '["Nabila Putri","Salsabila"]'::jsonb, 'https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=900&q=80'),
  ('Juara 3 Lomba Videografi Pendek Tingkat Kabupaten', 'Festival Film Pendek Pelajar Kabupaten Tangerang', 2025, 'Kabupaten', 'Juara 3', '["Reza Pratama","Ayunda Kirana","Fadli Rahman"]'::jsonb, 'https://images.unsplash.com/photo-1492619375914-88005aa9e8fb?auto=format&fit=crop&w=900&q=80'),
  ('Partisipasi Olimpiade Matematika Tingkat Provinsi Banten', 'OSN Provinsi Banten', 2025, 'Provinsi', 'Partisipasi', '["Ahmad Zaki","Lestari Dewi"]'::jsonb, 'https://images.unsplash.com/photo-1456513080510-7bf31984b480?auto=format&fit=crop&w=900&q=80')
) as seed(title, event, year, level, rank, students, photo)

-- KESEMAPTAAN PROFILE
insert into public.kesemaptaan (title, description, photo)
select 'Kesemaptaan SMKN 11 Kabupaten Tangerang', 'Kesemaptaan adalah program pembinaan kedisiplinan, fisik, dan ketahanan mental serta keterampilan baris-berbaris (PBB) bagi siswa. Kegiatan ini membentuk karakter disiplin, tangguh, dan bertanggung jawab.', ''
where not exists (select 1 from public.kesemaptaan limit 1);

-- KESEMAPTAAN ACTIVITIES (4)
insert into public.kesemaptaan_activities (title, description, activity_date, documentation, status)
select * from (values
  ('Latihan Dasar Kedisiplinan (LDK)', 'Pelatihan dasar kedisiplinan dan pembinaan fisik untuk membentuk karakter siswa yang tertib dan bertanggung jawab.', '2026-02-10'::date, '[]'::jsonb, 'published'),
  ('Pembinaan Fisik & Keterampilan Baris-Berbaris', 'Latihan fisik dan keterampilan PBB yang rutin dilaksanakan untuk menjaga kebugaran dan membangun kekompakan.', '2026-03-20'::date, '[]'::jsonb, 'published'),
  ('Latihan Khusus Tim PBB Satria 11', 'Latihan intensif bagi tim PBB Satria 11 dalam persiapan lomba baris-berbaris tingkat kabupaten dan provinsi.', '2026-05-15'::date, '[]'::jsonb, 'published'),
  ('Upacara Apel Besar & Pelantikan Anggota Baru', 'Apel besar sekolah sekaligus pelantikan anggota baru tim Kesemaptaan periode 2025/2026.', '2026-08-30'::date, '[]'::jsonb, 'published')
) as seed(title, description, activity_date, documentation, status)
where not exists (select 1 from public.kesemaptaan_activities where title = seed.title);

-- KESEMAPTAAN SCHEDULES (3)
insert into public.kesemaptaan_schedules (day, time, place)
select * from (values
  ('Senin', '15.30 - 17.00', 'Lapangan Sekolah'),
  ('Rabu', '15.30 - 17.00', 'Lapangan Sekolah'),
  ('Sabtu', '08.00 - 10.00', 'Lapangan Sekolah')
) as seed(day, time, place)
where not exists (select 1 from public.kesemaptaan_schedules where day = seed.day and time = seed.time);

-- KESEMAPTAAN INSTRUCTORS (3)
insert into public.kesemaptaan_instructors (name, role, photo, sort_order)
select * from (values
  ('Serka Ahmad Yani', 'Pembina Utama', '', 1),
  ('Pelda Rina Kusuma', 'Instruktur PBB', '', 2),
  ('Kopda Sutrisno', 'Instruktur Fisik & Mental', '', 3)
) as seed(name, role, photo, sort_order)
where not exists (select 1 from public.kesemaptaan_instructors where name = seed.name);

-- KESEMAPTAAN ACHIEVEMENTS (3)
insert into public.kesemaptaan_achievements (name, year, description, documentation)
select * from (values

-- MADING POSTS (6 posts) - disable guard trigger for seeding
alter table public.mading_posts disable trigger guard_mading_post_insert;

insert into public.mading_posts (title, content, category_id, author_name, author_role, cover_image, status, feedback, published_at, created_at)
select seed.title, seed.content, c.id, seed.author_name, seed.author_role, '', 'published', '', seed.published_at, seed.created_at
from (values
  ('Menjaga Semangat Belajar di Tengah Kesibukan', 'Di tengah banyaknya kegiatan sekolah, penting bagi kita untuk tetap menjaga semangat belajar. Manajemen waktu yang baik, istirahat yang cukup, dan lingkungan yang mendukung adalah kunci agar tetap produktif.', 'motivasi', 'Redaksi Mading', 'siswa', '2026-07-01T00:00:00.000Z'::timestamptz, '2026-06-28T10:00:00.000Z'::timestamptz),
  ('Puisi: Senyum Hangus Rindu', 'Di balik jendela yang kau tinggal, ada senyum yang malam ini ku simpan. Hingga hari-hari ini semakin panjang, kasih tak pernah kehilangan peta hatimu.', 'puisi', 'Siswa Kelas X', 'siswa', '2026-06-20T00:00:00.000Z'::timestamptz, '2026-06-18T09:00:00.000Z'::timestamptz),
  ('Tips Sukses Praktik Kerja Lapangan (PKL)', 'PKL adalah kesempatan emas untuk mengenal dunia kerja. Datang tepat waktu, berpakaian rapi, aktif bertanya, jujur dalam bekerja, dan dokumentasikan kegiatan harian.', 'edukasi', 'Siswa Kelas XII', 'siswa', '2026-07-05T00:00:00.000Z'::timestamptz, '2026-07-03T14:00:00.000Z'::timestamptz),
  ('Pantun: Semangat Belajar', 'Pergi ke pasar membeli mangga, Jangan lupa beli rambutan juga, Rajin belajar setiap pagi, Sukses pasti akan kau dapatkan nanti.', 'pantun', 'Siswa Kelas XI', 'siswa', '2026-06-25T00:00:00.000Z'::timestamptz, '2026-06-22T11:00:00.000Z'::timestamptz),
  ('Esai: Pentingnya Literasi Digital bagi Siswa SMK', 'Di era industri 4.0, literasi digital bukan lagi pilihan melainkan keharusan. Siswa SMK dituntut memahami etika digital, keamanan siber, dan kemampuan menyaring informasi.', 'esai', 'Redaksi Mading', 'siswa', '2026-07-08T00:00:00.000Z'::timestamptz, '2026-07-05T08:00:00.000Z'::timestamptz),
  ('Cerpen: Sepatu Baru Pak Surya', 'Pak Surya adalah seorang guru produktif yang selalu datang lebih awal. Suatu pagi, ia datang memakai sepatu baru yang mengkilap. "Sepatu baru, semangat baru," katanya. Sepatu itu ternyata hadiah dari alumni yang kini sukses menjadi teknisi.', 'cerpen', 'Siswa Kelas X', 'siswa', '2026-06-30T00:00:00.000Z'::timestamptz, '2026-06-28T13:00:00.000Z'::timestamptz)
) as seed(title, content, category_slug, author_name, author_role, published_at, created_at)
join public.mading_categories c on c.slug = seed.category_slug
where not exists (select 1 from public.mading_posts where title = seed.title);

alter table public.mading_posts enable trigger guard_mading_post_insert;

  ('Juara II Lomba Baris-Berbaris Tingkat Kabupaten', '2025', 'Tim PBB SMKN 11 meraih juara kedua dalam lomba baris-berbaris tingkat Kabupaten Tangerang.', '[]'::jsonb),
  ('Juara III Lomba PBB Se-Kabupaten Tangerang', '2024', 'Tim PBB Satria 11 meraih juara ketiga dalam lomba baris-berbaris antar SMK se-Kabupaten Tangerang.', '[]'::jsonb),
  ('Best Performance Pasukan Pengibar Bendera', '2025', 'Paskibra Satria 11 mendapatkan penghargaan Best Performance pada upacara Hari Kemerdekaan tingkat kabupaten.', '[]'::jsonb)
) as seed(name, year, description, documentation)
where not exists (select 1 from public.kesemaptaan_achievements where name = seed.name);

where not exists (select 1 from public.achievements where title = seed.title);

) as seed(name, position, department, photo, description)
where not exists (select 1 from public.staff where name = seed.name);

where not exists (select 1 from public.programs where slug = seed.slug);

where not exists (select 1 from public.news where slug = seed.slug);
