-- TCUnnect: 013_feed_post_votes.sql
-- Replaces the naive "anyone can increment/decrement the counter" approach
-- (009_fix_feed_upvote_policy.sql) with real one-vote-per-user enforcement.

create table feed_post_votes (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references feed_posts(id) on delete cascade,
  voter_id    uuid not null references users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (post_id, voter_id)
);

alter table feed_post_votes enable row level security;

create policy "users can view their own votes"
  on feed_post_votes for select
  using (voter_id = current_app_user_id());

-- No direct insert/delete policy for regular users — voting only happens
-- through toggle_feed_upvote() below (SECURITY DEFINER), which also keeps
-- feed_posts.upvotes in sync atomically. Prevents a client from voting
-- without the counter updating, or vice versa.

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
    update feed_posts set upvotes = upvotes - 1 where id = target_post_id;
  else
    insert into feed_post_votes (post_id, voter_id) values (target_post_id, me);
    update feed_posts set upvotes = upvotes + 1 where id = target_post_id;
  end if;

  return query select fp.upvotes, not already_voted from feed_posts fp where fp.id = target_post_id;
end;
$$;

-- Now that voting goes through toggle_feed_upvote() (which bypasses RLS via
-- SECURITY DEFINER, touching only the upvotes column), we no longer need
-- the broad "any verified user can UPDATE any feed_post" policy from
-- 009_fix_feed_upvote_policy.sql — that one technically let a client rewrite
-- someone else's post text too. Removing it closes that gap.
drop policy if exists "verified users can update feed post upvotes" on feed_posts;
