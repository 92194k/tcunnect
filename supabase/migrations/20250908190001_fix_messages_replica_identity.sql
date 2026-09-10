-- TCUnnect: 015_fix_messages_replica_identity.sql
-- Bug fix: 008_enable_realtime_messages.sql added `messages` to the Realtime
-- publication, but Postgres requires a REPLICA IDENTITY for a table to
-- support DELETE operations once it's part of a publication that tracks
-- deletes. Without this, ANY delete on `messages` fails — including the
-- cascade delete that happens automatically when a user account is removed
-- (auth.users -> users -> matches -> messages).

alter table messages replica identity full;
