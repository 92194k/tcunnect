-- TCUnnect: 008_enable_realtime_messages.sql
-- Without this, the messages table's INSERT events never reach the
-- frontend's supabase.channel(...).on("postgres_changes", ...) subscription
-- in MessagesView, and chat only updates on page refresh.

alter publication supabase_realtime add table messages;
