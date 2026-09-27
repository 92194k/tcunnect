-- =============================================================================
-- Migration 15: Add GCash & Maya QR Code URL columns to platform_settings
--               + Create platform-assets storage bucket for QR images
-- =============================================================================

-- ─── 1. Add QR URL columns (idempotent) ──────────────────────────────────────
ALTER TABLE platform_settings
  ADD COLUMN IF NOT EXISTS gcash_qr_url TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS maya_qr_url  TEXT NOT NULL DEFAULT '';

-- ─── 2. Create platform-assets bucket (public, for QR codes etc.) ─────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'platform-assets',
  'platform-assets',
  true,
  5242880,  -- 5 MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public             = EXCLUDED.public,
  file_size_limit    = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ─── 3. Storage RLS for platform-assets ──────────────────────────────────────
DROP POLICY IF EXISTS "Platform assets are publicly viewable" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload platform assets"     ON storage.objects;
DROP POLICY IF EXISTS "Admins can update platform assets"     ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete platform assets"     ON storage.objects;

CREATE POLICY "Platform assets are publicly viewable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'platform-assets');

CREATE POLICY "Admins can upload platform assets"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'platform-assets'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

CREATE POLICY "Admins can update platform assets"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'platform-assets'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

CREATE POLICY "Admins can delete platform assets"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'platform-assets'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );
