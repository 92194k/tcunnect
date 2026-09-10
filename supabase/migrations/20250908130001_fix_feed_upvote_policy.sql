-- TCUnnect: 009_fix_feed_upvote_policy.sql
-- Bug fix: 003_row_level_security.sql only gave ADMINS an UPDATE policy on
-- feed_posts (for moderation). Regular verified users had no way to update
-- the upvotes counter, so every upvote click would silently fail.
--
-- Note: RLS can't cleanly restrict this to "only the upvotes column" without
-- a trigger — a determined client could technically rewrite a post's text
-- via this same policy. Acceptable for MVP; if that becomes a real concern,
-- move upvoting into a SECURITY DEFINER function (like like_user()) that
-- only touches the upvotes column, similar to how likes/matches are handled.

create policy "verified users can update feed post upvotes"
  on feed_posts for update
  using (
    not is_removed
    and exists (select 1 from users u where u.auth_id = auth.uid() and u.is_verified)
  );
