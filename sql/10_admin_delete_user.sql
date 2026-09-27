-- =============================================================================
-- Migration 10: Admin User Deletion Support
-- Run this in Supabase SQL Editor
-- =============================================================================

-- ─── 1. ALLOW ADMIN TO DELETE PROFILES ───────────────────────────────────────
-- The Edge Function uses service_role (bypasses RLS) to call auth.admin.deleteUser()
-- which cascades: auth.users → profiles → all child tables.
-- This policy is a safety net for direct profile deletes if ever needed.
DROP POLICY IF EXISTS "admin_profiles_delete" ON profiles;
CREATE POLICY "admin_profiles_delete"
  ON profiles FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- ─── 2. DEPLOY EDGE FUNCTION INSTRUCTIONS ────────────────────────────────────
-- After running this SQL, deploy the Edge Function from your terminal:
--
--   npx supabase functions deploy delete-user --project-ref YOUR_PROJECT_REF
--
-- OR via the Supabase Dashboard:
--   Dashboard → Edge Functions → New Function → paste supabase/functions/delete-user/index.ts
--
-- The Edge Function uses SUPABASE_SERVICE_ROLE_KEY which is automatically
-- injected by Supabase into the Edge Function environment — you do NOT need
-- to set it manually.
--
-- ─── 3. VERIFY CASCADE CHAIN ─────────────────────────────────────────────────
-- Deleting auth.users(id) cascades to:
--   profiles (ON DELETE CASCADE from auth.users)
--     ↳ likes         (user_id, liked_user_id  ON DELETE CASCADE)
--     ↳ matches       (user1_id, user2_id       ON DELETE CASCADE)
--     ↳ messages      (sender_id, receiver_id   ON DELETE CASCADE)
--     ↳ notifications (user_id                  ON DELETE CASCADE)
--     ↳ bookings      (user_id                  ON DELETE CASCADE)
--     ↳ posts         (user_id                  ON DELETE CASCADE)
--     ↳ payments      (user_id                  ON DELETE CASCADE)
--     ↳ reports       (reported_by              ON DELETE CASCADE)
--     ↳ blocks        (blocker_id, blocked_id   ON DELETE CASCADE)
--     ↳ hidden_gems   (submitted_by             ON DELETE SET NULL)
