-- =============================================================================
-- Migration 21: Reports & Moderation — Complete Definitive Fix
-- Safe to run multiple times (fully idempotent).
-- Run this in Supabase SQL Editor → New Query.
-- Supersedes migrations 19 and 20.
-- =============================================================================

-- ─── 1. Ensure profiles.account_status exists ─────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_status text NOT NULL DEFAULT 'active';

-- Remove any existing CHECK so we can re-add cleanly
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_account_status_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_account_status_check
  CHECK (account_status IN ('active', 'suspended', 'banned'));

CREATE INDEX IF NOT EXISTS profiles_account_status_idx
  ON public.profiles (account_status);

-- ─── 2. Ensure profiles.is_admin exists (needed for admin-protection guard) ────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

-- ─── 3. Ensure the reports table has all required columns ─────────────────────
-- reported_by (the person who filed the report)
ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS reported_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

-- reported_post_id (FK to posts, for community post reports)
ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS reported_post_id uuid REFERENCES public.posts(id) ON DELETE SET NULL;

-- ─── 4. Fix reported_item_type CHECK constraint ───────────────────────────────
ALTER TABLE public.reports
  DROP CONSTRAINT IF EXISTS reports_reported_item_type_check;

ALTER TABLE public.reports
  ADD CONSTRAINT reports_reported_item_type_check
  CHECK (reported_item_type IN ('user', 'message', 'post'));

-- ─── 5. Normalise existing rows with capitalised item_type ────────────────────
UPDATE public.reports SET reported_item_type = 'post'    WHERE reported_item_type = 'Post';
UPDATE public.reports SET reported_item_type = 'user'    WHERE reported_item_type = 'User';
UPDATE public.reports SET reported_item_type = 'message' WHERE reported_item_type = 'Message';

-- Back-fill reported_by from reporter_id if the old column exists and reported_by is null
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'reports' AND column_name = 'reporter_id'
  ) THEN
    UPDATE public.reports SET reported_by = reporter_id WHERE reported_by IS NULL AND reporter_id IS NOT NULL;
  END IF;
END $$;

-- ─── 6. Enable RLS on reports ─────────────────────────────────────────────────
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Drop ALL possible old policy names (belt-and-suspenders)
DROP POLICY IF EXISTS "Users can submit reports"        ON public.reports;
DROP POLICY IF EXISTS "Users can view own reports"      ON public.reports;
DROP POLICY IF EXISTS "Admins can view all reports"     ON public.reports;
DROP POLICY IF EXISTS "Admins can update report status" ON public.reports;
DROP POLICY IF EXISTS "reports_insert_own"              ON public.reports;
DROP POLICY IF EXISTS "reports_select_own"              ON public.reports;
DROP POLICY IF EXISTS "reports_select_admin"            ON public.reports;
DROP POLICY IF EXISTS "reports_update_admin"            ON public.reports;

-- Users: insert their own reports using reported_by column
CREATE POLICY "reports_insert_own"
  ON public.reports FOR INSERT
  TO authenticated
  WITH CHECK (reported_by = auth.uid());

-- Users: read only their own reports
CREATE POLICY "reports_select_own"
  ON public.reports FOR SELECT
  TO authenticated
  USING (reported_by = auth.uid());

-- Admins: read all reports
CREATE POLICY "reports_select_admin"
  ON public.reports FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Admins: update report status
CREATE POLICY "reports_update_admin"
  ON public.reports FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- ─── 7. Profile update policy (for ban/suspend by admin) ─────────────────────
DROP POLICY IF EXISTS "admin_profiles_update" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Users can update their OWN profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING   (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Admins can update any profile (for suspend/ban)
CREATE POLICY "admin_profiles_update"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- ─── 8. Realtime on reports ───────────────────────────────────────────────────
ALTER TABLE public.reports REPLICA IDENTITY FULL;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.reports;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── 9. Admin notification trigger on new report ──────────────────────────────
CREATE OR REPLACE FUNCTION fn_notify_admin_on_report()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  admin_rec  RECORD;
  item_title text;
  item_body  text;
BEGIN
  CASE NEW.reported_item_type
    WHEN 'user'    THEN
      item_title := 'New user report';
      item_body  := 'A user has been reported for: ' || COALESCE(NEW.reason, 'unspecified reason');
    WHEN 'message' THEN
      item_title := 'New message report';
      item_body  := 'A chat message has been reported for: ' || COALESCE(NEW.reason, 'unspecified reason');
    WHEN 'post'    THEN
      item_title := 'New post report';
      item_body  := 'A community post has been reported for: ' || COALESCE(NEW.reason, 'unspecified reason');
    ELSE
      item_title := 'New report';
      item_body  := 'A new report was submitted.';
  END CASE;

  FOR admin_rec IN
    SELECT id FROM public.profiles WHERE is_admin = true
  LOOP
    INSERT INTO public.notifications (user_id, type, title, body, read)
    VALUES (admin_rec.id, 'system', item_title, item_body, false);
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_admin_on_report ON public.reports;
CREATE TRIGGER trg_notify_admin_on_report
  AFTER INSERT ON public.reports
  FOR EACH ROW EXECUTE FUNCTION fn_notify_admin_on_report();

-- ─── 10. Verify (informational — no-op) ──────────────────────────────────────
-- After running this migration, confirm via:
--   SELECT column_name FROM information_schema.columns
--   WHERE table_name = 'reports' AND table_schema = 'public';
-- You should see: id, reporter_id (old, optional), reported_by, reported_user_id,
--   reported_item_type, reported_item_id, match_id, message_content, reason,
--   details, status, created_at, reported_post_id
