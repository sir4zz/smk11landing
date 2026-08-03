-- Manajemen content: staff bios, teacher activities (kegiatan guru),
-- and education staff (tenaga kependidikan)

-- Short biography for Kepala Sekolah / Wakil Kepala Sekolah on Manajemen pages
alter table public.staff add column if not exists description text not null default '';

create table if not exists public.teacher_activities (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  date date not null default current_date,
  category text not null default '',
  description text not null default '',
  photo text not null default '',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists public.education_staff (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  position text not null default '',
  department text not null default '',
  photo text not null default '',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Seed teacher activities (kegiatan guru)
insert into public.teacher_activities (title, date, category, description, photo)
select * from (values
  (
    'Workshop Penyusunan Perangkat Pembelajaran Kurikulum Merdeka',
    '2026-01-15'::date,
    'Workshop',
    'Seluruh guru mengikuti workshop penyusunan modul ajar dan asesmen berbasis Kurikulum Merdeka yang dibimbing oleh narasumber dari Dinas Pendidikan Provinsi Banten.',
    'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=900&q=80'
  ),
  (
    'Rapat Evaluasi Pembelajaran Semester Ganjil',
    '2026-01-10'::date,
    'Rapat',
    'Evaluasi hasil pembelajaran semester ganjil untuk perbaikan mutu layanan pembelajaran pada semester genap.',
    'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=900&q=80'
  ),
  (
    'Pelatihan Asesmen Kompetensi dan Pembelajaran Berbasis Proyek',
    '2026-02-05'::date,
    'Workshop',
    'Pelatihan internal guru untuk menguatkan asesmen kompetensi dan penerapan pembelajaran berbasis proyek (PjBL).',
    'https://images.unsplash.com/photo-1571260899304-425eee4c7efc?auto=format&fit=crop&w=900&q=80'
  ),
  (
    'Upacara dan Syukuran Peringatan Hari Guru Nasional',
    '2025-11-25'::date,
    'Hari Besar',
    'Kegiatan apresiasi kepada seluruh guru atas dedikasi mereka dalam mencerdaskan murid SMKN 11 Kabupaten Tangerang.',
    'https://images.unsplash.com/photo-1544923246-77307dd654cb?auto=format&fit=crop&w=900&q=80'
  ),
  (
    'Gotong Royong dan Persiapan Lingkungan Sekolah',
    '2026-02-14'::date,
    'Kegiatan Sosial',
    'Seluruh pendidik dan tenaga kependidikan bergotong royong menata lingkungan sekolah menjelang dimulainya semester genap.',
    'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=900&q=80'
  )
) as seed(title, date, category, description, photo)
where not exists (select 1 from public.teacher_activities limit 1);

-- Seed education staff (tenaga kependidikan)
insert into public.education_staff (name, position, department, photo)
select * from (values
  (
    'Hj. Yuli Astuti, S.E.',
    'Kepala Tata Usaha',
    'Tata Usaha',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=800&q=80'
  ),
  (
    'Dede Firmansyah',
    'Operator Sekolah (Dapodik)',
    'Tata Usaha',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80'
  ),
  (
    'Rina Kartika, S.Pd.',
    'Pustakawan',
    'Perpustakaan',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=800&q=80'
  ),
  (
    'Maman Suherman',
    'Staf Perpustakaan',
    'Perpustakaan',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=800&q=80'
  ),
  (
    'Yusuf Hidayat, A.Md.',
    'Laboran',
    'Laboratorium',
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80'
  ),
  (
    'Titi Maryati',
    'Staf Kesiswaan',
    'Kesiswaan',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80'
  ),
  (
    'Ahmad Rifai',
    'Staf Sarana Prasarana',
    'Sarana Prasarana',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80'
  ),
  (
    'Siti Nurhaliza, A.Md.',
    'Staf Humas',
    'Humas',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80'
  )
) as seed(name, position, department, photo)
where not exists (select 1 from public.education_staff limit 1);

-- Set short bios for existing management staff
update public.staff set description = 'Memimpin SMKN 11 Kabupaten Tangerang dengan visi sekolah vokasi yang unggul, berkarakter, dan siap kerja, didukung tata kelola yang transparan dan partisipatif.' where position = 'Kepala Sekolah' and description = '';

update public.staff set description = 'Mengoordinasikan pelaksanaan kurikulum, kegiatan belajar mengajar, serta asesmen agar mutu pembelajaran terus meningkat.' where position like 'Wakil Kepala Sekolah Bid.%' and description = '';

-- RLS policies
alter table public.teacher_activities enable row level security;
alter table public.education_staff enable row level security;

create policy "Content is public" on public.teacher_activities for select using ( true );
create policy "Content is public" on public.education_staff for select using ( true );

create policy "Admins can insert" on public.teacher_activities for insert with check ( public.is_admin() );
create policy "Admins can insert" on public.education_staff for insert with check ( public.is_admin() );

create policy "Admins can update" on public.teacher_activities for update using ( public.is_admin() );
create policy "Admins can update" on public.education_staff for update using ( public.is_admin() );

create policy "Admins can delete" on public.teacher_activities for delete using ( public.is_admin() );
create policy "Admins can delete" on public.education_staff for delete using ( public.is_admin() );

-- updated_at triggers
create trigger teacher_activities_updated_at
  before update on public.teacher_activities
  for each row
  execute function system.update_updated_at();

create trigger education_staff_updated_at
  before update on public.education_staff
  for each row
  execute function system.update_updated_at();
