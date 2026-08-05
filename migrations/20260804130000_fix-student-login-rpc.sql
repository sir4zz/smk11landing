create or replace function public.get_student_login_email(p_nisn text)
returns text as $$
declare
  v_email text;
begin
  select au.email into v_email
  from public.students s
  join public.student_accounts sa on sa.student_id = s.id
  join auth.users au on au.id = sa.id
  where trim(s.nisn) = trim(p_nisn)
  limit 1;
  return v_email;
end;
$$ language plpgsql security definer
set search_path = pg_catalog, public, pg_temp;
