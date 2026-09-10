-- TCUnnect: 012_admin_feed_visibility.sql
-- Admins need to see REMOVED posts too (to review/restore), not just the
-- normal "not is_removed" policy every verified user gets.

create policy "admins can view all feed posts including removed"
  on feed_posts for select
  using (is_admin());
