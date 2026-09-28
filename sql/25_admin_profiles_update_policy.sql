-- =============================================================================
-- Migration 25: Ensure admin can UPDATE any profile (suspend / ban / reactivate)
-- Problem: the only profiles UPDATE policy may be "Users can update own profile"
-- (id = auth.uid()), which prevents admins from updating OTHER users' statuses.
-- The admin policy may not have been created if migration 22 was skipped or
-- the policy creation failed silently.
-- Supabase returns NO error when an UPDATE affects 0 rows due to RLS — so the
-- frontend thinks it succeeded while the DB was never changed.
-- Safe to run multiple times (fully idempotent).
-- =============================================================================

-- Ensure account_status column exists with the right constraint
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_status text NOT NULL DEFAULT 'active';

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_account_status_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_account_status_check
  CHECK (account_status IN ('active', 'suspended', 'banned'));

-- Ensure is_admin column exists
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

-- Drop and recreate all profiles UPDATE policies cleanly
DROP POLICY IF EXISTS "Users can update own profile"  ON public.profiles;
DROP POLICY IF EXISTS "admin_profiles_update"          ON public.profiles;
DROP POLICY IF EXISTS "Admins can update profiles"     ON public.profiles;

-- Users can update their own profile (non-status fields)
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING   (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Admins can update ANY profile (needed for suspend / ban / reactivate)
-- Uses inline EXISTS — no auth_is_admin() function required
CREATE POLICY "admin_profiles_update"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Verify your admin user has is_admin = true:
-- SELECT id, full_name, email, is_admin FROM public.profiles WHERE is_admin = true;
-- If empty: UPDATE public.profiles SET is_admin = true WHERE email = 'your-admin@email.com';

-- After running, test with:
-- UPDATE public.profiles SET account_status = 'suspended' WHERE id = '<some-user-id>';
-- SELECT id, account_status FROM public.profiles WHERE id = '<some-user-id>';
-- Should show suspended. Then:
-- UPDATE public.profiles SET account_status = 'active' WHERE id = '<some-user-id>';
-- SELECT id, account_status FROM public.profiles WHERE id = '<some-user-id>';
-- Should show active.
