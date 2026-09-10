-- TCUnnect: 20250908270001_fix_likers_add_viewers.sql
--
-- Bug fix: get_my_likers()'s RETURNS TABLE declares an output column named
-- `interests`. Inside the function body, `select is_premium, interests
-- into ...` referenced `interests` unqualified — Postgres couldn't tell if
-- that meant the users.interests column or the function's own output
-- column of the same name, causing "column reference is ambiguous" at
-- call time. Fixing by qualifying every column with its table alias.

create or replace function get_my_likers()
returns table (
  like_id uuid,
  liked_at timestamptz,
  dept text,
  year_level text,
  shared_interest_count int,
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
  select u.is_premium, u.interests into premium, my_interests
  from users u where u.id = me;

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

-- New: same gating pattern, for the "Views" tab (who viewed your profile).
create or replace function get_my_viewers()
returns table (
  view_id uuid,
  viewed_at timestamptz,
  dept text,
  year_level text,
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
begin
  select u.is_premium into premium from users u where u.id = me;

  return query
  select
    pv.id,
    pv.viewed_at,
    u.dept,
    u.year_level,
    case when premium then u.id else null end,
    case when premium then u.name else null end,
    case when premium then u.photo_url else null end,
    case when premium then u.interests else null end
  from profile_views pv
  join users u on u.id = pv.viewer_id
  where pv.viewed_id = me
  order by pv.viewed_at desc
  limit 100;
end;
$$;
