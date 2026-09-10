-- TCUnnect: 017_admin_delete_rights.sql
-- Admins can already UPDATE feed_posts (is_removed toggle) and reports, but
-- there was no DELETE policy on either table — needed now that Posts moves
-- from soft-remove to real deletion, and Reports gets a "Delete" action.

create policy "admins can delete feed posts"
  on feed_posts for delete
  using (is_admin());

create policy "admins can delete reports"
  on reports for delete
  using (is_admin());
