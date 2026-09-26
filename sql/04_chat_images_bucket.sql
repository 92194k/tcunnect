-- ═══════════════════════════════════════════════════════════════════════════
-- TCUnnect · Migration 04 · Chat Images Storage Bucket
-- Run in Supabase SQL Editor  OR  create the bucket via Dashboard → Storage
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Create the bucket (skip if it already exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-images', 'chat-images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. RLS policies for chat-images
--    Only Plus users (is_premium = true) can upload
--    Everyone can read (so recipients can see the photos)

CREATE POLICY "Plus users can upload chat images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'chat-images'
    AND auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_premium = true
    )
  );

CREATE POLICY "Anyone authenticated can read chat images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'chat-images' AND auth.uid() IS NOT NULL);

-- Users can delete their own uploads
CREATE POLICY "Users can delete own chat images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'chat-images' AND auth.uid()::text = (storage.foldername(name))[2]);
