-- TCUnnect: 011_notifications.sql

create table notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users(id) on delete cascade,
  type        text not null check (type in ('like', 'match', 'message', 'admin')),
  text        text not null,
  icon        text not null default '🔔',
  is_read     boolean not null default false,
  created_at  timestamptz not null default now()
);

create index idx_notifications_user on notifications(user_id, created_at desc);

alter table notifications enable row level security;

create policy "users can view their own notifications"
  on notifications for select
  using (user_id = current_app_user_id());

create policy "users can mark their own notifications read"
  on notifications for update
  using (user_id = current_app_user_id());

-- No insert policy for regular users — notifications are only ever created
-- by the triggers below (running as the table owner) or by admins directly.

-- ============================================
-- Trigger: new like -> notify the recipient
-- (Doesn't reveal identity in the text, matching the free-tier blur rule.)
-- ============================================
create or replace function notify_on_like()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  liker_dept text;
begin
  select dept into liker_dept from users where id = new.from_user;
  insert into notifications (user_id, type, text, icon)
  values (new.to_user, 'like', 'Someone from ' || coalesce(liker_dept, 'your campus') || ' liked you 👀', '❤️');
  return new;
end;
$$;

create trigger trg_notify_on_like
  after insert on likes
  for each row execute function notify_on_like();

-- ============================================
-- Trigger: new match -> notify BOTH participants
-- ============================================
create or replace function notify_on_match()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  name_a text;
  name_b text;
begin
  select name into name_a from users where id = new.user_a;
  select name into name_b from users where id = new.user_b;
  insert into notifications (user_id, type, text, icon) values
    (new.user_a, 'match', 'You matched with ' || coalesce(name_b, 'someone') || '! 🎉', '🎉'),
    (new.user_b, 'match', 'You matched with ' || coalesce(name_a, 'someone') || '! 🎉', '🎉');
  return new;
end;
$$;

create trigger trg_notify_on_match
  after insert on matches
  for each row execute function notify_on_match();

-- ============================================
-- Trigger: new message -> notify the recipient (not the sender)
-- ============================================
create or replace function notify_on_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  recipient_id uuid;
  sender_name text;
begin
  select case when user_a = new.sender_id then user_b else user_a end
    into recipient_id
    from matches where id = new.match_id;

  select name into sender_name from users where id = new.sender_id;

  insert into notifications (user_id, type, text, icon)
  values (recipient_id, 'message', coalesce(sender_name, 'Someone') || ' sent you a message 💬', '💬');
  return new;
end;
$$;

create trigger trg_notify_on_message
  after insert on messages
  for each row execute function notify_on_message();
