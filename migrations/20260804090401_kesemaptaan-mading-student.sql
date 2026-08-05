-- ============================================================
-- Phase 6-8: Kesemaptaan, Mading, Student Account
-- UPDATE.md UPDATE.md fase 6-8
-- ============================================================

-- ============================================================
-- KESEMAPTAAN
-- ============================================================
create table if not exists public.kesemaptaan (
  id uuid default gen_random_uuid() primary key,
  title text not null default '',
  description text not null default '',
  photo text not null default '',
  updated_at timestamp with time zone default now()
);

create table if not exists public.kesemaptaan_activities (
  id uuid default gen_random_uuid() primary key,
  title text not null default '',
  description text not null default '',
  activity_date date,
  documentation jsonb not null default '[]',
  status text not null default 'published',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists public.kesemaptaan_schedules (
  id uuid default gen_random_uuid() primary key,
  day text not null default '',
  time text not null default '',
  place text not null default '',
  created_at timestamp with time zone default now()
);

create table if not exists public.kesemaptaan_instructors (
  id uuid default gen_random_uuid() primary key,
  name text not null default '',
  role text not null default '',
  photo text not null default '',
  sort_order integer not null default 0,
  created_at timestamp with time zone default now()
);

create table if not exists public.kesemaptaan_achievements (
  id uuid default gen_random_uuid() primary key,
  name text not null default '',
  year text not null default '',
  description text not null default '',
  documentation jsonb not null default '[]',
  created_at timestamp with time zone default now()
);

alter table public.kesemaptaan enable row level security;
alter table public.kesemaptaan_activities enable row level security;
alter table public.kesemaptaan_schedules enable row level security;
alter table public.kesemaptaan_instructors enable row level security;
alter table public.kesemaptaan_achievements enable row level security;

create policy "Kesemaptaan profile is public" on public.kesemaptaan
  for select using ( true );
create policy "Kesemaptaan admin insert" on public.kesemaptaan
  for insert with check ( public.has_permission('kesemaptaan.create') );
create policy "Kesemaptaan admin update" on public.kesemaptaan
  for update using ( public.has_permission('kesemaptaan.edit') );
create policy "Kesemaptaan admin delete" on public.kesemaptaan
  for delete using ( public.has_permission('kesemaptaan.delete') );

create policy "Published activities are public" on public.kesemaptaan_activities
  for select using ( status = 'published' or public.has_permission('kesemaptaan.view') );
create policy "Activities admin insert" on public.kesemaptaan_activities
  for insert with check ( public.has_permission('kesemaptaan.create') );
create policy "Activities admin update" on public.kesemaptaan_activities
  for update using ( public.has_permission('kesemaptaan.edit') );
create policy "Activities admin delete" on public.kesemaptaan_activities
  for delete using ( public.has_permission('kesemaptaan.delete') );

create policy "Schedules are public" on public.kesemaptaan_schedules
  for select using ( true );
create policy "Schedules admin insert" on public.kesemaptaan_schedules
  for insert with check ( public.has_permission('kesemaptaan.create') );
create policy "Schedules admin update" on public.kesemaptaan_schedules
  for update using ( public.has_permission('kesemaptaan.edit') );
create policy "Schedules admin delete" on public.kesemaptaan_schedules
  for delete using ( public.has_permission('kesemaptaan.delete') );

create policy "Instructors are public" on public.kesemaptaan_instructors
  for select using ( true );
create policy "Instructors admin insert" on public.kesemaptaan_instructors
  for insert with check ( public.has_permission('kesemaptaan.create') );
create policy "Instructors admin update" on public.kesemaptaan_instructors
  for update using ( public.has_permission('kesemaptaan.edit') );
create policy "Instructors admin delete" on public.kesemaptaan_instructors
  for delete using ( public.has_permission('kesemaptaan.delete') );

create policy "Achievements are public" on public.kesemaptaan_achievements
  for select using ( true );
create policy "Achievements admin insert" on public.kesemaptaan_achievements
  for insert with check ( public.has_permission('kesemaptaan.create') );
create policy "Achievements admin update" on public.kesemaptaan_achievements
  for update using ( public.has_permission('kesemaptaan.edit') );
create policy "Achievements admin delete" on public.kesemaptaan_achievements
  for delete using ( public.has_permission('kesemaptaan.delete') );

-- ============================================================
-- MADING
-- ============================================================
create table if not exists public.mading_categories (
  id uuid default gen_random_uuid() primary key,
  slug text not null unique,
  name text not null,
  sort_order integer not null default 0,
  created_at timestamp with time zone default now()
);

create table if not exists public.mading_posts (
  id uuid default gen_random_uuid() primary key,
  title text not null default '',
  content text not null default '',
  category_id uuid references public.mading_categories(id) on delete set null,
  author_id uuid references auth.users(id) on delete set null,
  author_name text not null default '',
  author_role text not null default 'siswa',
  cover_image text not null default '',
  status text not null default 'draft',
  feedback text not null default '',
  published_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists public.mading_reviews (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references public.mading_posts(id) on delete cascade not null,
  reviewer_id uuid references auth.users(id) on delete set null,
  reviewer_name text not null default '',
  action text not null default 'approve',
  feedback text not null default '',
  created_at timestamp with time zone default now()
);

alter table public.mading_categories enable row level security;
alter table public.mading_posts enable row level security;
alter table public.mading_reviews enable row level security;

create policy "Categories are public" on public.mading_categories
  for select using ( true );
create policy "Categories admin insert" on public.mading_categories
  for insert with check ( public.has_permission('mading.edit_all') );
create policy "Categories admin update" on public.mading_categories
  for update using ( public.has_permission('mading.edit_all') );
create policy "Categories admin delete" on public.mading_categories
  for delete using ( public.has_permission('mading.edit_all') );

-- Posts: published or staff can see; author can see own
create policy "Published posts are public" on public.mading_posts
  for select using (
    status = 'published'
    or author_id = (select auth.uid())
    or public.has_permission('mading.view')
  );

create policy "Authenticated can insert posts" on public.mading_posts
  for insert to authenticated
  with check ( author_id = (select auth.uid()) );

create policy "Owner or staff with edit_all can update" on public.mading_posts
  for update using (
    author_id = (select auth.uid())
    or public.has_permission('mading.edit_all')
  );

create policy "Owner draft or staff with delete can delete" on public.mading_posts
  for delete using (
    (author_id = (select auth.uid()) and status in ('draft', 'rejected'))
    or public.has_permission('mading.delete')
  );

-- Reviews: staff reviewer and post author can read
create policy "Review visible to reviewer or author" on public.mading_reviews
  for select using (
    post_id in (
      select p.id from public.mading_posts p
      where p.author_id = (select auth.uid())
    )
    or public.has_permission('mading.review')
  );
create policy "Reviewer can insert reviews" on public.mading_reviews
  for insert to authenticated
  with check ( public.has_permission('mading.review') );

-- Guards for mading workflow
create or replace function public.guard_mading_post_insert()
returns trigger as $$
declare
  v_role text;
begin
  select role into v_role from public.profiles where id = (select auth.uid());
  if v_role is null then
    raise exception 'Unauthorized';
  end if;
  if v_role = 'student' then
    if new.author_id is distinct from (select auth.uid()) then
      raise exception 'Tidak dapat membuat karya atas nama orang lain';
    end if;
    if new.status = 'published' then
      raise exception 'Siswa tidak dapat publish langsung';
    end if;
    if new.status not in ('draft', 'pending_review') then
      new.status := 'draft';
    end if;
  else
    if new.status = 'published' and not public.has_permission('mading.publish') then
      raise exception 'Tidak memiliki izin publish';
    end if;
  end if;
  if new.status = 'published' and new.published_at is null then
    new.published_at := now();
  end if;
  return new;
end;
$$ language plpgsql security definer
set search_path = pg_catalog, public, pg_temp;

create or replace function public.guard_mading_post_update()
returns trigger as $$
declare
  v_role text;
begin
  select role into v_role from public.profiles where id = (select auth.uid());
  if v_role is null then
    raise exception 'Unauthorized';
  end if;
  if v_role = 'student' then
    if new.author_id is distinct from old.author_id then
      raise exception 'Tidak dapat mengubah pemilik karya';
    end if;
    if old.status not in ('draft', 'rejected') then
      raise exception 'Karya sudah dalam review atau terbit';
    end if;
    if new.status in ('published', 'approved') then
      raise exception 'Siswa tidak dapat publish';
    end if;
    if new.status not in ('draft', 'pending_review', 'rejected') then
      new.status := 'draft';
    end if;
  else
    if new.author_id is distinct from old.author_id and not public.has_permission('mading.edit_all') then
      raise exception 'Tidak dapat mengubah pemilik karya';
    end if;
    if new.status = 'published' and not public.has_permission('mading.publish') then
      raise exception 'Tidak memiliki izin publish';
    end if;
  end if;
  if new.status = 'published' and new.published_at is null then
    new.published_at := now();
  end if;
  if new.status <> 'published' then
    new.published_at := null;
  end if;
  return new;
end;
$$ language plpgsql security definer
set search_path = pg_catalog, public, pg_temp;

drop trigger if exists guard_mading_post_insert on public.mading_posts;
create trigger guard_mading_post_insert
  before insert on public.mading_posts
  for each row execute function public.guard_mading_post_insert();

drop trigger if exists guard_mading_post_update on public.mading_posts;
create trigger guard_mading_post_update
  before update on public.mading_posts
  for each row execute function public.guard_mading_post_update();

-- RPC: submit for review
create or replace function public.submit_mading_post(p_post_id uuid)
returns void as $$
declare
  v_role text;
begin
  select role into v_role from public.profiles where id = (select auth.uid());
  if v_role is null then
    raise exception 'Unauthorized';
  end if;
  update public.mading_posts
    set status = 'pending_review', updated_at = now()
    where id = p_post_id
      and (
        author_id = (select auth.uid())
        or public.has_permission('mading.submit_review')
      );
  if not found then
    raise exception 'Karya tidak ditemukan atau tidak diizinkan';
  end if;
end;
$$ language plpgsql security definer
set search_path = pg_catalog, public, pg_temp;

-- RPC: review post (approve/reject)
create or replace function public.review_mading_post(
  p_post_id uuid,
  p_action text,
  p_feedback text default ''
)
returns void as $$
declare
  v_next_status text;
begin
  if not public.has_permission('mading.review') then
    raise exception 'Tidak memiliki izin review';
  end if;
  v_next_status := case when p_action = 'approve' then 'approved' else 'rejected' end;
  update public.mading_posts
    set status = v_next_status,
        feedback = case when p_action = 'reject' then p_feedback else '' end,
        updated_at = now()
    where id = p_post_id;
  insert into public.mading_reviews (post_id, reviewer_id, reviewer_name, action, feedback)
  select p_post_id, (select auth.uid()),
    coalesce((select name from public.profiles where id = (select auth.uid())), ''),
    p_action, p_feedback;
end;
$$ language plpgsql security definer
set search_path = pg_catalog, public, pg_temp;

-- RPC: publish approved post
create or replace function public.publish_mading_post(p_post_id uuid)
returns void as $$
begin
  if not public.has_permission('mading.publish') then
    raise exception 'Tidak memiliki izin publish';
  end if;
  update public.mading_posts
    set status = 'published', published_at = now(), updated_at = now()
    where id = p_post_id;
end;
$$ language plpgsql security definer
set search_path = pg_catalog, public, pg_temp;

-- ============================================================
-- STUDENT ACCOUNT
-- ============================================================
create table if not exists public.students (
  id uuid default gen_random_uuid() primary key references auth.users(id) on delete cascade,
  nisn text not null unique,
  name text not null default '',
  class text not null default '',
  major text not null default '',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists public.student_accounts (
  id uuid default gen_random_uuid() primary key references auth.users(id) on delete cascade,
  student_id uuid references public.students(id) on delete cascade not null,
  email text not null unique,
  status text not null default 'active',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.students enable row level security;
alter table public.student_accounts enable row level security;

create policy "Students see own or staff" on public.students
  for select using (
    id = (select auth.uid())
    or public.has_permission('mading.view')
  );
create policy "Students can update own profile" on public.students
  for update using ( id = (select auth.uid()) );
create policy "Staff can insert students" on public.students
  for insert with check ( public.has_permission('mading.edit_all') );
create policy "Staff can delete students" on public.students
  for delete using ( public.has_permission('mading.edit_all') );

create policy "Student accounts see own or staff" on public.student_accounts
  for select using (
    id = (select auth.uid())
    or public.has_permission('mading.view')
  );
create policy "Staff can insert student accounts" on public.student_accounts
  for insert with check ( public.has_permission('mading.edit_all') );
create policy "Staff can update student accounts" on public.student_accounts
  for update using ( public.has_permission('mading.edit_all') );
create policy "Staff can delete student accounts" on public.student_accounts
  for delete using ( public.has_permission('mading.edit_all') );

-- RPC: create student account (NISN + PIN). PIN is hashed with bcrypt via pgcrypto.
create or replace function public.admin_create_student(
  p_nisn text,
  p_name text,
  p_class text,
  p_major text,
  p_pin text
)
returns uuid as $$
declare
  v_id uuid := gen_random_uuid();
  v_email text := 'nisn-' || p_nisn || '@mading.smkn11.sch.id';
begin
  if not public.has_permission('mading.edit_all') then
    raise exception 'Tidak memiliki izin';
  end if;
  if p_nisn is null or length(trim(p_nisn)) < 4 then
    raise exception 'NISN tidak valid';
  end if;
  if p_pin is null or length(p_pin) < 4 then
    raise exception 'PIN minimal 4 karakter';
  end if;
  insert into auth.users (id, email, password, email_verified, profile)
  values (v_id, v_email, crypt(p_pin, gen_salt('bf', 10)), true,
          jsonb_build_object('name', p_name));
  update public.profiles set role = 'student', name = p_name where id = v_id;
  insert into public.students (id, nisn, name, class, major)
  values (v_id, trim(p_nisn), p_name, p_class, p_major);
  insert into public.student_accounts (id, student_id, email)
  values (v_id, v_id, v_email);
  return v_id;
end;
$$ language plpgsql security definer
set search_path = pg_catalog, public, pg_temp;

-- RPC: reset student PIN
create or replace function public.admin_reset_student_pin(p_student_id uuid, p_new_pin text)
returns void as $$
begin
  if not public.has_permission('mading.edit_all') then
    raise exception 'Tidak memiliki izin';
  end if;
  if p_new_pin is null or length(p_new_pin) < 4 then
    raise exception 'PIN minimal 4 karakter';
  end if;
  update auth.users set password = crypt(p_new_pin, gen_salt('bf', 10))
  where id = p_student_id;
end;
$$ language plpgsql security definer
set search_path = pg_catalog, public, pg_temp;

-- RPC: resolve NISN to student login email (for login page, anon-safe)
create or replace function public.get_student_login_email(p_nisn text)
returns text as $$
declare
  v_email text;
begin
  select email into v_email from public.student_accounts
  where student_id in (select id from public.students where nisn = trim(p_nisn))
  limit 1;
  return v_email;
end;
$$ language plpgsql security definer
set search_path = pg_catalog, public, pg_temp;

-- Indexes
create index if not exists idx_mading_posts_author on public.mading_posts(author_id);
create index if not exists idx_mading_posts_status on public.mading_posts(status);
create index if not exists idx_mading_posts_category on public.mading_posts(category_id);
create index if not exists idx_mading_reviews_post on public.mading_reviews(post_id);
create index if not exists idx_students_nisn on public.students(nisn);
create index if not exists idx_kesemaptaan_activities_status on public.kesemaptaan_activities(status);

-- Seed default Mading categories
insert into public.mading_categories (slug, name, sort_order) values
  ('puisi', 'Puisi', 1),
  ('cerpen', 'Cerpen', 2),
  ('artikel', 'Artikel', 3),
  ('pantun', 'Pantun', 4),
  ('esai', 'Esai', 5),
  ('opini', 'Opini', 6),
  ('edukasi', 'Edukasi', 7),
  ('teknologi', 'Teknologi', 8),
  ('motivasi', 'Motivasi', 9),
  ('karya-kreatif', 'Karya Kreatif', 10),
  ('lainnya', 'Lainnya', 11)
on conflict (slug) do nothing;
