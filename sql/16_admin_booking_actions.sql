-- =============================================================================
-- Migration 16: Admin booking UPDATE policy + booking user_id index
-- Run this in Supabase SQL Editor
-- =============================================================================

-- ─── 1. Admin can UPDATE bookings (change status) ────────────────────────────
DROP POLICY IF EXISTS "admin_bookings_update" ON public.bookings;

CREATE POLICY "admin_bookings_update"
  ON public.bookings FOR UPDATE
  TO authenticated
  USING   (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- ─── 2. Enable realtime on bookings (so MyBookings updates live) ─────────────
-- Supabase requires the table to be in the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;

-- ─── 3. Index to speed up user lookups on bookings ───────────────────────────
CREATE INDEX IF NOT EXISTS bookings_user_id_idx ON public.bookings (user_id);
CREATE INDEX IF NOT EXISTS bookings_status_idx  ON public.bookings (status);
