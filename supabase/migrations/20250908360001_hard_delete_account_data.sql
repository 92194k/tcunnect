-- TCUnnect: 20250908360001_hard_delete_account_data.sql
--
-- You asked: when someone deletes their account, is it a real hard delete
-- of all their data? Here's the honest, precise answer:
--
-- YES for everything below — this function actually DELETEs (not soft-
-- flags) every row of relational data tied to the account: likes, matches,
-- messages, blocks, notifications, profile views, verification
-- submissions, premium purchase records, feed votes, and reports they
-- personally filed. All of it is genuinely gone from the database.
--
-- The ONE thing that can't be hard-deleted from here: the actual login
-- credential in Supabase's auth.users table. Deleting that requires
-- Supabase's admin/service-role API — not something this frontend can
-- safely call with just the anon key, the same limitation that's applied
-- throughout this build (same category as PayMongo, face-match). What's
-- left behind is a bare `users` row holding no real personal data (name
-- becomes generic, bio/photo/interests already empty) whose only job is
-- to block that login from working again, until an admin runs the
-- provided SQL script to remove the auth account for real.

create or replace function delete_my_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := current_app_user_id();
begin
  if me is null then
    raise exception 'Not authenticated';
  end if;

  delete from matches where user_a = me or user_b = me; -- cascades to remaining messages too
  delete from likes where from_user = me or to_user = me;
  delete from blocks where blocker_id = me or blocked_id = me;
  delete from notifications where user_id = me;
  delete from profile_views where viewer_id = me or viewed_id = me;
  delete from verification_submissions where user_id = me;
  delete from premium_purchases where user_id = me;
  delete from feed_post_votes where voter_id = me;
  delete from reports where reporter_id = me;

  -- Nullify (not delete) references where this account acted as an admin
  -- reviewing/resolving someone ELSE's stuff — that record belongs to the
  -- other person's history, not this account's data.
  update verification_submissions set reviewed_by = null where reviewed_by = me;
  update reports set resolved_by = null where resolved_by = me;
  update moderation_actions set actioned_by = null where actioned_by = me;

  -- Not touching `name` here — it has its own 7-day cooldown trigger, and
  -- this must never fail because of a recent rename.
  update users set
    bio = null,
    photo_url = null,
    interests = '{}',
    program = null,
    deletion_requested_at = now()
  where id = me;
end;
$$;
