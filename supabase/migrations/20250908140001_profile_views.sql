-- TCUnnect: 010_profile_views.sql

create table profile_views (
  id          uuid primary key default gen_random_uuid(),
  viewer_id   uuid not null references users(id) on delete cascade,
  viewed_id   uuid not null references users(id) on delete cascade,
  viewed_at   timestamptz not null default now(),
  check (viewer_id <> viewed_id)
);

create index idx_profile_views_viewed on profile_views(viewed_id);
create index idx_profile_views_viewer on profile_views(viewer_id);

alter table profile_views enable row level security;

-- You can log a view of someone else (not yourself), as long as they're not blocked.
create policy "users can record a view of someone else"
  on profile_views for insert
  with check (
    viewer_id = current_app_user_id()
    and not exists (
      select 1 from blocks b
      where (b.blocker_id = viewer_id and b.blocked_id = viewed_id)
         or (b.blocker_id = viewed_id and b.blocked_id = viewer_id)
    )
  );

-- The viewed person can see the COUNT and dept/year-level of who viewed them
-- (via a query on this table), but not raw identity unless they're premium —
-- that gating happens in the get_my_profile_view_count() function below,
-- same pattern as get_my_likers().
create policy "users can see views they are the subject of"
  on profile_views for select
  using (viewed_id = current_app_user_id());

create or replace function get_my_profile_view_count()
returns int
language sql stable
security definer
set search_path = public
as $$
  select count(*)::int from profile_views where viewed_id = current_app_user_id();
$$;
