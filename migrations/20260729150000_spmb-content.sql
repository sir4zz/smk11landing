-- SPMB information portal (single-row config, no applicant data)

create table if not exists public.spmb_content (
  id uuid default uuid_generate_v4() primary key,
  status text not null default 'ditutup' check (status in ('dibuka', 'ditutup')),
  title text not null default 'Seleksi Penerimaan Murid Baru (SPMB)',
  description text not null default '',
  latest_info text not null default '',
  requirements jsonb not null default '[]'::jsonb,
  schedule jsonb not null default '[]'::jsonb,
  flow_steps jsonb not null default '[]'::jsonb,
  faq jsonb not null default '[]'::jsonb,
  portal_url text not null default 'https://spmb.bantenprov.go.id',
  banner_image text not null default '',
  banner_title text not null default '',
  banner_description text not null default '',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

insert into public.spmb_content (
  status,
  title,
  description,
  latest_info,
  requirements,
  schedule,
  flow_steps,
  faq,
  portal_url,
  banner_image,
  banner_title,
  banner_description
)
select
  'dibuka',
  'Seleksi Penerimaan Murid Baru (SPMB) SMKN 11 Kabupaten Tangerang',
  'SPMB adalah sistem penerimaan murid baru untuk jenjang pendidikan menengah kejuruan. SMKN 11 Kabupaten Tangerang mengikuti SPMB Provinsi Banten yang diselenggarakan secara online melalui portal resmi pemerintah.',
  'Pendaftaran SPMB Tahun Ajaran 2026/2027 akan dibuka melalui portal resmi SPMB Provinsi Banten. Calon murid wajib mendaftar secara online di portal resmi, bukan melalui website sekolah.',
  '[
    "Ijazah SMP / Surat Keterangan Lulus (SKL)",
    "Kartu Keluarga (KK)",
    "Akta Kelahiran",
    "Pas Foto Berwarna (3x4)",
    "SKHUN / Surat Keterangan Hasil Ujian Nasional",
    "Rapor SMP Semester 1 - 5",
    "Kartu NISN (jika ada)",
    "Sertifikat prestasi (jika mendaftar jalur prestasi)"
  ]'::jsonb,
  '[
    {"category": "pendaftaran", "date": "20-25 Juni 2026", "title": "Pendaftaran Online"},
    {"category": "seleksi", "date": "1-5 Juli 2026", "title": "Seleksi Administrasi & Akademik"},
    {"category": "pengumuman", "date": "10 Juli 2026", "title": "Pengumuman Hasil Seleksi"},
    {"category": "daftar_ulang", "date": "11-15 Juli 2026", "title": "Daftar Ulang"}
  ]'::jsonb,
  '[
    {"title": "Informasi", "description": "Pelajari informasi SPMB, jadwal, dan persyaratan di halaman ini"},
    {"title": "Persiapan Persyaratan", "description": "Siapkan dokumen administrasi yang diperlukan"},
    {"title": "Daftar di Portal Resmi", "description": "Lakukan pendaftaran melalui portal SPMB Provinsi Banten"},
    {"title": "Seleksi", "description": "Ikuti tahap seleksi sesuai jadwal yang ditetapkan"},
    {"title": "Pengumuman", "description": "Cek hasil seleksi di portal resmi SPMB"},
    {"title": "Daftar Ulang", "description": "Lakukan daftar ulang jika dinyatakan diterima"}
  ]'::jsonb,
  '[
    {"question": "Apa itu SPMB?", "answer": "SPMB (Seleksi Penerimaan Murid Baru) adalah sistem penerimaan siswa baru yang diselenggarakan oleh Dinas Pendidikan Provinsi Banten secara terpusat melalui portal online resmi."},
    {"question": "Di mana saya mendaftar?", "answer": "Pendaftaran dilakukan melalui portal resmi SPMB Provinsi Banten, bukan melalui website sekolah. Gunakan tombol DAFTAR SPMB di halaman ini untuk menuju portal resmi."},
    {"question": "Kapan pendaftaran SPMB dibuka?", "answer": "Jadwal pendaftaran mengikuti ketentuan SPMB Provinsi Banten. Lihat bagian Jadwal di halaman ini untuk informasi terbaru."},
    {"question": "Apakah ada biaya pendaftaran?", "answer": "Pendaftaran SPMB tidak dipungut biaya (gratis). Biaya yang timbul hanya pada saat daftar ulang untuk seragam dan keperluan pribadi siswa."},
    {"question": "Apakah menerima siswa dari luar daerah?", "answer": "Ya, SMKN 11 Kabupaten Tangerang menerima siswa sesuai kuota jalur zonasi, prestasi, afirmasi, dan perpindahan tugas orang tua yang ditetapkan SPMB Provinsi Banten."}
  ]'::jsonb,
  'https://spmb.bantenprov.go.id',
  'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1600&q=80',
  'SPMB SMKN 11 Kabupaten Tangerang',
  'Portal informasi resmi SPMB. Pendaftaran dilakukan melalui portal SPMB Provinsi Banten.'
where not exists (select 1 from public.spmb_content limit 1);

alter table public.spmb_content enable row level security;

create policy "SPMB content is public"
  on public.spmb_content for select using (true);

create policy "Admins can insert SPMB content"
  on public.spmb_content for insert with check (public.is_admin());

create policy "Admins can update SPMB content"
  on public.spmb_content for update using (public.is_admin());

create policy "Admins can delete SPMB content"
  on public.spmb_content for delete using (public.is_admin());
