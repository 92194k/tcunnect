-- TCUnnect: 20250908280001_admin_feed_posts.sql
-- Lets the admin optionally post non-anonymously (shown as "TCUnnect
-- Admin" instead of "Anonymous"). Regular posts stay structurally
-- anonymous — this column defaults false and can only be set true by an
-- actual admin session, enforced below, not just trusted from the client.

alter table feed_posts add column is_admin_post boolean not null default false;

drop policy "verified users can post to the feed" on feed_posts;

create policy "verified users can post to the feed"
  on feed_posts for insert
  with check (
    exists (select 1 from users u where u.auth_id = auth.uid() and u.is_verified)
    and (not is_admin_post or is_admin())
  );
