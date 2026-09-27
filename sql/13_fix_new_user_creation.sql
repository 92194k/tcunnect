-- =============================================================================
-- Migration 13: Fix "Database error saving new user" — broken notification trigger
-- =============================================================================
-- ROOT CAUSE:
--   fn_notify_all_admins (created in migration 09) inserts into notifications
--   using columns `message` and `data` — which DO NOT EXIST.
--   The notifications table (migration 06) has `body` and `reference_id`.
--
--   Trigger chain that kills new user creation:
--     supabase.auth.signUp()
--       → INSERT auth.users
--       → on_auth_user_created trigger → handle_new_user()
--       → INSERT profiles
--       → trg_notify_admins_new_user trigger → fn_notify_admins_new_user()
--       → fn_notify_all_admins()
--       → INSERT notifications (user_id, type, title, MESSAGE, DATA)  ← COLUMN ERROR
--       → exception propagates → entire auth.users INSERT is rolled back
--       → Supabase returns "Database error saving new user"
--
-- This affects BOTH email signup AND Google OAuth (same trigger chain).
-- Existing users are unaffected because the trigger only fires on INSERT.
--
-- FIX:
--   1. Fix fn_notify_all_admins: use correct column names (body, reference_id)
--   2. Add EXCEPTION WHEN OTHERS THEN NULL to all notification trigger functions
--      so a notification failure can NEVER block user creation or other operations
--
-- Safe to run multiple times (all CREATE OR REPLACE).
-- =============================================================================

-- ─── 1. Fix fn_notify_all_admins — wrong column names ────────────────────────
CREATE OR REPLACE FUNCTION public.fn_notify_all_admins(
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
EXCEPTION
  WHEN OTHERS THEN
    -- Never let notification failures propagate — they must not block
    -- user creation, payments, gem submissions, or reports.
    NULL;
END;
$$;

-- ─── 2. Re-create all notification trigger functions with exception handling ──
-- Each PERFORM fn_notify_all_admins(...) is already safe (the function handles
-- exceptions internally), but we add an outer handler here too as belt-and-braces.

CREATE OR REPLACE FUNCTION public.fn_notify_admins_new_user()
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
EXCEPTION
  WHEN OTHERS THEN
    -- Never block profile creation due to notification errors
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_notify_admins_new_payment()
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
EXCEPTION
  WHEN OTHERS THEN
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_notify_admins_new_gem()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name TEXT;
BEGIN
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
EXCEPTION
  WHEN OTHERS THEN
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_notify_admins_new_report()
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
EXCEPTION
  WHEN OTHERS THEN
    RETURN NEW;
END;
$$;
