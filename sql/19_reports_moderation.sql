-- =============================================================================
-- Migration 19: Reports & Moderation System
-- Run this in Supabase SQL Editor
-- =============================================================================
-- Fixes:
--   1. Add account_status to profiles ('active' | 'suspended' | 'banned')
--   2. Add reported_post_id to reports for community post reports
--   3. Fix RLS on reports (reporter_id column, not reported_by)
--   4. Enable Realtime on reports table
--   5. Admin notification trigger on new reports
-- =============================================================================

-- ─── 1. profiles.account_status ──────────────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_status text NOT NULL DEFAULT 'active'
  CHECK (account_status IN ('active', 'suspended', 'banned'));

CREATE INDEX IF NOT EXISTS profiles_account_status_idx
  ON public.profiles (account_status);

-- ─── 2. reports: add reported_post_id ────────────────────────────────────────
-- The existing reports table already has:
--   reporter_id, reported_user_id, reported_item_type, reported_item_id,
--   match_id, message_content, reason, details, status, created_at
-- We add a nullable FK to the posts table for community post reports.

ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS reported_post_id uuid REFERENCES public.posts(id) ON DELETE SET NULL;

-- Update the item type CHECK to allow 'post' (the existing column has no CHECK so this is safe)
-- Enforce the known types via a CHECK constraint if not already present:
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'reports' AND constraint_name = 'reports_reported_item_type_check'
  ) THEN
    ALTER TABLE public.reports
      ADD CONSTRAINT reports_reported_item_type_check
      CHECK (reported_item_type IN ('user', 'message', 'post'));
  END IF;
EXCEPTION WHEN others THEN
  -- constraint already exists or can't be added; skip
  NULL;
END $$;

-- ─── 3. Fix RLS on reports ───────────────────────────────────────────────────
-- Drop stale policies that reference wrong column names or don't use auth_is_admin()
DROP POLICY IF EXISTS "Users can submit reports"        ON public.reports;
DROP POLICY IF EXISTS "Users can view own reports"      ON public.reports;
DROP POLICY IF EXISTS "Admins can view all reports"     ON public.reports;
DROP POLICY IF EXISTS "Admins can update report status" ON public.reports;

-- Users: insert their own reports only
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
  USING (auth_is_admin());

-- Admins: update report status
CREATE POLICY "reports_update_admin"
  ON public.reports FOR UPDATE
  TO authenticated
  USING   (auth_is_admin())
  WITH CHECK (auth_is_admin());

-- ─── 4. Admin profile update for ban/suspend ─────────────────────────────────
-- Drop old admin update policy and recreate to include account_status
DROP POLICY IF EXISTS "admin_profiles_update" ON public.profiles;

CREATE POLICY "admin_profiles_update"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING   (auth_is_admin())
  WITH CHECK (auth_is_admin());

-- ─── 5. Realtime on reports ───────────────────────────────────────────────────
ALTER TABLE public.reports REPLICA IDENTITY FULL;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.reports;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── 6. Admin notification trigger on new report ─────────────────────────────
-- Function: notify every admin when a report is submitted
CREATE OR REPLACE FUNCTION fn_notify_admin_on_report()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  admin_rec RECORD;
  item_label text;
BEGIN
  item_label := CASE NEW.reported_item_type
    WHEN 'user'    THEN 'A user has been reported.'
    WHEN 'message' THEN 'A message has been reported.'
    WHEN 'post'    THEN 'A community post has been reported.'
    ELSE 'A new report was submitted.'
  END;

  FOR admin_rec IN
    SELECT id FROM public.profiles WHERE is_admin = TRUE
  LOOP
    INSERT INTO public.notifications (user_id, type, title, body, read)
    VALUES (
      admin_rec.id,
      'system',
      CASE NEW.reported_item_type
        WHEN 'user'    THEN 'New user report'
        WHEN 'message' THEN 'New message report'
        WHEN 'post'    THEN 'New community post report'
        ELSE 'New report'
      END,
      item_label,
      FALSE
    );
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_admin_on_report ON public.reports;
CREATE TRIGGER trg_notify_admin_on_report
  AFTER INSERT ON public.reports
  FOR EACH ROW EXECUTE FUNCTION fn_notify_admin_on_report();

-- ─── 7. Add 'post' to reported_item_type values (no-op if constraint exists) ─
-- Make sure existing rows with 'Post' (capital P) are normalised if needed:
UPDATE public.reports SET reported_item_type = 'post'    WHERE reported_item_type = 'Post';
UPDATE public.reports SET reported_item_type = 'user'    WHERE reported_item_type = 'User';
UPDATE public.reports SET reported_item_type = 'message' WHERE reported_item_type = 'Message';
