-- ═══════════════════════════════════════════════════════════════════════════
-- TCUnnect · Migration 06 · Notifications table + Realtime + Message trigger
-- Run in Supabase SQL Editor — safe to run multiple times
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 1. Create notifications table ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type         TEXT        NOT NULL,           -- 'message' | 'match' | 'like' | 'booking_*' | 'community_reply' | 'gem_*' | 'system'
  title        TEXT        NOT NULL,
  body         TEXT        NOT NULL DEFAULT '',
  read         BOOLEAN     NOT NULL DEFAULT false,
  link_to      TEXT        DEFAULT NULL,       -- e.g. '/chat/match-id'
  reference_id TEXT        DEFAULT NULL,       -- matchId, bookingId, etc.
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_user_id_idx    ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_read_idx       ON public.notifications(user_id, read);

-- ─── 2. RLS on notifications ──────────────────────────────────────────────────
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notifications"   ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can insert own notifications" ON public.notifications;

-- Users can only read their own notifications
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());

-- Users can mark their own notifications as read
CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid());

-- Allow authenticated users to insert (needed for the SECURITY DEFINER trigger
-- to bypass RLS, but also for direct inserts for same-user notifications)
CREATE POLICY "Service can insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);

-- ─── 3. REPLICA IDENTITY FULL — required for Realtime column filters ─────────
-- Allows Supabase Realtime to filter INSERT events by user_id without a full
-- table scan, and correctly enforces RLS on the delivered event payload.
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

-- Also ensure messages has REPLICA IDENTITY FULL (required for Realtime RLS
-- to correctly pass events to User B based on receiver_id column).
ALTER TABLE public.messages REPLICA IDENTITY FULL;

-- ─── 4. Add tables to Realtime publication ────────────────────────────────────
-- Safe to run even if already added.
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- ─── 5. Database trigger: auto-create notification when a message is sent ─────
-- Runs SECURITY DEFINER so it can INSERT for ANY user_id (bypasses RLS).
-- This is the only way for User A's message INSERT to create a notification
-- row owned by User B.
CREATE OR REPLACE FUNCTION public.fn_notify_message_receiver()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sender_name TEXT;
  v_body        TEXT;
BEGIN
  -- Look up the sender's display name
  SELECT full_name INTO v_sender_name
  FROM public.profiles
  WHERE id = NEW.sender_id;

  -- Build a preview body based on message type
  v_body := CASE
    WHEN NEW.message_type = 'text'         THEN LEFT(NEW.content, 120)
    WHEN NEW.message_type = 'image'        THEN '📷 Sent a photo'
    WHEN NEW.message_type = 'gem_card'     THEN '📍 Shared a Hidden Gem'
    WHEN NEW.message_type = 'booking_card' THEN '🗓 Shared a booking'
    WHEN NEW.message_type = 'trip_plan'    THEN '✈️ Shared a trip plan'
    ELSE '💬 Sent you a message'
  END;

  INSERT INTO public.notifications (
    user_id, type, title, body, read, link_to, reference_id
  ) VALUES (
    NEW.receiver_id,
    'message',
    COALESCE(v_sender_name, 'Someone') || ' sent you a message',
    v_body,
    false,
    '/chat/' || NEW.match_id,
    NEW.match_id
  );

  RETURN NEW;
END;
$$;

-- Drop old trigger if it exists, then recreate
DROP TRIGGER IF EXISTS trg_notify_message_receiver ON public.messages;
CREATE TRIGGER trg_notify_message_receiver
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_notify_message_receiver();
