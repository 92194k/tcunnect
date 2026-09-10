-- TCUnnect: 20250908380001_comments_identity_and_replies.sql
--
-- Change: feed POSTS stay structurally anonymous (no user_id column exists
-- at all, by design). Feed COMMENTS are different now — they show the real
-- commenter's identity, per explicit request, and support threaded replies
-- (a comment can reply to another comment via parent_comment_id).

alter table feed_comments add column user_id uuid references users(id) on delete cascade;
alter table feed_comments add column parent_comment_id uuid references feed_comments(id) on delete cascade;

create index idx_feed_comments_parent on feed_comments(parent_comment_id);

-- Replace the old anonymous-style insert policy with one that requires the
-- real user_id to match the actual caller (can't post a comment as someone
-- else), on top of the existing verified-only requirement.
drop policy "verified users can comment" on feed_comments;

create policy "verified users can comment with their real identity"
  on feed_comments for insert
  with check (
    user_id = current_app_user_id()
    and exists (select 1 from users u where u.auth_id = auth.uid() and u.is_verified)
  );
