-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROFILES
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  role text not null default 'applicant',
  name text,
  phone text,
  updated_at timestamp with time zone default now()
);

alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone."
  on public.profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on public.profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on public.profiles for update
  using ( auth.uid() = id );

-- IS ADMIN FUNCTION
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
end;
$$ language plpgsql security definer;

-- AUTH TRIGGER
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, role, name, phone)
  values (new.id, coalesce(new.raw_user_meta_data->>'role', 'applicant'), new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'phone');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- CONTENT RECORDS
create table if not exists public.content_records (
  id uuid default uuid_generate_v4() primary key,
  content_type text not null,
  data jsonb not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.content_records enable row level security;

create policy "Content is public" on public.content_records
  for select using ( true );
create policy "Admins can insert content" on public.content_records
  for insert with check ( public.is_admin() );
create policy "Admins can update content" on public.content_records
  for update using ( public.is_admin() );
create policy "Admins can delete content" on public.content_records
  for delete using ( public.is_admin() );

-- CONTACT MESSAGES
create table if not exists public.contact_messages (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  email text not null,
  subject text not null,
  message text not null,
  is_read smallint not null default 0,
  created_at timestamp with time zone default now()
);

alter table public.contact_messages enable row level security;

create policy "Anyone can insert contact message" on public.contact_messages
  for insert with check ( true );
create policy "Admins can read contact messages" on public.contact_messages
  for select using ( public.is_admin() );
create policy "Admins can update contact messages" on public.contact_messages
  for update using ( public.is_admin() );
create policy "Admins can delete contact messages" on public.contact_messages
  for delete using ( public.is_admin() );

-- PPDB REGISTRATIONS
create table if not exists public.ppdb_registrations (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null unique,
  registration_number text,
  full_name text,
  nisn text,
  nik text,
  gender text,
  place_of_birth text,
  date_of_birth date,
  religion text,
  address text,
  phone text,
  father_name text,
  father_occupation text,
  mother_name text,
  mother_occupation text,
  guardian_name text,
  guardian_phone text,
  parent_address text,
  previous_school text,
  previous_school_address text,
  graduation_year text,
  program text,
  documents_count int default 0,
  status text default 'Menunggu Verifikasi',
  admin_note text,
  submitted_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.ppdb_registrations enable row level security;

create policy "Users can view own application" on public.ppdb_registrations
  for select using ( auth.uid() = user_id or public.is_admin() );
create policy "Users can insert own application" on public.ppdb_registrations
  for insert with check ( auth.uid() = user_id );
create policy "Users can update own application" on public.ppdb_registrations
  for update using ( auth.uid() = user_id or public.is_admin() );
create policy "Admins can delete applications" on public.ppdb_registrations
  for delete using ( public.is_admin() );

-- PPDB DOCUMENTS
create table if not exists public.ppdb_documents (
  id uuid default uuid_generate_v4() primary key,
  application_id uuid references public.ppdb_registrations on delete cascade not null,
  type text,
  filename text,
  file_path text,
  mime_type text,
  file_size int,
  verified smallint default 0,
  note text,
  created_at timestamp with time zone default now()
);

alter table public.ppdb_documents enable row level security;

create policy "Users can view own documents" on public.ppdb_documents
  for select using (
    exists (select 1 from public.ppdb_registrations r where r.id = application_id and r.user_id = auth.uid()) or public.is_admin()
  );
create policy "Users can insert own documents" on public.ppdb_documents
  for insert with check (
    exists (select 1 from public.ppdb_registrations r where r.id = application_id and r.user_id = auth.uid())
  );
create policy "Users can update own documents" on public.ppdb_documents
  for update using (
    exists (select 1 from public.ppdb_registrations r where r.id = application_id and r.user_id = auth.uid()) or public.is_admin()
  );
create policy "Users can delete own documents" on public.ppdb_documents
  for delete using (
    exists (select 1 from public.ppdb_registrations r where r.id = application_id and r.user_id = auth.uid()) or public.is_admin()
  );

-- PPDB ACTIVITY LOG
create table if not exists public.ppdb_activity_log (
  id uuid default uuid_generate_v4() primary key,
  application_id uuid references public.ppdb_registrations on delete cascade not null,
  action text,
  note text,
  created_at timestamp with time zone default now()
);

alter table public.ppdb_activity_log enable row level security;

create policy "Users can view own activity log" on public.ppdb_activity_log
  for select using (
    exists (select 1 from public.ppdb_registrations r where r.id = application_id and r.user_id = auth.uid()) or public.is_admin()
  );
create policy "Users can insert own activity log" on public.ppdb_activity_log
  for insert with check (
    exists (select 1 from public.ppdb_registrations r where r.id = application_id and r.user_id = auth.uid()) or public.is_admin()
  );
