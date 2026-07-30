create trigger spmb_content_updated_at
  before update on public.spmb_content
  for each row
  execute function system.update_updated_at();
