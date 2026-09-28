-- =============================================================================
-- Migration 24: Add reported_user_id + Fix Admin RLS Policies
-- Root cause fixes:
--   1. reported_user_id column was missing from live DB (schema cache error)
--   2. Admin SELECT/UPDATE policies used auth_is_admin() which doesn't exist
-- Safe to run multiple times (fully idempotent).
-- =============================================================================

-- ─── 1. Add reported_user_id column ──────────────────────────────────────────
ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS reported_user_id uuid
  REFERENCES public.profiles(id)
  ON DELETE SET NULL;

-- ─── 2. Fix Admin SELECT policy ──────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can view all reports" ON public.reports;
DROP POLICY IF EXISTS "reports_select_admin"        ON public.reports;

CREATE POLICY "reports_select_admin"
  ON public.reports FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- ─── 3. Fix Admin UPDATE policy ──────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can update report status" ON public.reports;
DROP POLICY IF EXISTS "reports_update_admin"            ON public.reports;

CREATE POLICY "reports_update_admin"
  ON public.reports FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- ─── 4. Verify user INSERT policy exists (recreate if missing) ───────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'reports'
      AND policyname IN ('reports_insert_own', 'Users can submit reports')
      AND cmd = 'INSERT'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "reports_insert_own"
        ON public.reports FOR INSERT
        TO authenticated
        WITH CHECK (reported_by = auth.uid())
    $policy$;
  END IF;
END $$;

-- ─── 5. Verify: check your admin user has is_admin = true ────────────────────
-- SELECT id, full_name, is_admin FROM public.profiles WHERE is_admin = true;
-- If empty, run:
-- UPDATE public.profiles SET is_admin = true WHERE email = 'your-admin@email.com';
