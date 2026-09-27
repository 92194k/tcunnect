-- =============================================================================
-- Migration 20: Reports & Moderation — Final Clean Fix
-- Safe to run even if migration 19 was already run (fully idempotent).
-- Run this in Supabase SQL Editor.
-- =============================================================================

-- ─── 1. profiles.account_status ──────────────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_status text NOT NULL DEFAULT 'active'
  CHECK (account_status IN ('active', 'suspended', 'banned'));

CREATE INDEX IF NOT EXISTS profiles_account_status_idx
  ON public.profiles (account_status);

-- ─── 2. reports: add reported_post_id (FK to posts) ─────────────────────────
ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS reported_post_id uuid
  REFERENCES public.posts(id) ON DELETE SET NULL;

-- ─── 3. reported_item_type constraint — drop old, add new ───────────────────
-- Drop existing constraint (it may not include 'post')
ALTER TABLE public.reports
  DROP CONSTRAINT IF EXISTS reports_reported_item_type_check;

-- Add constraint that includes all three types
ALTER TABLE public.reports
  ADD CONSTRAINT reports_reported_item_type_check
  CHECK (reported_item_type IN ('user', 'message', 'post'));

-- ─── 4. RLS on reports — drop every possible policy name, recreate clean ─────
DROP POLICY IF EXISTS "Users can submit reports"        ON public.reports;
DROP POLICY IF EXISTS "Users can view own reports"      ON public.reports;
DROP POLICY IF EXISTS "Admins can view all reports"     ON public.reports;
DROP POLICY IF EXISTS "Admins can update report status" ON public.reports;
DROP POLICY IF EXISTS "reports_insert_own"              ON public.reports;
DROP POLICY IF EXISTS "reports_select_own"              ON public.reports;
DROP POLICY IF EXISTS "reports_select_admin"            ON public.reports;
DROP POLICY IF EXISTS "reports_update_admin"            ON public.reports;

-- Make sure RLS is enabled
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Users: can insert their own reports
CREATE POLICY "reports_insert_own"
  ON public.reports FOR INSERT
  TO authenticated
  WITH CHECK (reported_by = auth.uid());

-- Users: can read only their own reports
CREATE POLICY "reports_select_own"
  ON public.reports FOR SELECT
  TO authenticated
  USING (reported_by = auth.uid());

-- Admins: can read all reports
CREATE POLICY "reports_select_admin"
  ON public.reports FOR SELECT
  TO authenticated
  USING (auth_is_admin());

-- Admins: can update report status
CREATE POLICY "reports_update_admin"
  ON public.reports FOR UPDATE
  TO authenticated
  USING   (auth_is_admin())
  WITH CHECK (auth_is_admin());

-- ─── 5. Profile update policy (for ban/suspend) ───────────────────────────────
DROP POLICY IF EXISTS "admin_profiles_update" ON public.profiles;

CREATE POLICY "admin_profiles_update"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING   (auth_is_admin())
  WITH CHECK (auth_is_admin());

-- ─── 6. Realtime on reports ───────────────────────────────────────────────────
ALTER TABLE public.reports REPLICA IDENTITY FULL;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.reports;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── 7. Admin notification trigger ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION fn_notify_admin_on_report()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  admin_rec  RECORD;
  item_label text;
  item_title text;
BEGIN
  CASE NEW.reported_item_type
    WHEN 'user'    THEN
      item_title := 'New user report';
      item_label := 'A user has been reported for: ' || COALESCE(NEW.reason, 'unspecified reason');
    WHEN 'message' THEN
      item_title := 'New message report';
      item_label := 'A chat message has been reported for: ' || COALESCE(NEW.reason, 'unspecified reason');
    WHEN 'post'    THEN
      item_title := 'New post report';
      item_label := 'A community post has been reported for: ' || COALESCE(NEW.reason, 'unspecified reason');
    ELSE
      item_title := 'New report';
      item_label := 'A new report was submitted.';
  END CASE;

  FOR admin_rec IN
    SELECT id FROM public.profiles WHERE is_admin = TRUE
  LOOP
    INSERT INTO public.notifications (user_id, type, title, body, read)
    VALUES (admin_rec.id, 'system', item_title, item_label, FALSE);
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_admin_on_report ON public.reports;
CREATE TRIGGER trg_notify_admin_on_report
  AFTER INSERT ON public.reports
  FOR EACH ROW EXECUTE FUNCTION fn_notify_admin_on_report();

-- ─── 8. Normalise any existing rows with capitalised item_type ────────────────
UPDATE public.reports SET reported_item_type = 'post'    WHERE reported_item_type = 'Post';
UPDATE public.reports SET reported_item_type = 'user'    WHERE reported_item_type = 'User';
UPDATE public.reports SET reported_item_type = 'message' WHERE reported_item_type = 'Message';
