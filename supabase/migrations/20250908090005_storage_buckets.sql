-- TCUnnect: 005_storage_buckets.sql
-- Run this AFTER the storage extension is available (default in Supabase).

insert into storage.buckets (id, name, public)
values
  ('profile-photos', 'profile-photos', true),   -- public: shown in Discover, safe to expose
  ('verification-docs', 'verification-docs', false), -- PRIVATE: ID photos + selfies, never public
  ('feed-photos', 'feed-photos', true)           -- public: anonymous feed images (no identity attached anyway)
on conflict (id) do nothing;

-- Profile photos: anyone can view (public bucket), only the owner can upload/replace their own
create policy "anyone can view profile photos"
  on storage.objects for select
  using (bucket_id = 'profile-photos');

create policy "users can upload their own profile photo"
  on storage.objects for insert
  with check (
    bucket_id = 'profile-photos'
    and (storage.foldername(name))[1] = current_app_user_id()::text
  );

-- Verification docs: PRIVATE. Only the uploader and admins can read them.
-- No public select policy exists at all for this bucket — access is only
-- via signed URLs generated server-side for the admin review UI.
create policy "users can upload their own verification docs"
  on storage.objects for insert
  with check (
    bucket_id = 'verification-docs'
    and (storage.foldername(name))[1] = current_app_user_id()::text
  );

create policy "users can view their own verification docs"
  on storage.objects for select
  using (
    bucket_id = 'verification-docs'
    and (storage.foldername(name))[1] = current_app_user_id()::text
  );

create policy "admins can view all verification docs"
  on storage.objects for select
  using (bucket_id = 'verification-docs' and is_admin());

-- Feed photos: public read (posts are public to verified users anyway),
-- but uploads are rate-limited at the application layer, not here.
create policy "anyone can view feed photos"
  on storage.objects for select
  using (bucket_id = 'feed-photos');

create policy "verified users can upload feed photos"
  on storage.objects for insert
  with check (
    bucket_id = 'feed-photos'
    and exists (select 1 from users u where u.auth_id = auth.uid() and u.is_verified)
  );
