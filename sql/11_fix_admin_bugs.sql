-- =============================================================================
-- Migration 11: Fix signup/onboarding — trigger column names + RLS policies
-- Run in Supabase SQL Editor — safe to run multiple times
-- =============================================================================

-- ─── 1. Fix fn_notify_all_admins — wrong column names ────────────────────────
-- The original function used `message` and `data` columns that don't exist.
-- The notifications table has `body` (not `message`) and no `data` column.
-- This bug caused: new user signup → profile INSERT trigger → fn_notify_all_admins
-- → bad INSERT into notifications → PostgreSQL exception → ENTIRE profile INSERT
-- rolled back → user had auth.users row but no profiles row → stuck in limbo.
CREATE OR REPLACE FUNCTION fn_notify_all_admins(
  p_type    TEXT,
  p_title   TEXT,
  p_message TEXT,
  p_data    JSONB DEFAULT '{}'::JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID;
BEGIN
  FOR v_admin_id IN
    SELECT id FROM profiles WHERE is_admin = TRUE
  LOOP
    INSERT INTO notifications (user_id, type, title, body, reference_id)
    VALUES (
      v_admin_id,
      p_type,
      p_title,
      p_message,
      -- store the most useful reference ID from the payload, if present
      COALESCE(p_data->>'payment_id', p_data->>'gem_id', p_data->>'report_id', p_data->>'user_id')
    );
  END LOOP;
END;
$$;

-- ─── 2. Ensure "Users can update their own profile" policy exists with WITH CHECK ──
-- The original schema.sql policy had no WITH CHECK clause, which in some
-- Supabase versions means the check defaults to FALSE, silently blocking updates.
-- We drop and recreate it to guarantee both USING and WITH CHECK are set.
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING     (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ─── 3. Fix/replace admin_profiles_update RLS ────────────────────────────────
-- The migration 09 version only allowed admins to update; regular users were
-- blocked (0-row silent failure). Merge both cases into one policy.
DROP POLICY IF EXISTS "admin_profiles_update" ON public.profiles;
CREATE POLICY "admin_profiles_update"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = id
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
  )
  WITH CHECK (
    auth.uid() = id
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- ─── 4. Ensure insert policy exists (needed for upsert in updateProfile) ─────
-- If a user's profile was never created (trigger failure), upsert will INSERT.
-- The insert policy must allow this.
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);
