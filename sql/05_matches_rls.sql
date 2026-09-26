-- ═══════════════════════════════════════════════════════════════════════════
-- TCUnnect · Migration 05 · Matches table RLS policies
-- Run in Supabase SQL Editor
-- Ensures users can read and query their own matches (required for loadMatches)
-- Safe to run multiple times — DROP IF EXISTS before CREATE
-- ═══════════════════════════════════════════════════════════════════════════

-- Enable RLS on matches table (safe if already enabled)
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

-- Drop old policies (ignore errors if they don't exist)
DROP POLICY IF EXISTS "Users can see own matches"        ON public.matches;
DROP POLICY IF EXISTS "Match parties can read"          ON public.matches;
DROP POLICY IF EXISTS "Participants can read match"     ON public.matches;

-- Recreate: both user1 and user2 can read the match row
CREATE POLICY "Match parties can read" ON public.matches
  FOR SELECT
  USING (user1_id = auth.uid() OR user2_id = auth.uid());

-- Both parties can also update match status (e.g. archive/block)
DROP POLICY IF EXISTS "Match parties can update status" ON public.matches;
CREATE POLICY "Match parties can update status" ON public.matches
  FOR UPDATE
  USING (user1_id = auth.uid() OR user2_id = auth.uid());
