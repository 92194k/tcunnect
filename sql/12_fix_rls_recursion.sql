-- =============================================================================
-- Migration 12: Fix infinite RLS recursion — all 500 errors
-- =============================================================================
-- ROOT CAUSE: migration 09 added "admin_profiles_select" which does
--   EXISTS (SELECT 1 FROM profiles WHERE is_admin = TRUE)
-- inside a policy ON profiles → PostgreSQL recurses forever → 500 on
-- EVERY query that touches profiles, hidden_gems, bookings, reports, etc.
--
-- FIX: create auth_is_admin() with SECURITY DEFINER (runs as DB owner,
-- bypasses RLS entirely) and replace every recursive subquery with it.
--
-- Run in Supabase SQL Editor — safe to run multiple times.
-- =============================================================================

-- ─── 1. SECURITY DEFINER helper — breaks the recursion ───────────────────────
CREATE OR REPLACE FUNCTION public.auth_is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM profiles WHERE id = auth.uid()),
    FALSE
  );
$$;

-- ─── 2. profiles policies ────────────────────────────────────────────────────

-- SELECT: all authenticated users can read all profiles
-- (matches original schema — needed for avatars, discover-people, chat, etc.)
DROP POLICY IF EXISTS "admin_profiles_select" ON profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

-- UPDATE: own row (fixes missing WITH CHECK bug) + admin override
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING     (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "admin_profiles_update" ON profiles;
CREATE POLICY "admin_profiles_update"
  ON profiles FOR UPDATE
  TO authenticated
  USING     (auth.uid() = id OR auth_is_admin())
  WITH CHECK (auth.uid() = id OR auth_is_admin());

-- INSERT: needed for upsert path in onboarding
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- DELETE: admin only (via Edge Function in practice)
DROP POLICY IF EXISTS "admin_profiles_delete" ON profiles;
CREATE POLICY "admin_profiles_delete"
  ON profiles FOR DELETE
  TO authenticated
  USING (auth_is_admin());

-- ─── 3. platform_settings ────────────────────────────────────────────────────
DROP POLICY IF EXISTS "platform_settings_update" ON platform_settings;
CREATE POLICY "platform_settings_update"
  ON platform_settings FOR UPDATE
  TO authenticated
  USING     (auth_is_admin())
  WITH CHECK (auth_is_admin());

-- ─── 4. payments ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "payments_admin_all" ON payments;
CREATE POLICY "payments_admin_all"
  ON payments FOR ALL
  TO authenticated
  USING     (auth_is_admin())
  WITH CHECK (auth_is_admin());

-- ─── 5. hidden_gems ──────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "admin_gems_select" ON hidden_gems;
CREATE POLICY "admin_gems_select"
  ON hidden_gems FOR SELECT
  TO authenticated
  USING (
    submitted_by = auth.uid()
    OR status = 'approved'
    OR auth_is_admin()
  );

DROP POLICY IF EXISTS "admin_gems_update" ON hidden_gems;
CREATE POLICY "admin_gems_update"
  ON hidden_gems FOR UPDATE
  TO authenticated
  USING     (auth_is_admin())
  WITH CHECK (auth_is_admin());

-- ─── 6. bookings ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "admin_bookings_select" ON bookings;
CREATE POLICY "admin_bookings_select"
  ON bookings FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR auth_is_admin());

-- ─── 7. reports ──────────────────────────────────────────────────────────────
-- Drop both the migration-03 names AND the migration-09 names
DROP POLICY IF EXISTS "Admins can view all reports"    ON reports;
DROP POLICY IF EXISTS "Admins can update report status" ON reports;
DROP POLICY IF EXISTS "admin_reports_select"           ON reports;
DROP POLICY IF EXISTS "admin_reports_update"           ON reports;

CREATE POLICY "admin_reports_select"
  ON reports FOR SELECT
  TO authenticated
  USING (reporter_id = auth.uid() OR reported_by = auth.uid() OR auth_is_admin());

CREATE POLICY "admin_reports_update"
  ON reports FOR UPDATE
  TO authenticated
  USING     (auth_is_admin())
  WITH CHECK (auth_is_admin());

-- ─── 8. fn_notify_all_admins — fix wrong column names ────────────────────────
-- Original used `message` and `data` columns; table has `body` and `reference_id`
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
      COALESCE(
        p_data->>'payment_id',
        p_data->>'gem_id',
        p_data->>'report_id',
        p_data->>'user_id'
      )
    );
  END LOOP;
END;
$$;
