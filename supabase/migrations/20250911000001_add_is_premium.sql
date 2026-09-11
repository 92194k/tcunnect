-- STEP 1: DATABASE MIGRATION
-- Copy this file to: supabase/migrations/20250911000001_add_is_premium.sql
-- Then run: supabase db push

ALTER TABLE IF EXISTS users
ADD COLUMN IF NOT EXISTS is_premium boolean not null default false;

ALTER TABLE IF EXISTS premium_purchases
ADD COLUMN IF NOT EXISTS qrph_payment_id text UNIQUE;

CREATE INDEX IF NOT EXISTS idx_users_is_premium ON users(is_premium);
CREATE INDEX IF NOT EXISTS idx_premium_purchases_qrph_id ON premium_purchases(qrph_payment_id);

CREATE TABLE IF NOT EXISTS payment_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  payment_id uuid not null references premium_purchases(id) on delete cascade,
  event text not null,
  details jsonb,
  created_at timestamptz not null default now()
);

CREATE INDEX idx_payment_logs_user ON payment_logs(user_id);
CREATE INDEX idx_payment_logs_payment ON payment_logs(payment_id);
