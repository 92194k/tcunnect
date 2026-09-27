-- =============================================================================
-- Migration 14: Avatars Storage Bucket
-- Run this in Supabase SQL Editor
-- =============================================================================

-- ─── 1. Create the avatars storage bucket (public) ───────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,          -- public so we can use getPublicUrl() without signed URLs
  5242880,       -- 5 MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public              = EXCLUDED.public,
  file_size_limit     = EXCLUDED.file_size_limit,
  allowed_mime_types  = EXCLUDED.allowed_mime_types;

-- ─── 2. Storage RLS policies ─────────────────────────────────────────────────

-- Drop old policies if they exist (idempotent)
DROP POLICY IF EXISTS "Avatar images are publicly viewable"  ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar"    ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar"    ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar"    ON storage.objects;

-- Anyone can VIEW avatars (bucket is public, but RLS still needs a policy)
CREATE POLICY "Avatar images are publicly viewable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- Authenticated users can UPLOAD to their own folder: avatars/<user_id>/<filename>
CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Authenticated users can UPDATE (replace) their own avatar
CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Authenticated users can DELETE their own avatar
CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
