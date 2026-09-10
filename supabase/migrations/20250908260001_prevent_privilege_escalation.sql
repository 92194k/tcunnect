-- TCUnnect: 022_prevent_privilege_escalation.sql
--
-- ** IMPORTANT SECURITY FIX **
-- The "users can update their own profile fields" policy (003) only checks
-- WHO is updating (auth_id = auth.uid()), never WHICH COLUMNS. That means
-- any signed-in user could currently run, from the browser console:
--   supabase.from('users').update({ is_admin: true, is_verified: true,
--     is_premium: true }).eq('id', myOwnId)
-- ...and it would succeed, self-granting admin/verified/premium status.
-- The same gap existed on INSERT (a malicious signup payload could include
-- is_admin: true). This trigger closes both paths: for any INSERT or
-- UPDATE performed by someone who is NOT already an admin, it forces the
-- privilege columns back to safe values, no matter what the client sent.
-- Real admin actions (via the Users/Reports tabs) still work normally,
-- since those are performed by a session where is_admin() is true.

create or replace function enforce_privilege_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if is_admin() then
    return new; -- trusted: this change is coming from the admin panel
  end if;

  if TG_OP = 'INSERT' then
    new.is_admin := false;
    new.is_verified := false;
    new.is_premium := false;
    new.is_banned := false;
    new.is_suspended_until := null;
    new.verification_status := 'pending';
  elsif TG_OP = 'UPDATE' then
    new.is_admin := old.is_admin;
    new.is_verified := old.is_verified;
    new.is_premium := old.is_premium;
    new.is_banned := old.is_banned;
    new.is_suspended_until := old.is_suspended_until;
    new.verification_status := old.verification_status;
  end if;

  return new;
end;
$$;

create trigger trg_enforce_privilege_columns
  before insert or update on users
  for each row execute function enforce_privilege_columns();
