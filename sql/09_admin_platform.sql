-- =============================================================================
-- Migration 09: Admin Platform Settings & Payments
-- Run this in Supabase SQL Editor
-- =============================================================================

-- ─── 1. PLATFORM SETTINGS TABLE ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS platform_settings (
  id                        BOOLEAN PRIMARY KEY DEFAULT TRUE,
  -- Registration / Community
  allow_user_registrations  BOOLEAN NOT NULL DEFAULT TRUE,
  enable_community_posts    BOOLEAN NOT NULL DEFAULT TRUE,
  -- Payment info (shown to users on Premium page)
  gcash_number              TEXT NOT NULL DEFAULT '09XX-XXX-XXXX',
  maya_number               TEXT NOT NULL DEFAULT '09XX-XXX-XXXX',
  account_name              TEXT NOT NULL DEFAULT 'TCUnnect Official',
  -- Timestamps
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT only_one_row CHECK (id = TRUE)
);

-- Seed a single row if none exists
INSERT INTO platform_settings (id)
VALUES (TRUE)
ON CONFLICT (id) DO NOTHING;

-- ─── 2. PAYMENTS TABLE ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id     TEXT NOT NULL,
  plan_label  TEXT NOT NULL,
  amount      NUMERIC(10,2) NOT NULL,
  method      TEXT NOT NULL CHECK (method IN ('GCash', 'Maya')),
  receipt_url TEXT,
  status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 3. ROW LEVEL SECURITY ───────────────────────────────────────────────────

-- platform_settings: anyone authenticated can read, only admin can update
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "platform_settings_read"   ON platform_settings;
DROP POLICY IF EXISTS "platform_settings_update" ON platform_settings;

CREATE POLICY "platform_settings_read"
  ON platform_settings FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "platform_settings_update"
  ON platform_settings FOR UPDATE
  TO authenticated
  USING   (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- payments: user can insert their own, admin can read/update all
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payments_user_insert" ON payments;
DROP POLICY IF EXISTS "payments_user_select" ON payments;
DROP POLICY IF EXISTS "payments_admin_all"   ON payments;

CREATE POLICY "payments_user_insert"
  ON payments FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "payments_user_select"
  ON payments FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "payments_admin_all"
  ON payments FOR ALL
  TO authenticated
  USING   (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- ─── 4. IDEMPOTENT ADMIN SELECT POLICIES ON EXISTING TABLES ──────────────────
-- (safe to run even if policies already exist)

-- profiles: admin can read all
DROP POLICY IF EXISTS "admin_profiles_select" ON profiles;
CREATE POLICY "admin_profiles_select"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = TRUE)
  );

-- profiles: admin can update is_premium
DROP POLICY IF EXISTS "admin_profiles_update" ON profiles;
CREATE POLICY "admin_profiles_update"
  ON profiles FOR UPDATE
  TO authenticated
  USING   (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- hidden_gems: admin can read all (including pending)
DROP POLICY IF EXISTS "admin_gems_select" ON hidden_gems;
CREATE POLICY "admin_gems_select"
  ON hidden_gems FOR SELECT
  TO authenticated
  USING (
    submitted_by = auth.uid()
    OR status = 'approved'
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- hidden_gems: admin can update status / is_featured
DROP POLICY IF EXISTS "admin_gems_update" ON hidden_gems;
CREATE POLICY "admin_gems_update"
  ON hidden_gems FOR UPDATE
  TO authenticated
  USING   (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- bookings: admin can read all
DROP POLICY IF EXISTS "admin_bookings_select" ON bookings;
CREATE POLICY "admin_bookings_select"
  ON bookings FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- reports: admin can read/update all
DROP POLICY IF EXISTS "admin_reports_select" ON reports;
CREATE POLICY "admin_reports_select"
  ON reports FOR SELECT
  TO authenticated
  USING (
    reported_by = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

DROP POLICY IF EXISTS "admin_reports_update" ON reports;
CREATE POLICY "admin_reports_update"
  ON reports FOR UPDATE
  TO authenticated
  USING   (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- ─── 5. ADMIN NOTIFICATION TRIGGERS ──────────────────────────────────────────

-- Helper: notify all admins
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
    INSERT INTO notifications (user_id, type, title, message, data)
    VALUES (v_admin_id, p_type, p_title, p_message, p_data);
  END LOOP;
END;
$$;

-- 5a. New user registered → notify admins
CREATE OR REPLACE FUNCTION fn_notify_admins_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM fn_notify_all_admins(
    'system',
    'New User Registered',
    COALESCE(NEW.full_name, NEW.email, 'A new user') || ' just signed up.',
    jsonb_build_object('user_id', NEW.id, 'email', COALESCE(NEW.email, ''))
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_admins_new_user ON profiles;
CREATE TRIGGER trg_notify_admins_new_user
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION fn_notify_admins_new_user();

-- 5b. New payment submitted → notify admins
CREATE OR REPLACE FUNCTION fn_notify_admins_new_payment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name TEXT;
BEGIN
  SELECT COALESCE(full_name, 'A user') INTO v_name
  FROM profiles WHERE id = NEW.user_id;

  PERFORM fn_notify_all_admins(
    'system',
    'New Payment Submitted',
    v_name || ' submitted a ' || NEW.method || ' payment for ' || NEW.plan_label || '.',
    jsonb_build_object(
      'payment_id', NEW.id,
      'user_id',    NEW.user_id,
      'plan_id',    NEW.plan_id,
      'amount',     NEW.amount,
      'method',     NEW.method
    )
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_admins_new_payment ON payments;
CREATE TRIGGER trg_notify_admins_new_payment
  AFTER INSERT ON payments
  FOR EACH ROW
  EXECUTE FUNCTION fn_notify_admins_new_payment();

-- 5c. New gem submitted → notify admins
CREATE OR REPLACE FUNCTION fn_notify_admins_new_gem()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name TEXT;
BEGIN
  -- Only notify on initial pending submission
  IF NEW.status <> 'pending' THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(full_name, 'Someone') INTO v_name
  FROM profiles WHERE id = NEW.submitted_by;

  PERFORM fn_notify_all_admins(
    'system',
    'New Hidden Gem Submitted',
    v_name || ' submitted "' || NEW.name || '" for review.',
    jsonb_build_object('gem_id', NEW.id, 'gem_name', NEW.name)
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_admins_new_gem ON hidden_gems;
CREATE TRIGGER trg_notify_admins_new_gem
  AFTER INSERT ON hidden_gems
  FOR EACH ROW
  EXECUTE FUNCTION fn_notify_admins_new_gem();

-- 5d. New report filed → notify admins
CREATE OR REPLACE FUNCTION fn_notify_admins_new_report()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name TEXT;
BEGIN
  SELECT COALESCE(full_name, 'A user') INTO v_name
  FROM profiles WHERE id = NEW.reported_by;

  PERFORM fn_notify_all_admins(
    'system',
    'New Report Filed',
    v_name || ' filed a report: ' || COALESCE(NEW.reason, 'No reason given') || '.',
    jsonb_build_object('report_id', NEW.id, 'reporter_id', NEW.reported_by)
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_admins_new_report ON reports;
CREATE TRIGGER trg_notify_admins_new_report
  AFTER INSERT ON reports
  FOR EACH ROW
  EXECUTE FUNCTION fn_notify_admins_new_report();

-- ─── 6. STORAGE BUCKET FOR PAYMENT RECEIPTS ──────────────────────────────────
-- Run this separately if the bucket doesn't exist yet:
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('payment-receipts', 'payment-receipts', false)
-- ON CONFLICT (id) DO NOTHING;

-- Storage policy: user can upload their own receipts
-- (Run in Supabase Dashboard > Storage > payment-receipts > Policies)
-- Policy name: "Users can upload own receipts"
-- Allowed operation: INSERT
-- Target roles: authenticated
-- USING expression: (storage.foldername(name))[1] = auth.uid()::text

-- ─── 7. ENABLE REALTIME ON PAYMENTS ──────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE payments;
ALTER PUBLICATION supabase_realtime ADD TABLE platform_settings;
