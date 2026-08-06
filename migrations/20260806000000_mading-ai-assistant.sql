-- ============================================================
-- Mading AI Content Assistant: permission + transparency column
-- ============================================================

insert into public.permissions (slug, name, module)
values ('mading.ai_generate', 'Mading - AI Content Assistant', 'mading')
on conflict (slug) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.slug = 'mading.ai_generate'
where r.slug in ('guru', 'osis')
on conflict do nothing;

alter table public.mading_posts
  add column if not exists ai_assisted boolean not null default false;
