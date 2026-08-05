-- Seed initial OSIS profile, members, activities, and extracurriculars.

insert into public.osis (id, name, description, period)
values
  (
    '00000000-0000-4000-8000-000000000001',
    'OSIS SMKN 11 Kabupaten Tangerang',
    'Organisasi Siswa Intra Sekolah (OSIS) SMKN 11 Kabupaten Tangerang adalah wadah organisasi bagi siswa untuk mengembangkan jiwa kepemimpinan, kreativitas, dan kepedulian sosial di lingkungan sekolah maupun masyarakat.',
    '2025/2026'
  )
on conflict (id) do nothing;

insert into public.osis_members (osis_id, name, position, division, photo, sort_order)
values
  ('00000000-0000-4000-8000-000000000001', 'Andi Pratama', 'Ketua', 'Ketua OSIS', '', 1),
  ('00000000-0000-4000-8000-000000000001', 'Sinta Lestari', 'Wakil Ketua', 'Wakil Ketua OSIS', '', 2),
  ('00000000-0000-4000-8000-000000000001', 'Rizky Ramadhan', 'Sekretaris', 'Sekretaris', '', 3),
  ('00000000-0000-4000-8000-000000000001', 'Dewi Anggraini', 'Bendahara', 'Bendahara', '', 4),
  ('00000000-0000-4000-8000-000000000001', 'Ahmad Fauzi', 'Ketua Bidang', 'Pembinaan Karakter', '', 5),
  ('00000000-0000-4000-8000-000000000001', 'Nabila Putri', 'Ketua Bidang', 'Seni & Kreativitas', '', 6)
on conflict do nothing;

insert into public.osis_activities (title, description, photo, activity_date, status)
values
  ('Latihan Kepemimpinan Siswa (LKS)',
   'Kegiatan pelatihan kepemimpinan yang diikuti oleh pengurus OSIS dan perwakilan kelas untuk membangun jiwa pemimpin yang tangguh dan bertanggung jawab.',
   'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=900&q=80', '2026-01-15', 'published'),
  ('Peringatan Hari Kemerdekaan RI',
   'Rangkaian kegiatan perayaan HUT kemerdekaan RI yang melibatkan seluruh warga sekolah, mulai dari upacara bendera hingga lomba-lomba kebangsaan.',
   'https://images.unsplash.com/photo-1532375810709-75b1da00537c?auto=format&fit=crop&w=900&q=80', '2026-08-17', 'published'),
  ('Bakti Sosial Peduli Lingkungan',
   'Kegiatan kerja bakti dan penghijauan di sekitar lingkungan sekolah sebagai wujud kepedulian OSIS terhadap kelestarian lingkungan.',
   'https://images.unsplash.com/photo-1526392060635-9d6019884377?auto=format&fit=crop&w=900&q=80', '2026-03-05', 'published')
on conflict do nothing;

insert into public.extracurriculars (name, slug, category, description, advisor, schedule, photo, status, achievements, documentation)
values
  ('Paskibra Satria 11', 'paskibra-satria-11', 'Kedisiplinan', 'Pasukan Pengibar Bendera yang melatih kedisiplinan, kekompakan, dan jiwa nasionalisme melalui latihan baris-berbaris dan tata upacara bendera.', 'Aiptu Hendra Gunawan', 'Jumat & Sabtu', 'https://images.unsplash.com/photo-1526976668913-0b7520b8c12d?auto=format&fit=crop&w=900&q=80', 'published', '[]', '[]'),
  ('Futsal', 'futsal', 'Olahraga', 'Wadah pengembangan bakat olahraga futsal yang telah menorehkan berbagai prestasi di tingkat kabupaten dan provinsi.', 'Pak Rahmat Hidayat', 'Selasa & Kamis', 'https://images.unsplash.com/photo-1552664688-cf1ec3b78426?auto=format&fit=crop&w=900&q=80', 'published', '[]', '[]'),
  ('Basket', 'basket', 'Olahraga', 'Ekstrakurikuler bola basket yang mengedepankan kerja sama tim, ketangkasan, dan sportivitas.', 'Pak Dede Supriyadi', 'Senin & Rabu', 'https://images.unsplash.com/photo-1574623452339-5e2b0dc96d8f?auto=format&fit=crop&w=900&q=80', 'published', '[]', '[]'),
  ('Rohis (Rohani Islam)', 'rohis-rohani-islam', 'Keagamaan', 'Kegiatan kerohanian Islam yang bertujuan memperkuat iman, akhlak mulia, dan wawasan keislaman siswa melalui kajian, mentoring, dan kegiatan sosial.', 'Bu Aisyah S.Pd.I', 'Jumat', 'https://images.unsplash.com/photo-1585412727339-54e4bae3bbf9?auto=format&fit=crop&w=900&q=80', 'published', '[]', '[]'),
  ('PMR (Palang Merah Remaja)', 'pmr-palang-merah-remaja', 'Sosial', 'Organisasi kepalangmerahan yang melatih siswa menjadi relawan tanggap darurat, pertolongan pertama, dan donor darah.', 'Bu Dewi Sartika', 'Sabtu', 'https://images.unsplash.com/photo-1512486130939-2c6f79935e4f?auto=format&fit=crop&w=900&q=80', 'published', '[]', '[]'),
  ('Pramuka', 'pramuka', 'Kedisiplinan', 'Kegiatan kepanduan yang membentuk karakter, kemandirian, dan jiwa kepemimpinan melalui berbagai kegiatan outdoor dan keterampilan.', 'Pak Sutrisno', 'Jumat', 'https://images.unsplash.com/photo-1521184975302-1c3d0c5355bf?auto=format&fit=crop&w=900&q=80', 'published', '[]', '[]'),
  ('Jurnalistik & Multimedia', 'jurnalistik-multimedia', 'Seni & Kreatif', 'Wadah pengembangan minat di bidang penulisan, fotografi, videografi, dan produksi konten digital untuk publikasi sekolah.', 'Pak Wahyu Nugroho', 'Rabu', 'https://images.unsplash.com/photo-1574688084565-51d6d5f4f2e?auto=format&fit=crop&w=900&q=80', 'published', '[]', '[]'),
  ('Seni Tari & Musik', 'seni-tari-musik', 'Seni & Kreatif', 'Eksplorasi bakat seni tari tradisional dan modern, serta musik, yang sering tampil pada acara-acara sekolah dan lomba kebudayaan.', 'Bu Rina Marlina', 'Kamis', 'https://images.unsplash.com/photo-1516280464613-81e30c6f1f0b?auto=format&fit=crop&w=900&q=80', 'published', '[]', '[]'),
  ('English Club', 'english-club', 'Akademik', 'Klub percakapan bahasa Inggris yang meningkatkan kemampuan speaking, listening, dan public speaking melalui debat, storytelling, dan diskusi.', 'Bu Nani Kusumawati', 'Selasa', 'https://images.unsplash.com/photo-1582656894606-c1c9e6ef015d?auto=format&fit=crop&w=900&q=80', 'published', '[]', '[]'),
  ('Taekwondo', 'taekwondo', 'Olahraga', 'Latihan bela diri taekwondo untuk mengembangkan kesehatan fisik, disiplin, dan kemampuan bela diri dengan pembinaan berjenjang.', 'Pak Agus Salim', 'Kamis & Sabtu', 'https://images.unsplash.com/photo-1576200962002-b08bab9ca72f?auto=format&fit=crop&w=900&q=80', 'published', '[]', '[]')
on conflict (slug) do nothing;