-- TCUnnect: 020_report_screenshots_and_content.sql

alter table reports add column screenshot_url text;

insert into storage.buckets (id, name, public)
values ('report-screenshots', 'report-screenshots', false)
on conflict (id) do nothing;

-- Private: only the reporter who uploaded it and admins can view it.
create policy "users can upload their own report screenshots"
  on storage.objects for insert
  with check (
    bucket_id = 'report-screenshots'
    and (storage.foldername(name))[1] = current_app_user_id()::text
  );

create policy "users can view their own report screenshots"
  on storage.objects for select
  using (
    bucket_id = 'report-screenshots'
    and (storage.foldername(name))[1] = current_app_user_id()::text
  );

create policy "admins can view all report screenshots"
  on storage.objects for select
  using (bucket_id = 'report-screenshots' and is_admin());

-- Needed so "Delete" on a message-type report can actually delete the
-- reported message itself, not just the report record.
create policy "admins can delete messages"
  on messages for delete
  using (is_admin());
