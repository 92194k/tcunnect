-- ═══════════════════════════════════════════════════════════════════════════
-- TCUnnect · Migration 05 · Matches RLS + Messages Realtime fix
-- Run in Supabase SQL Editor — safe to run multiple times
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 1. Messages: REPLICA IDENTITY FULL ──────────────────────────────────────
-- Required so Supabase Realtime delivers change events with the full row.
-- Without this, row-level filters on non-PK columns (like match_id) are
-- unreliable and may silently deliver no events.
ALTER TABLE public.messages REPLICA IDENTITY FULL;

-- ─── 2. Ensure messages table is in the Realtime publication ─────────────────
-- Safe to run again even if already added.
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- ─── 3. Matches table: enable RLS ────────────────────────────────────────────
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

-- Drop old policies before recreating (avoids duplicate-policy errors)
DROP POLICY IF EXISTS "Users can see own matches"       ON public.matches;
DROP POLICY IF EXISTS "Match parties can read"          ON public.matches;
DROP POLICY IF EXISTS "Participants can read match"     ON public.matches;
DROP POLICY IF EXISTS "Match parties can update status" ON public.matches;

-- Both users in a match can read it (needed for loadMatches on page refresh)
CREATE POLICY "Match parties can read" ON public.matches
  FOR SELECT
  USING (user1_id = auth.uid() OR user2_id = auth.uid());

-- Both users can update match status (archive, block)
CREATE POLICY "Match parties can update status" ON public.matches
  FOR UPDATE
  USING (user1_id = auth.uid() OR user2_id = auth.uid());
