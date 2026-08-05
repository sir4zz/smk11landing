-- Add source metadata columns to the news table so imported (URL) news
-- can be distinguished from manually-written (own) news.
alter table public.news
  add column if not exists source_type text not null default 'manual',
  add column if not exists source_label text not null default 'Berita mandiri',
  add column if not exists source_note text not null default '',
  add column if not exists source_url text not null default '';
