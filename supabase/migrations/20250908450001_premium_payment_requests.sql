-- TCUnnect: 20250908450001_premium_payment_requests.sql
-- Manual GCash/Maya payment verification flow:
-- User pays via QR, submits reference number here,
-- admin verifies and approves which flips is_premium = true.

create table premium_payment_requests (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references users(id) on delete cascade,
  payment_method  text not null check (payment_method in ('gcash', 'maya')),
  reference_number text not null,
  amount          integer not null default 30,
  status          text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at      timestamptz not null default now(),
  resolved_at     timestamptz,
  resolved_by     uuid references users(id),
  notes           text
);

alter table premium_payment_requests enable row level security;

create policy "users can submit their own payment requests"
  on premium_payment_requests for insert
  with check (user_id = current_app_user_id());

create policy "users can view their own payment requests"
  on premium_payment_requests for select
  using (user_id = current_app_user_id());

create policy "admins can view all payment requests"
  on premium_payment_requests for select
  using (is_admin());

create policy "admins can update payment requests"
  on premium_payment_requests for update
  using (is_admin());

-- Notify admin when a new payment request comes in
create or replace function notify_admin_on_payment_request()
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
  if admin_id is null then return new; end if;

  select name into requester_name from users where id = new.user_id;

  insert into notifications (user_id, type, text, icon)
  values (
    admin_id,
    'admin',
    coalesce(requester_name, 'A user') || ' submitted a ₱30 ' || upper(new.payment_method) || ' payment (Ref: ' || new.reference_number || ')',
    '💰'
  );
  return new;
end;
$$;

create trigger trg_notify_admin_on_payment_request
  after insert on premium_payment_requests
  for each row execute function notify_admin_on_payment_request();

-- Approve: flip is_premium and mark request resolved
create or replace function admin_approve_payment(request_id uuid)
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
    raise exception 'Only admins can approve payments';
  end if;

  select user_id into target_user
  from premium_payment_requests
  where id = request_id and status = 'pending';

  if target_user is null then
    raise exception 'Request not found or already resolved';
  end if;

  update users set is_premium = true where id = target_user;

  update premium_payment_requests
  set status = 'approved', resolved_at = now(), resolved_by = me
  where id = request_id;
end;
$$;

-- Reject: mark as rejected, add optional note
create or replace function admin_reject_payment(request_id uuid, rejection_note text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := current_app_user_id();
begin
  if not is_admin() then
    raise exception 'Only admins can reject payments';
  end if;

  update premium_payment_requests
  set status = 'rejected', resolved_at = now(), resolved_by = me, notes = rejection_note
  where id = request_id and status = 'pending';
end;
$$;
