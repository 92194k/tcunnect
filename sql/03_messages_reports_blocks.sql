-- ═══════════════════════════════════════════════════════════════════════════
-- TCUnnect · Migration 03 · Messages, Reports, Blocks
-- Run this in your Supabase SQL Editor (Database → SQL Editor → New Query)
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── Messages ────────────────────────────────────────────────────────────────
-- Stores real-time chat messages between matched users.
-- match_id is TEXT because matches live in Zustand (not a DB table).
CREATE TABLE IF NOT EXISTS public.messages (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id      TEXT        NOT NULL,
  sender_id     UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id   UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content       TEXT        NOT NULL DEFAULT '',
  message_type  TEXT        NOT NULL DEFAULT 'text',   -- 'text' | 'gem_card' | 'booking_card' | 'trip_plan'
  metadata      JSONB       DEFAULT NULL,
  read          BOOLEAN     NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS messages_match_id_idx     ON public.messages(match_id);
CREATE INDEX IF NOT EXISTS messages_sender_id_idx    ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS messages_receiver_id_idx  ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS messages_created_at_idx   ON public.messages(created_at DESC);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Both parties in a conversation can read all messages
CREATE POLICY "Parties can read messages" ON public.messages
  FOR SELECT USING (sender_id = auth.uid() OR receiver_id = auth.uid());

-- Only the sender can insert
CREATE POLICY "Sender can insert messages" ON public.messages
  FOR INSERT WITH CHECK (sender_id = auth.uid());

-- Receiver can mark messages as read
CREATE POLICY "Receiver can mark read" ON public.messages
  FOR UPDATE USING (receiver_id = auth.uid())
  WITH CHECK (receiver_id = auth.uid());

-- Enable Supabase Realtime on messages (so new messages arrive instantly)
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;


-- ─── Reports ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.reports (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id         UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reported_user_id    UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  reported_item_type  TEXT        NOT NULL,   -- 'user' | 'message'
  reported_item_id    TEXT        DEFAULT NULL,
  match_id            TEXT        DEFAULT NULL,
  message_content     TEXT        DEFAULT NULL,
  reason              TEXT        NOT NULL,
  details             TEXT        DEFAULT NULL,
  status              TEXT        NOT NULL DEFAULT 'pending',  -- 'pending' | 'resolved' | 'dismissed'
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can submit reports" ON public.reports
  FOR INSERT WITH CHECK (reporter_id = auth.uid());

CREATE POLICY "Users can view own reports" ON public.reports
  FOR SELECT USING (reporter_id = auth.uid());

CREATE POLICY "Admins can view all reports" ON public.reports
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can update report status" ON public.reports
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );


-- ─── Blocks ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.blocks (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id  UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  blocked_id  UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(blocker_id, blocked_id)
);

ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;

-- Users can manage only their own blocks
CREATE POLICY "Users manage own blocks" ON public.blocks
  FOR ALL USING (blocker_id = auth.uid());
