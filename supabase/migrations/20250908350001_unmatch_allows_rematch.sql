-- TCUnnect: 20250908350001_unmatch_allows_rematch.sql
--
-- Bug: unmatch() only set matches.unmatched_at — it never touched the
-- underlying `likes` rows. Discover's candidate query excludes anyone
-- already in your `likes` table, so once two people matched, unmatching
-- them did NOT make them reappear in each other's Discover, and re-liking
-- was structurally impossible without their old like being cleared first.
-- This directly contradicts the required behavior: "Both users appear in
-- Discover again... They can swipe/match with each other again."
--
-- Fix: a proper unmatch_users() function that deletes BOTH directions'
-- like rows when unmatching, run as SECURITY DEFINER so a single self-
-- initiated action can clean up the other person's like row too (RLS
-- alone can't grant that safely without this).

create or replace function unmatch_users(target_match_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := current_app_user_id();
  match_row matches%rowtype;
begin
  if me is null then
    raise exception 'Not authenticated';
  end if;

  select * into match_row from matches where id = target_match_id;
  if match_row.id is null then
    raise exception 'Match not found';
  end if;
  if match_row.user_a <> me and match_row.user_b <> me then
    raise exception 'You are not a participant in this match';
  end if;

  update matches set unmatched_at = now(), unmatched_by = me where id = target_match_id;

  delete from likes
  where (from_user = match_row.user_a and to_user = match_row.user_b)
     or (from_user = match_row.user_b and to_user = match_row.user_a);
end;
$$;

-- Second half of the same bug: even with likes cleared, re-liking each
-- other would try to INSERT a new matches row for the same pair — but a
-- unique index already exists on (user_a, user_b) from the FIRST match,
-- so the insert would silently do nothing and the old, still-unmatched
-- row would be reused untouched. Switching to ON CONFLICT DO UPDATE
-- properly reactivates it: clears unmatched_at, refreshes matched_at.

create or replace function like_user(target_user_id uuid)
returns table (matched boolean, match_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := current_app_user_id();
  mutual boolean;
  new_match_id uuid;
begin
  if me is null then
    raise exception 'Not authenticated';
  end if;

  if exists (
    select 1 from blocks b
    where (b.blocker_id = me and b.blocked_id = target_user_id)
       or (b.blocker_id = target_user_id and b.blocked_id = me)
  ) then
    raise exception 'Cannot like a blocked user';
  end if;

  insert into likes (from_user, to_user)
  values (me, target_user_id)
  on conflict (from_user, to_user) do nothing;

  select exists (
    select 1 from likes
    where from_user = target_user_id and to_user = me
  ) into mutual;

  if mutual then
    insert into matches (user_a, user_b)
    values (least(me, target_user_id), greatest(me, target_user_id))
    on conflict (user_a, user_b) do update
      set unmatched_at = null, unmatched_by = null, matched_at = now()
    returning id into new_match_id;

    return query select true, new_match_id;
  else
    return query select false, null::uuid;
  end if;
end;
$$;
