-- Add image_url and image_source columns to gem_content_items
-- image_url: URL of the photo for the place card
-- image_source: attribution link/text so the uploader can credit the photo source

ALTER TABLE public.gem_content_items
  ADD COLUMN IF NOT EXISTS image_url    text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS image_source text DEFAULT NULL;
