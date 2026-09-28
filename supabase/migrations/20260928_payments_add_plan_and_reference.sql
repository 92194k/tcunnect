-- Migration: add plan_id, plan_label, reference_id, ocr_data to payments
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS plan_id      text,
  ADD COLUMN IF NOT EXISTS plan_label   text,
  ADD COLUMN IF NOT EXISTS reference_id text,
  ADD COLUMN IF NOT EXISTS ocr_data     jsonb;

-- Prevent duplicate reference IDs (one receipt per payment)
-- Partial index: only enforces uniqueness on non-null values
CREATE UNIQUE INDEX IF NOT EXISTS payments_reference_id_unique
  ON public.payments (reference_id)
  WHERE reference_id IS NOT NULL;
