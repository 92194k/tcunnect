-- =============================================================================
-- Migration 18: Destination Content Items
-- Run this in Supabase SQL Editor
-- =============================================================================
-- Stores dynamic discovery content for each hidden gem / destination.
-- One table with a `section` discriminator keeps the schema simple and
-- avoids six separate unrelated tables.
--
-- Sections:
--   places      → Places to Visit
--   activities  → Things to Do
--   food        → Food & Drinks
--   products    → Products & Local Finds
--   stays       → Where to Stay
--   experiences → Experiences

CREATE TABLE IF NOT EXISTS public.gem_content_items (
  id            uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  gem_id        uuid    NOT NULL REFERENCES public.hidden_gems(id) ON DELETE CASCADE,

  -- Section discriminator
  section       text    NOT NULL
                CHECK (section IN ('places','activities','food','products','stays','experiences')),

  -- Display order within section (ascending)
  sort_order    integer NOT NULL DEFAULT 0,

  -- Common fields (every item has these)
  name          text    NOT NULL DEFAULT '',
  description   text    NOT NULL DEFAULT '',

  -- Places to Visit
  distance      text,         -- e.g. "1.5 km"
  tag           text,         -- e.g. "🌅 Sunset Spot"

  -- Things to Do
  duration      text,         -- e.g. "3–4 hrs"

  -- Food & Drinks / stays / experiences share: category_label, price_range
  category_label text,        -- e.g. "Seafood Grill", "Glamping"
  price_range    text,        -- e.g. "₱300–₱600 / person", "From ₱2,500/night"

  -- Products & Local Finds
  seller        text,         -- e.g. "Bayside Tiangge"

  -- Experiences
  action_type   text
                CHECK (action_type IS NULL OR action_type IN
                  ('Book Now','Inquire','View Details','Get Directions')),

  created_at    timestamptz NOT NULL DEFAULT now()
);

-- ─── Indexes ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS gem_content_items_gem_id_idx
  ON public.gem_content_items (gem_id);

CREATE INDEX IF NOT EXISTS gem_content_items_gem_section_idx
  ON public.gem_content_items (gem_id, section, sort_order);

-- ─── Row Level Security ───────────────────────────────────────────────────────
ALTER TABLE public.gem_content_items ENABLE ROW LEVEL SECURITY;

-- Public can read content for approved gems
CREATE POLICY "gem_content_select_public"
  ON public.gem_content_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.hidden_gems
      WHERE hidden_gems.id = gem_content_items.gem_id
        AND hidden_gems.status = 'approved'
    )
  );

-- Admins can also select content for any gem (including pending/rejected)
CREATE POLICY "gem_content_select_admin"
  ON public.gem_content_items FOR SELECT
  TO authenticated
  USING (auth_is_admin());

-- Only admins can insert
CREATE POLICY "gem_content_insert_admin"
  ON public.gem_content_items FOR INSERT
  TO authenticated
  WITH CHECK (auth_is_admin());

-- Only admins can update
CREATE POLICY "gem_content_update_admin"
  ON public.gem_content_items FOR UPDATE
  TO authenticated
  USING   (auth_is_admin())
  WITH CHECK (auth_is_admin());

-- Only admins can delete
CREATE POLICY "gem_content_delete_admin"
  ON public.gem_content_items FOR DELETE
  TO authenticated
  USING (auth_is_admin());

-- ─── Realtime ─────────────────────────────────────────────────────────────────
ALTER TABLE public.gem_content_items REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.gem_content_items;
