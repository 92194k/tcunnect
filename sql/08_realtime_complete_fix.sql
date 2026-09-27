-- ═══════════════════════════════════════════════════════════════════════════
-- TCUnnect · Master Realtime Fix Migration
-- Run ONE time in Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- Safe to run multiple times — all statements use IF NOT EXISTS / OR REPLACE
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── STEP 1: Add missing columns to messages ─────────────────────────────────

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS receiver_id   UUID    REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS message_type  TEXT    NOT NULL DEFAULT 'text';

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS metadata      JSONB   DEFAULT NULL;

-- ─── STEP 2: Indexes for fast lookup ─────────────────────────────────────────

CREATE INDEX IF NOT EXISTS messages_receiver_id_idx ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS messages_match_id_idx    ON public.messages(match_id);

-- ─── STEP 3: Backfill receiver_id for all existing messages ──────────────────
-- receiver = the OTHER participant in the match (not the sender)

UPDATE public.messages msg
SET receiver_id = CASE
  WHEN m.user1_id = msg.sender_id THEN m.user2_id
  ELSE m.user1_id
END
FROM public.matches m
WHERE m.id        = msg.match_id
  AND msg.receiver_id IS NULL;

-- ─── STEP 4: Ensure notifications table has all required columns ──────────────

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS link_to      TEXT    DEFAULT NULL;

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS reference_id UUID    DEFAULT NULL;

-- ─── STEP 5: REPLICA IDENTITY FULL on both tables ────────────────────────────
-- Without this, Supabase Realtime postgres_changes carry only the PK,
-- so the client receives empty rows and cannot display message content.

ALTER TABLE public.messages      REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

-- ─── STEP 6: Add tables to the Realtime publication ──────────────────────────
-- If either table is already in the publication this is a no-op.

DO $$
BEGIN
  -- messages
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename  = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;

  -- notifications
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename  = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END $$;

-- ─── STEP 7: RLS policy — let triggers insert notifications for any user ──────
-- The SECURITY DEFINER trigger below bypasses RLS on its own,
-- but adding an explicit policy future-proofs manual inserts.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'notifications'
      AND policyname = 'service_insert_notifications'
  ) THEN
    EXECUTE $pol$
      CREATE POLICY service_insert_notifications
        ON public.notifications
        FOR INSERT
        WITH CHECK (true);
    $pol$;
  END IF;
END $$;

-- ─── STEP 8: SELECT policy — users can only read their own notifications ──────
-- (skip if already exists)

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'notifications'
      AND policyname = 'users_read_own_notifications'
  ) THEN
    EXECUTE $pol$
      CREATE POLICY users_read_own_notifications
        ON public.notifications
        FOR SELECT
        USING (user_id = auth.uid());
    $pol$;
  END IF;
END $$;

-- ─── STEP 9: UPDATE policy — users can mark their own notifications read ──────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'notifications'
      AND policyname = 'users_update_own_notifications'
  ) THEN
    EXECUTE $pol$
      CREATE POLICY users_update_own_notifications
        ON public.notifications
        FOR UPDATE
        USING (user_id = auth.uid())
        WITH CHECK (user_id = auth.uid());
    $pol$;
  END IF;
END $$;

-- Enable RLS on notifications if not already on
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ─── STEP 10: SECURITY DEFINER trigger — auto-create notification on new msg ──
-- Runs as the DB owner, bypassing RLS, so it can insert a notification
-- for the receiver even when the sender is the authenticated user.

CREATE OR REPLACE FUNCTION public.fn_notify_message_receiver()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sender_name TEXT;
BEGIN
  -- Look up sender's display name
  SELECT COALESCE(full_name, 'Someone') INTO v_sender_name
  FROM public.profiles
  WHERE id = NEW.sender_id;

  -- Insert notification for the receiver (if receiver_id is set)
  IF NEW.receiver_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, body, read, link_to, reference_id)
    VALUES (
      NEW.receiver_id,
      'message',
      v_sender_name || ' sent you a message',
      CASE
        WHEN NEW.message_type = 'gem_card'     THEN '📍 Shared a hidden gem'
        WHEN NEW.message_type = 'booking_card' THEN '📅 Shared a booking'
        WHEN NEW.message_type = 'image'        THEN '📷 Sent a photo'
        ELSE LEFT(NEW.content, 80)
      END,
      false,
      '/chat/' || NEW.match_id::TEXT,
      NEW.match_id
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Drop old trigger if exists, recreate cleanly
DROP TRIGGER IF EXISTS trg_notify_message_receiver ON public.messages;

CREATE TRIGGER trg_notify_message_receiver
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_notify_message_receiver();

-- ─── STEP 11: Match notification trigger ─────────────────────────────────────
-- Fires AFTER INSERT on matches (created by handle_mutual_like trigger).
-- Creates a 'match' notification for BOTH users using their real names.
-- SECURITY DEFINER so it can insert notifications for any user, bypassing RLS.

CREATE OR REPLACE FUNCTION public.fn_notify_new_match()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user1_name TEXT;
  v_user2_name TEXT;
BEGIN
  SELECT COALESCE(full_name, 'Someone') INTO v_user1_name
  FROM public.profiles WHERE id = NEW.user1_id;

  SELECT COALESCE(full_name, 'Someone') INTO v_user2_name
  FROM public.profiles WHERE id = NEW.user2_id;

  -- Notify user1: "You matched with [user2]!"
  INSERT INTO public.notifications (user_id, type, title, body, read, link_to, reference_id)
  VALUES (
    NEW.user1_id,
    'match',
    'You matched with ' || v_user2_name || '! 🎉',
    'You can now message each other',
    false,
    '/chat',
    NEW.id
  );

  -- Notify user2: "You matched with [user1]!"
  INSERT INTO public.notifications (user_id, type, title, body, read, link_to, reference_id)
  VALUES (
    NEW.user2_id,
    'match',
    'You matched with ' || v_user1_name || '! 🎉',
    'You can now message each other',
    false,
    '/chat',
    NEW.id
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_new_match ON public.matches;
CREATE TRIGGER trg_notify_new_match
  AFTER INSERT ON public.matches
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_notify_new_match();

-- ─── DONE ─────────────────────────────────────────────────────────────────────
-- After running this, your app will have:
--   ✓ receiver_id, message_type, metadata columns on messages
--   ✓ link_to, reference_id columns on notifications
--   ✓ REPLICA IDENTITY FULL on both tables (Realtime delivers full rows)
--   ✓ Both tables in the supabase_realtime publication
--   ✓ RLS policies on notifications (read own, update own, service insert)
--   ✓ Auto-notification trigger: every new message → notification for receiver
-- ═══════════════════════════════════════════════════════════════════════════
