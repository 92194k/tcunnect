-- Migration: add source (photo credits/attribution) to hidden_gems
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

ALTER TABLE public.hidden_gems
  ADD COLUMN IF NOT EXISTS source text;
