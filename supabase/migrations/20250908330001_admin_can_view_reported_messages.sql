-- TCUnnect: 20250908330001_admin_can_view_reported_messages.sql
-- Bug: messages SELECT was restricted to the two participants only (003).
-- That's correct for privacy in general, but it meant the admin Reports
-- tab's content-preview (built per the explicit request "the admin must
-- can see the thing that is reported") silently failed for message-type
-- reports specifically — RLS blocked the admin from reading the row at
-- all, falling back to the "(content not found)" placeholder even though
-- the message still existed.

create policy "admins can view all messages"
  on messages for select
  using (is_admin());
