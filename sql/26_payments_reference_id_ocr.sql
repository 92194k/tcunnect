-- =============================================================================
-- Migration 26: Fix Payment INSERT failure + add reference_id / ocr_data columns
-- Root cause of "Failed to submit payment. Please try again.":
--   fn_notify_all_admins (migration 09) inserts into notifications using
--   wrong column names: `message` and `data` — the table actually has
--   `body` and `reference_id`. The trigger fires on every payment INSERT,
--   throws a PostgreSQL exception, and rolls back the ENTIRE payment INSERT.
--   Supabase returns an error to the frontend → generic "Failed" message shown.
-- Safe to run multiple times (fully idempotent).
-- =============================================================================

-- ─── 1. Fix fn_notify_all_admins — use correct notifications column names ────
-- notifications table has: body (not message), reference_id TEXT (not data JSONB)
-- migration 11 was meant to fix this but may not have been run on live DB.
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
      -- store the most useful reference ID from the payload as TEXT
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

-- ─── 2. Add reference_id to payments (GCash / Maya reference number) ─────────
-- NOT NULL would block existing rows so we allow NULL; frontend enforces required.
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS reference_id TEXT DEFAULT NULL;

-- ─── 3. Add ocr_data to payments (raw parsed OCR output from receipt scan) ───
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS ocr_data JSONB DEFAULT NULL;

-- ─── 4. Create payment-receipts storage bucket (public) ──────────────────────
-- The original migration 09 left this as a comment to "run separately".
-- We create it here so the frontend upload works without manual setup.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'payment-receipts',
  'payment-receipts',
  true,                         -- public so getPublicUrl() works
  10485760,                     -- 10 MB limit per receipt
  ARRAY['image/jpeg','image/png','image/webp','image/gif','image/heic']
)
ON CONFLICT (id) DO UPDATE
  SET public = true,
      file_size_limit = 10485760;

-- ─── 5. Storage policies for payment-receipts ────────────────────────────────

-- Users can upload their own receipts (path: receipts/<user_id>/...)
DROP POLICY IF EXISTS "receipts_user_upload" ON storage.objects;
CREATE POLICY "receipts_user_upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'payment-receipts'
    AND (storage.foldername(name))[1] = 'receipts'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

-- Users can read their own receipts; admins can read all
DROP POLICY IF EXISTS "receipts_user_read"  ON storage.objects;
CREATE POLICY "receipts_user_read"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'payment-receipts'
    AND (
      (storage.foldername(name))[2] = auth.uid()::text
      OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
    )
  );

-- Allow public (anon) reads since bucket is public — needed for Admin panel receipt links
DROP POLICY IF EXISTS "receipts_public_read" ON storage.objects;
CREATE POLICY "receipts_public_read"
  ON storage.objects FOR SELECT
  TO anon
  USING (bucket_id = 'payment-receipts');

-- ─── 6. Verify: after running this migration ─────────────────────────────────
-- Check trigger is healthy:
--   SELECT trigger_name, event_manipulation, action_statement
--   FROM information_schema.triggers
--   WHERE event_object_table = 'payments';
--
-- Confirm new columns exist:
--   SELECT column_name, data_type FROM information_schema.columns
--   WHERE table_name = 'payments' AND column_name IN ('reference_id','ocr_data');
--
-- Test a payment insert manually:
--   INSERT INTO payments (user_id, plan_id, plan_label, amount, method)
--   VALUES (auth.uid(), 'test', 'Test Plan', 1.00, 'GCash');
--   -- Should succeed and appear in SELECT * FROM payments WHERE plan_id = 'test';
--   -- Then: DELETE FROM payments WHERE plan_id = 'test';
