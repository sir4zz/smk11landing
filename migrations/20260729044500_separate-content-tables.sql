-- Create dedicated tables for each admin section

create table if not exists public.news (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  slug text not null unique,
  date date not null default current_date,
  excerpt text not null default '',
  content text not null default '',
  thumbnail text not null default '',
  category text not null default '',
  author text not null default '',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists public.programs (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  slug text not null unique,
  short_name text not null default '',
  icon text not null default '',
  image text not null default '',
  description text not null default '',
  short_description text not null default '',
  competencies jsonb not null default '[]',
  career_prospects jsonb not null default '[]',
  facilities jsonb not null default '[]',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists public.facilities (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text not null default '',
  category text not null default '',
  photo text not null default '',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists public.staff (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  position text not null default '',
  department text not null default '',
  photo text not null default '',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists public.achievements (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  event text not null default '',
  year integer not null default extract(year from now()),
  level text not null default '',
  rank text not null default '',
  students jsonb not null default '[]',
  photo text not null default '',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Migrate existing data from content_records
insert into public.news (id, title, slug, date, excerpt, content, thumbnail, category, author)
select
  gen_random_uuid(),
  coalesce(data->>'title', ''),
  coalesce(data->>'slug', ''),
  coalesce((data->>'date')::date, current_date),
  coalesce(data->>'excerpt', ''),
  coalesce(data->>'content', ''),
  coalesce(data->>'thumbnail', ''),
  coalesce(data->>'category', ''),
  coalesce(data->>'author', '')
from public.content_records
where content_type = 'news'
on conflict (slug) do nothing;

insert into public.programs (id, name, slug, short_name, icon, image, description, short_description, competencies, career_prospects, facilities)
select
  gen_random_uuid(),
  coalesce(data->>'name', ''),
  coalesce(data->>'slug', ''),
  coalesce(data->>'shortName', ''),
  coalesce(data->>'icon', ''),
  coalesce(data->>'image', ''),
  coalesce(data->>'description', ''),
  coalesce(data->>'shortDescription', ''),
  coalesce(data->'competencies', '[]'::jsonb),
  coalesce(data->'careerProspects', '[]'::jsonb),
  coalesce(data->'facilities', '[]'::jsonb)
from public.content_records
where content_type = 'programs'
on conflict (slug) do nothing;

insert into public.facilities (id, name, description, category, photo)
select
  gen_random_uuid(),
  coalesce(data->>'name', ''),
  coalesce(data->>'description', ''),
  coalesce(data->>'category', ''),
  coalesce(data->>'photo', '')
from public.content_records
where content_type = 'facilities';

insert into public.staff (id, name, position, department, photo)
select
  gen_random_uuid(),
  coalesce(data->>'name', ''),
  coalesce(data->>'position', ''),
  coalesce(data->>'department', ''),
  coalesce(data->>'photo', '')
from public.content_records
where content_type = 'staff';

insert into public.achievements (id, title, event, year, level, rank, students, photo)
select
  gen_random_uuid(),
  coalesce(data->>'title', ''),
  coalesce(data->>'event', ''),
  coalesce((data->>'year')::integer, extract(year from now())::integer),
  coalesce(data->>'level', ''),
  coalesce(data->>'rank', ''),
  coalesce(data->'students', '[]'::jsonb),
  coalesce(data->>'photo', '')
from public.content_records
where content_type = 'achievements';

-- RLS policies
alter table public.news enable row level security;
alter table public.programs enable row level security;
alter table public.facilities enable row level security;
alter table public.staff enable row level security;
alter table public.achievements enable row level security;

create policy "Content is public" on public.news for select using ( true );
create policy "Content is public" on public.programs for select using ( true );
create policy "Content is public" on public.facilities for select using ( true );
create policy "Content is public" on public.staff for select using ( true );
create policy "Content is public" on public.achievements for select using ( true );

create policy "Admins can insert" on public.news for insert with check ( public.is_admin() );
create policy "Admins can insert" on public.programs for insert with check ( public.is_admin() );
create policy "Admins can insert" on public.facilities for insert with check ( public.is_admin() );
create policy "Admins can insert" on public.staff for insert with check ( public.is_admin() );
create policy "Admins can insert" on public.achievements for insert with check ( public.is_admin() );

create policy "Admins can update" on public.news for update using ( public.is_admin() );
create policy "Admins can update" on public.programs for update using ( public.is_admin() );
create policy "Admins can update" on public.facilities for update using ( public.is_admin() );
create policy "Admins can update" on public.staff for update using ( public.is_admin() );
create policy "Admins can update" on public.achievements for update using ( public.is_admin() );

create policy "Admins can delete" on public.news for delete using ( public.is_admin() );
create policy "Admins can delete" on public.programs for delete using ( public.is_admin() );
create policy "Admins can delete" on public.facilities for delete using ( public.is_admin() );
create policy "Admins can delete" on public.staff for delete using ( public.is_admin() );
create policy "Admins can delete" on public.achievements for delete using ( public.is_admin() );
