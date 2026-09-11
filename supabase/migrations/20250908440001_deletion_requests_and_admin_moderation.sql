-- TCUnnect: 20250908440001_deletion_requests_and_admin_moderation.sql
--
-- Redesigns account deletion: instead of instantly purging data, the user
-- submits a REQUEST with a reason. The admin reviews it and either approves
-- (which then runs the real data purge) or denies it. This also means the
-- account isn't touched at all until approved — so re-signup blocking only
-- kicks in once an admin has actually approved a deletion.

create table account_deletion_requests (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references users(id) on delete cascade,
  reason        text not null,
  details       text,
  status        text not null default 'pending' check (status in ('pending', 'approved', 'denied')),
  created_at    timestamptz not null default now(),
  resolved_at   timestamptz,
  resolved_by   uuid references users(id)
);

alter table account_deletion_requests enable row level security;

create policy "users can create their own deletion request"
  on account_deletion_requests for insert
  with check (user_id = current_app_user_id());

create policy "users can view their own deletion requests"
  on account_deletion_requests for select
  using (user_id = current_app_user_id());

create policy "admins can view all deletion requests"
  on account_deletion_requests for select
  using (is_admin());

create policy "admins can update deletion requests"
  on account_deletion_requests for update
  using (is_admin());

-- Notify the admin the instant a deletion request comes in — reuses the
-- existing notifications table/pattern (like/match/message triggers).
create or replace function notify_admin_on_deletion_request()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  admin_id uuid;
  requester_name text;
begin
  select id into admin_id from users where is_admin = true limit 1;
  if admin_id is null then
    return new; -- no admin configured yet, nothing to notify
  end if;

  select name into requester_name from users where id = new.user_id;

  insert into notifications (user_id, type, text, icon)
  values (admin_id, 'admin', coalesce(requester_name, 'A user') || ' requested account deletion: "' || new.reason || '"', '🗑️');
  return new;
end;
$$;

create trigger trg_notify_admin_on_deletion_request
  after insert on account_deletion_requests
  for each row execute function notify_admin_on_deletion_request();

-- Runs the REAL data purge (same scope as the old self-service version),
-- but only callable by an admin approving a specific request — the user's
-- own button no longer does this directly anymore.
create or replace function admin_approve_deletion(request_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := current_app_user_id();
  target_user uuid;
begin
  if not is_admin() then
    raise exception 'Only admins can approve deletion requests';
  end if;

  select user_id into target_user from account_deletion_requests where id = request_id and status = 'pending';
  if target_user is null then
    raise exception 'Request not found or already resolved';
  end if;

  delete from matches where user_a = target_user or user_b = target_user;
  delete from likes where from_user = target_user or to_user = target_user;
  delete from blocks where blocker_id = target_user or blocked_id = target_user;
  delete from notifications where user_id = target_user;
  delete from profile_views where viewer_id = target_user or viewed_id = target_user;
  delete from verification_submissions where user_id = target_user;
  delete from premium_purchases where user_id = target_user;
  delete from feed_post_votes where voter_id = target_user;
  delete from reports where reporter_id = target_user;
  delete from feed_comments where user_id = target_user;

  update verification_submissions set reviewed_by = null where reviewed_by = target_user;
  update reports set resolved_by = null where resolved_by = target_user;
  update moderation_actions set actioned_by = null where actioned_by = target_user;

  update users set
    bio = null,
    photo_url = null,
    interests = '{}',
    program = null,
    deletion_requested_at = now()
  where id = target_user;

  update account_deletion_requests
  set status = 'approved', resolved_at = now(), resolved_by = me
  where id = request_id;
end;
$$;

create or replace function admin_deny_deletion(request_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := current_app_user_id();
begin
  if not is_admin() then
    raise exception 'Only admins can deny deletion requests';
  end if;

  update account_deletion_requests
  set status = 'denied', resolved_at = now(), resolved_by = me
  where id = request_id and status = 'pending';
end;
$$;
