-- TCUnnect: 20250908340001_enable_realtime_matches.sql
-- Needed so BOTH people in a new match see the "It's a Match!" popup, not
-- just whoever happened to complete the mutual like. Same pattern as
-- messages/notifications/users realtime.

alter table matches replica identity full;
alter publication supabase_realtime add table matches;
