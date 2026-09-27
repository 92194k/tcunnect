-- =============================================================================
-- Migration 17: Reviews & Moderation
-- Run this in Supabase SQL Editor
-- =============================================================================

-- ─── 1. Create reviews table ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.reviews (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  booking_id   uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  gem_id       text NOT NULL,        -- matches bookings.gem_id (text)
  gem_name     text NOT NULL,
  rating       integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text  text NOT NULL CHECK (char_length(trim(review_text)) >= 10),
  status       text NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- One review per booking (prevents duplicates)
CREATE UNIQUE INDEX IF NOT EXISTS reviews_booking_id_unique ON public.reviews (booking_id);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS reviews_gem_id_idx    ON public.reviews (gem_id);
CREATE INDEX IF NOT EXISTS reviews_user_id_idx   ON public.reviews (user_id);
CREATE INDEX IF NOT EXISTS reviews_status_idx    ON public.reviews (status);

-- ─── 2. Enable RLS ───────────────────────────────────────────────────────────
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Public can read approved reviews
CREATE POLICY "reviews_select_approved"
  ON public.reviews FOR SELECT
  USING (status = 'approved');

-- Authenticated users can also see their own reviews (any status)
CREATE POLICY "reviews_select_own"
  ON public.reviews FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can insert a review only if they own the completed booking
CREATE POLICY "reviews_insert_own"
  ON public.reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.bookings
      WHERE bookings.id   = reviews.booking_id
        AND bookings.user_id = auth.uid()
        AND bookings.status  = 'completed'
    )
  );

-- Only admins can update reviews (change moderation status)
CREATE POLICY "reviews_admin_update"
  ON public.reviews FOR UPDATE
  TO authenticated
  USING   (auth_is_admin())
  WITH CHECK (auth_is_admin());

-- Only admins can delete reviews
CREATE POLICY "reviews_admin_delete"
  ON public.reviews FOR DELETE
  TO authenticated
  USING (auth_is_admin());

-- ─── 3. Enable realtime on reviews ───────────────────────────────────────────
ALTER TABLE public.reviews REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reviews;

-- ─── 4. Trigger: auto-update hidden_gems.rating and review_count ─────────────
CREATE OR REPLACE FUNCTION fn_update_gem_rating()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_gem_id text;
BEGIN
  -- Determine which gem was affected
  IF TG_OP = 'DELETE' THEN
    v_gem_id := OLD.gem_id;
  ELSE
    v_gem_id := NEW.gem_id;
  END IF;

  -- Recalculate from approved reviews only
  UPDATE public.hidden_gems
  SET
    rating       = COALESCE((
      SELECT ROUND(AVG(r.rating)::numeric, 1)
      FROM public.reviews r
      WHERE r.gem_id = v_gem_id AND r.status = 'approved'
    ), 0),
    review_count = (
      SELECT COUNT(*)
      FROM public.reviews r
      WHERE r.gem_id = v_gem_id AND r.status = 'approved'
    )
  WHERE id::text = v_gem_id;

  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_gem_rating ON public.reviews;
CREATE TRIGGER trg_update_gem_rating
  AFTER INSERT OR UPDATE OF status OR DELETE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION fn_update_gem_rating();
