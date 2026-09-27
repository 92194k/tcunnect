-- =============================================================================
-- Migration 22: Reports Final Fix
-- Uses reported_by (the actual DB column) everywhere.
-- Uses inline EXISTS instead of auth_is_admin() which may not exist.
-- Safe to run multiple times (fully idempotent).
-- =============================================================================

-- ─── 1. profiles: add account_status and is_admin if missing ─────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_status text NOT NULL DEFAULT 'active';

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_account_status_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_account_status_check
  CHECK (account_status IN ('active', 'suspended', 'banned'));

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

-- ─── 2. reports: add reported_post_id if missing ─────────────────────────────
ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS reported_post_id uuid REFERENCES public.posts(id) ON DELETE SET NULL;

-- ─── 3. Fix reported_item_type CHECK to include 'post' ───────────────────────
ALTER TABLE public.reports
  DROP CONSTRAINT IF EXISTS reports_reported_item_type_check;

ALTER TABLE public.reports
  ADD CONSTRAINT reports_reported_item_type_check
  CHECK (reported_item_type IN ('user', 'message', 'post'));

-- Normalise any capitalised values
UPDATE public.reports SET reported_item_type = 'post'    WHERE reported_item_type = 'Post';
UPDATE public.reports SET reported_item_type = 'user'    WHERE reported_item_type = 'User';
UPDATE public.reports SET reported_item_type = 'message' WHERE reported_item_type = 'Message';

-- ─── 4. RLS: drop ALL old policies and recreate with reported_by + inline EXISTS
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can submit reports"        ON public.reports;
DROP POLICY IF EXISTS "Users can view own reports"      ON public.reports;
DROP POLICY IF EXISTS "Admins can view all reports"     ON public.reports;
DROP POLICY IF EXISTS "Admins can update report status" ON public.reports;
DROP POLICY IF EXISTS "reports_insert_own"              ON public.reports;
DROP POLICY IF EXISTS "reports_select_own"              ON public.reports;
DROP POLICY IF EXISTS "reports_select_admin"            ON public.reports;
DROP POLICY IF EXISTS "reports_update_admin"            ON public.reports;

-- Users: insert their own reports (reported_by = the logged-in user)
CREATE POLICY "reports_insert_own"
  ON public.reports FOR INSERT
  TO authenticated
  WITH CHECK (reported_by = auth.uid());

-- Users: read only their own reports
CREATE POLICY "reports_select_own"
  ON public.reports FOR SELECT
  TO authenticated
  USING (reported_by = auth.uid());

-- Admins: read ALL reports (inline EXISTS — no auth_is_admin() function needed)
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

-- ─── 5. profiles update policy: admins can suspend/ban ───────────────────────
DROP POLICY IF EXISTS "admin_profiles_update"        ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING   (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "admin_profiles_update"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- ─── 6. Realtime ─────────────────────────────────────────────────────────────
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
  item_title text;
  item_body  text;
BEGIN
  CASE NEW.reported_item_type
    WHEN 'user'    THEN item_title := 'New user report';    item_body := 'A user has been reported for: '    || COALESCE(NEW.reason, 'unspecified');
    WHEN 'message' THEN item_title := 'New message report'; item_body := 'A message has been reported for: ' || COALESCE(NEW.reason, 'unspecified');
    WHEN 'post'    THEN item_title := 'New post report';    item_body := 'A post has been reported for: '    || COALESCE(NEW.reason, 'unspecified');
    ELSE                item_title := 'New report';         item_body := 'A new report was submitted.';
  END CASE;

  FOR admin_rec IN SELECT id FROM public.profiles WHERE is_admin = true LOOP
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
