-- TCUnnect: 20250908320001_fix_toggle_upvote_ambiguity.sql
-- Same bug class as 20250908270001's get_my_likers() fix: the function's
-- RETURNS TABLE declares an output column named `upvotes`, and the UPDATE
-- statements inside referenced `upvotes` unqualified — Postgres couldn't
-- tell if that meant feed_posts.upvotes or the function's own output
-- column, causing "column reference upvotes is ambiguous".

create or replace function toggle_feed_upvote(target_post_id uuid)
returns table (upvotes int, now_voted boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := current_app_user_id();
  already_voted boolean;
begin
  if me is null then
    raise exception 'Not authenticated';
  end if;

  select exists (
    select 1 from feed_post_votes where post_id = target_post_id and voter_id = me
  ) into already_voted;

  if already_voted then
    delete from feed_post_votes where post_id = target_post_id and voter_id = me;
    update feed_posts set upvotes = feed_posts.upvotes - 1 where id = target_post_id;
  else
    insert into feed_post_votes (post_id, voter_id) values (target_post_id, me);
    update feed_posts set upvotes = feed_posts.upvotes + 1 where id = target_post_id;
  end if;

  return query select fp.upvotes, not already_voted from feed_posts fp where fp.id = target_post_id;
end;
$$;
