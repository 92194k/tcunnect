-- TCUnnect: 018_enable_realtime_users.sql
-- Needed so a logged-in session can detect the instant an admin bans or
-- suspends that account, instead of only catching it at next login.

alter table users replica identity full;
alter publication supabase_realtime add table users;
