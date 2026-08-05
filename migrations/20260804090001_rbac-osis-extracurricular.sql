-- ============================================================
-- RBAC: roles, permissions, role_permissions + OSIS + Ekskul
-- Fase 1-5 UPDATE.md
-- ============================================================

-- ---------- PROFILES: tambah email + kunci role agar aman ----------
alter table public.profiles add column if not exists email text;

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, role, name, phone, email)
  values (new.id, 'applicant', new.profile->>'name', new.profile->>'phone', new.email);
  return new;
end;
$$ language plpgsql security definer;

create or replace function public.guard_profile_role()
returns trigger as $$
begin
  if tg_op = 'INSERT' then
    if not public.is_admin() and new.role is distinct from 'applicant' then
      new.role := 'applicant';
    end if;
  elsif tg_op = 'UPDATE' then
    if new.role is distinct from old.role and not public.is_admin() then
      raise exception 'Tidak diizinkan mengubah role sendiri';
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer
set search_path = pg_catalog, public, pg_temp;

drop trigger if exists guard_profile_role on public.profiles;
create trigger guard_profile_role
  before insert or update on public.profiles
  for each row execute function public.guard_profile_role();

-- ---------- ROLES ----------
create table if not exists public.roles (
  id uuid default gen_random_uuid() primary key,
  slug text not null unique,
  name text not null,
  created_at timestamp with time zone default now()
);

alter table public.roles enable row level security;

create policy "Roles are readable by authenticated users" on public.roles
  for select to authenticated using (true);
create policy "Admins can insert roles" on public.roles
  for insert with check ( public.is_admin() );
create policy "Admins can update roles" on public.roles
  for update using ( public.is_admin() );
create policy "Admins can delete roles" on public.roles
  for delete using ( public.is_admin() );

-- ---------- PERMISSIONS ----------
create table if not exists public.permissions (
  id uuid default gen_random_uuid() primary key,
  slug text not null unique,
  name text not null,
  module text not null default '',
  created_at timestamp with time zone default now()
);

alter table public.permissions enable row level security;

create policy "Permissions are readable by authenticated users" on public.permissions
  for select to authenticated using (true);
create policy "Admins can insert permissions" on public.permissions
  for insert with check ( public.is_admin() );
create policy "Admins can update permissions" on public.permissions
  for update using ( public.is_admin() );
create policy "Admins can delete permissions" on public.permissions
  for delete using ( public.is_admin() );

-- ---------- ROLE_PERMISSIONS ----------
create table if not exists public.role_permissions (
  id uuid default gen_random_uuid() primary key,
  role_id uuid references public.roles(id) on delete cascade not null,
  permission_id uuid references public.permissions(id) on delete cascade not null,
  unique(role_id, permission_id)
);

alter table public.role_permissions enable row level security;

create policy "Admins can read role_permissions" on public.role_permissions
  for select to authenticated using ( public.is_admin() );
create policy "Admins can insert role_permissions" on public.role_permissions
  for insert with check ( public.is_admin() );
create policy "Admins can update role_permissions" on public.role_permissions
  for update using ( public.is_admin() );
create policy "Admins can delete role_permissions" on public.role_permissions
  for delete using ( public.is_admin() );

-- ---------- FUNGSI PERMISSION ----------
create or replace function public.has_permission(p_perm text)
returns boolean as $$
declare
  v_role text;
begin
  select role into v_role from public.profiles where id = auth.uid();
  if v_role = 'admin' then
    return true;
  end if;
  if v_role is null then
    return false;
  end if;
  return exists (
    select 1
    from public.role_permissions rp
    join public.roles r on r.id = rp.role_id
    join public.permissions pm on pm.id = rp.permission_id
    where r.slug = v_role and pm.slug = p_perm
  );
end;
$$ language plpgsql security definer
set search_path = pg_catalog, public, pg_temp;

create or replace function public.get_my_permissions()
returns setof text as $$
declare
  v_role text;
begin
  select role into v_role from public.profiles where id = auth.uid();
  if v_role = 'admin' then
    return query select slug from public.permissions;
    return;
  end if;
  if v_role is null then
    return;
  end if;
  return query
    select pm.slug
    from public.role_permissions rp
    join public.roles r on r.id = rp.role_id
    join public.permissions pm on pm.id = rp.permission_id
    where r.slug = v_role;
end;
$$ language plpgsql security definer
set search_path = pg_catalog, public, pg_temp;

-- ---------- SEED: ROLES ----------
insert into public.roles (slug, name) values
  ('admin', 'Admin'),
  ('guru', 'Guru'),
  ('osis', 'OSIS')
on conflict (slug) do nothing;

-- ---------- SEED: PERMISSIONS ----------
insert into public.permissions (slug, name, module) values
  ('dashboard.view', 'Dashboard - Lihat', 'dashboard'),
  ('osis.view', 'OSIS - Lihat', 'osis'),
  ('osis.create', 'OSIS - Buat', 'osis'),
  ('osis.edit', 'OSIS - Ubah', 'osis'),
  ('osis.delete', 'OSIS - Hapus', 'osis'),
  ('osis.publish', 'OSIS - Publikasi', 'osis'),
  ('osis.activities.view', 'Kegiatan OSIS - Lihat', 'osis.activities'),
  ('osis.activities.create', 'Kegiatan OSIS - Buat', 'osis.activities'),
  ('osis.activities.edit', 'Kegiatan OSIS - Ubah', 'osis.activities'),
  ('osis.activities.delete', 'Kegiatan OSIS - Hapus', 'osis.activities'),
  ('extracurricular.view', 'Ekstrakurikuler - Lihat', 'extracurricular'),
  ('extracurricular.create', 'Ekstrakurikuler - Buat', 'extracurricular'),
  ('extracurricular.edit', 'Ekstrakurikuler - Ubah', 'extracurricular'),
  ('extracurricular.delete', 'Ekstrakurikuler - Hapus', 'extracurricular'),
  ('extracurricular.publish', 'Ekstrakurikuler - Publikasi', 'extracurricular'),
  ('kesemaptaan.view', 'Kesemaptaan - Lihat', 'kesemaptaan'),
  ('kesemaptaan.create', 'Kesemaptaan - Buat', 'kesemaptaan'),
  ('kesemaptaan.edit', 'Kesemaptaan - Ubah', 'kesemaptaan'),
  ('kesemaptaan.delete', 'Kesemaptaan - Hapus', 'kesemaptaan'),
  ('kesemaptaan.publish', 'Kesemaptaan - Publikasi', 'kesemaptaan'),
  ('mading.view', 'Mading - Lihat', 'mading'),
  ('mading.create', 'Mading - Buat', 'mading'),
  ('mading.edit_own', 'Mading - Ubah Karya Sendiri', 'mading'),
  ('mading.edit_all', 'Mading - Ubah Semua Karya', 'mading'),
  ('mading.delete', 'Mading - Hapus', 'mading'),
  ('mading.submit_review', 'Mading - Kirim Review', 'mading'),
  ('mading.review', 'Mading - Review', 'mading'),
  ('mading.publish', 'Mading - Publikasi', 'mading'),
  ('spmb.view', 'SPMB - Lihat', 'spmb'),
  ('spmb.create', 'SPMB - Buat', 'spmb'),
  ('spmb.edit', 'SPMB - Ubah', 'spmb'),
  ('spmb.delete', 'SPMB - Hapus', 'spmb'),
  ('spmb.verify', 'SPMB - Verifikasi', 'spmb'),
  ('management.view', 'Manajemen - Lihat', 'management')
on conflict (slug) do nothing;

-- ---------- SEED: DEFAULT ROLE PERMISSIONS ----------
-- Admin otomatis penuh (has_permission selalu true untuk role admin).

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on true
where r.slug = 'admin'
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p
  on p.slug in (
    'dashboard.view',
    'mading.view', 'mading.create', 'mading.edit_own', 'mading.submit_review',
    'mading.review', 'mading.publish', 'mading.edit_all', 'mading.delete',
    'management.view',
    'osis.view',
    'spmb.view'
  )
where r.slug = 'guru'
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p
  on p.slug in (
    'dashboard.view',
    'osis.view', 'osis.create', 'osis.edit',
    'osis.activities.view', 'osis.activities.create', 'osis.activities.edit',
    'extracurricular.view', 'extracurricular.create', 'extracurricular.edit', 'extracurricular.delete',
    'kesemaptaan.view', 'kesemaptaan.create', 'kesemaptaan.edit', 'kesemaptaan.delete',
    'mading.view', 'mading.create', 'mading.edit_own', 'mading.submit_review',
    'mading.review', 'mading.publish',
    'spmb.view'
  )
where r.slug = 'osis'
on conflict do nothing;

-- ============================================================
-- OSIS
-- ============================================================
create table if not exists public.osis (
  id uuid default gen_random_uuid() primary key,
  name text not null default '',
  description text not null default '',
  period text not null default '',
  logo text not null default '',
  updated_at timestamp with time zone default now()
);

create table if not exists public.osis_members (
  id uuid default gen_random_uuid() primary key,
  osis_id uuid references public.osis(id) on delete cascade,
  name text not null default '',
  position text not null default '',
  division text not null default '',
  photo text not null default '',
  sort_order integer not null default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists public.osis_activities (
  id uuid default gen_random_uuid() primary key,
  title text not null default '',
  description text not null default '',
  photo text not null default '',
  activity_date date,
  status text not null default 'published',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.osis enable row level security;
alter table public.osis_members enable row level security;
alter table public.osis_activities enable row level security;

create policy "OSIS profile is public" on public.osis
  for select using ( true );
create policy "OSIS profile admin insert" on public.osis
  for insert with check ( public.has_permission('osis.create') );
create policy "OSIS profile admin update" on public.osis
  for update using ( public.has_permission('osis.edit') );
create policy "OSIS profile admin delete" on public.osis
  for delete using ( public.has_permission('osis.delete') );

create policy "OSIS members are public" on public.osis_members
  for select using ( true );
create policy "OSIS members admin insert" on public.osis_members
  for insert with check ( public.has_permission('osis.create') );
create policy "OSIS members admin update" on public.osis_members
  for update using ( public.has_permission('osis.edit') );
create policy "OSIS members admin delete" on public.osis_members
  for delete using ( public.has_permission('osis.delete') );

create policy "Published activities are public" on public.osis_activities
  for select using ( status = 'published' or public.has_permission('osis.activities.view') );
create policy "Activities admin insert" on public.osis_activities
  for insert with check ( public.has_permission('osis.activities.create') );
create policy "Activities admin update" on public.osis_activities
  for update using ( public.has_permission('osis.activities.edit') );
create policy "Activities admin delete" on public.osis_activities
  for delete using ( public.has_permission('osis.activities.delete') );

-- ============================================================
-- EKSTRAKURIKULER
-- ============================================================
create table if not exists public.extracurriculars (
  id uuid default gen_random_uuid() primary key,
  name text not null default '',
  slug text not null unique,
  category text not null default '',
  description text not null default '',
  photo text not null default '',
  advisor text not null default '',
  schedule text not null default '',
  place text not null default '',
  achievements jsonb not null default '[]',
  documentation jsonb not null default '[]',
  status text not null default 'published',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.extracurriculars enable row level security;

create policy "Published extracurriculars are public" on public.extracurriculars
  for select using ( status = 'published' or public.has_permission('extracurricular.view') );
create policy "Extracurricular admin insert" on public.extracurriculars
  for insert with check ( public.has_permission('extracurricular.create') );
create policy "Extracurricular admin update" on public.extracurriculars
  for update using ( public.has_permission('extracurricular.edit') );
create policy "Extracurricular admin delete" on public.extracurriculars
  for delete using ( public.has_permission('extracurricular.delete') );
