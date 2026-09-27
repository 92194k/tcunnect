-- =============================================================================
-- Migration 11: Fix admin notification column names + RLS policy
-- Run in Supabase SQL Editor
-- =============================================================================

-- ─── 1. Fix fn_notify_all_admins — wrong column names ────────────────────────
-- The original used `message` and `data` which don't exist on notifications.
-- Correct columns are `body` and `reference_id`.
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
      (p_data->>'payment_id')  -- store payment_id or gem_id as reference when present
    );
  END LOOP;
END;
$$;

-- ─── 2. Fix admin_profiles_update RLS — allow users to update their own rows ──
-- Original policy only allowed admins; regular users' UPDATE returned 0 rows silently,
-- causing onboarding to loop forever.
DROP POLICY IF EXISTS "admin_profiles_update" ON profiles;
CREATE POLICY "admin_profiles_update"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = id
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
  )
  WITH CHECK (
    auth.uid() = id
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );
