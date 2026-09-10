-- TCUnnect: 019_protect_admin_from_ban.sql
-- The UI now blocks an admin from banning/suspending themselves, but that's
-- just app-layer convenience — this makes it impossible at the database
-- level too, in case of a bug, a future UI change, or direct SQL access.
-- Combined with the single-admin constraint (016), this guarantees the one
-- admin account can never be locked out by any path.

create or replace function prevent_admin_ban()
returns trigger
language plpgsql
as $$
begin
  if new.is_admin and (new.is_banned or new.is_suspended_until is not null) then
    raise exception 'The admin account cannot be banned or suspended.';
  end if;
  return new;
end;
$$;

create trigger trg_prevent_admin_ban
  before update on users
  for each row execute function prevent_admin_ban();
