-- TCUnnect: 004_rpc_functions.sql
-- Replaces the frontend's `Math.random() > 0.5` match simulation and gives
-- LikesView a real, safe way to read likers without exposing raw rows.

-- ============================================
-- like_user(): call this instead of inserting into `likes` directly.
-- Detects mutual likes and creates the match server-side.
-- ============================================
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
    on conflict do nothing
    returning id into new_match_id;

    if new_match_id is null then
      select id into new_match_id from matches
      where user_a = least(me, target_user_id) and user_b = greatest(me, target_user_id);
    end if;

    return query select true, new_match_id;
  else
    return query select false, null::uuid;
  end if;
end;
$$;

-- Prevent duplicate match rows for the same pair (needed for the ON CONFLICT above)
create unique index if not exists idx_matches_unique_pair on matches(user_a, user_b);

-- ============================================
-- get_my_likers(): what LikesView calls. Free users get blurred/anonymized
-- rows; premium users get full identity. Gating happens IN THE FUNCTION,
-- not in frontend conditional rendering, so there's no way to bypass it
-- by inspecting network responses.
-- ============================================
create or replace function get_my_likers()
returns table (
  like_id uuid,
  liked_at timestamptz,
  dept text,
  year_level text,
  shared_interest_count int,
  -- null for free users; populated only when the caller is premium
  user_id uuid,
  name text,
  photo_url text,
  interests text[]
)
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := current_app_user_id();
  premium boolean;
  my_interests text[];
begin
  select is_premium, interests into premium, my_interests
  from users where id = me;

  return query
  select
    l.id,
    l.created_at,
    u.dept,
    u.year_level,
    (select count(*)::int from unnest(u.interests) i where i = any(my_interests)),
    case when premium then u.id else null end,
    case when premium then u.name else null end,
    case when premium then u.photo_url else null end,
    case when premium then u.interests else null end
  from likes l
  join users u on u.id = l.from_user
  where l.to_user = me
    and not exists (
      select 1 from matches m
      where m.user_a = least(me, u.id) and m.user_b = greatest(me, u.id)
        and m.unmatched_at is null
    )
  order by l.created_at desc;
end;
$$;
