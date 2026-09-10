-- TCUnnect: 014_enable_realtime_notifications.sql
-- Same reasoning as 008_enable_realtime_messages.sql — without this, new
-- notification rows (from the like/match/message triggers) never reach the
-- frontend's live subscription, so the unread badge only updates on refresh.

alter publication supabase_realtime add table notifications;
