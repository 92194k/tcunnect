-- =============================================================================
-- Migration 23: Fix Admin Reports SELECT policy
-- The only reason Admin Reports shows 0 despite rows existing is that the
-- admin SELECT policy either doesn't exist or calls auth_is_admin() which
-- doesn't exist. This migration drops and recreates it with inline EXISTS.
-- Safe to run multiple times (fully idempotent).
-- =============================================================================

-- Drop every possible name the admin select policy could have
DROP POLICY IF EXISTS "Admins can view all reports"  ON public.reports;
DROP POLICY IF EXISTS "reports_select_admin"         ON public.reports;

-- Also ensure is_admin column exists on profiles (needed by the policy)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

-- Recreate admin SELECT policy with inline EXISTS — no custom function needed
CREATE POLICY "reports_select_admin"
  ON public.reports FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Also fix the admin UPDATE policy in case it has the same problem
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

-- Verify: after running this, check your admin user has is_admin = true:
-- SELECT id, full_name, is_admin FROM public.profiles WHERE is_admin = true;
-- If empty, run: UPDATE public.profiles SET is_admin = true WHERE email = 'your-admin@email.com';
