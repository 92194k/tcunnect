-- Add is_featured flag to individual content items inside destinations/gems
-- Independent of the gem-level is_featured on hidden_gems table

ALTER TABLE gem_content_items
  ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;
