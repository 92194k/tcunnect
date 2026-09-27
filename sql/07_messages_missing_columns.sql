-- ═══════════════════════════════════════════════════════════════════════════
-- TCUnnect · Migration 07 · Add missing columns to messages table
-- Run in Supabase SQL Editor — safe to run multiple times
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 1. Add receiver_id (needed for notifications trigger + broadcast) ──────
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS receiver_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- ─── 2. Add message_type (text | image | gem_card | booking_card | trip_plan)
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS message_type TEXT NOT NULL DEFAULT 'text';

-- ─── 3. Add metadata (arbitrary JSON for gem cards, booking cards, etc.) ────
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT NULL;

-- ─── 4. Index receiver_id for fast lookup ────────────────────────────────────
CREATE INDEX IF NOT EXISTS messages_receiver_id_idx ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS messages_match_id_idx    ON public.messages(match_id);

-- ─── 5. REPLICA IDENTITY FULL — required for Supabase Realtime to work ──────
--  Without this, postgres_changes events carry NO column values (only PK).
--  Both users need to receive the full row via the shared match_* channel.
ALTER TABLE public.messages REPLICA IDENTITY FULL;

-- ─── 6. Make sure messages is in the Realtime publication ────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- ─── 7. Backfill receiver_id for existing messages from matches table ─────────
--  Figures out receiver = the OTHER user in the match (not the sender)
UPDATE public.messages msg
SET receiver_id = CASE
  WHEN m.user1_id = msg.sender_id THEN m.user2_id
  ELSE m.user1_id
END
FROM public.matches m
WHERE m.id = msg.match_id
  AND msg.receiver_id IS NULL;
