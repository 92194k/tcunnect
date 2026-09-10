-- TCUnnect: 20250908310001_account_deletion.sql
-- Real, permanent auth-account deletion needs Supabase's admin API (service
-- role), which can't run safely from frontend code — same constraint as
-- ever. What CAN be done client-side, safely, with the user's own session:
-- immediately scrub their profile data, block further login, and flag the
-- account for an admin to finish the real deletion with the SQL script
-- already provided. This column is what "Request Account Deletion" sets.

alter table users add column deletion_requested_at timestamptz;
