-- Public 'photos' bucket: anyone can read, signed-in admins can upload/manage
-- Used by the admin bulk-import feature to upload staff/activity photos.

create policy "Photos are public"
  on storage.objects for select
  to anon, authenticated
  using (bucket = 'photos');

create policy "Admins can upload photos"
  on storage.objects for insert
  to authenticated
  with check (bucket = 'photos' and uploaded_by = (select auth.jwt() ->> 'sub'));

create policy "Admins can update photos"
  on storage.objects for update
  to authenticated
  using (bucket = 'photos' and uploaded_by = (select auth.jwt() ->> 'sub'))
  with check (bucket = 'photos' and uploaded_by = (select auth.jwt() ->> 'sub'));

create policy "Admins can delete photos"
  on storage.objects for delete
  to authenticated
  using (bucket = 'photos' and uploaded_by = (select auth.jwt() ->> 'sub'));

grant select on storage.objects to anon;
grant select, insert, update, delete on storage.objects to authenticated;
grant usage on schema storage to anon, authenticated;
