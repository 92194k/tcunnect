-- TCUnnect: 20250908370001_admin_is_premium.sql
-- The admin account should always have Premium access — makes sense given
-- they need to see the full app to moderate it properly. This trigger
-- keeps it true automatically going forward (not just a one-time fix),
-- so it can never accidentally get toggled off.

create or replace function sync_admin_premium()
returns trigger
language plpgsql
as $$
begin
  if new.is_admin then
    new.is_premium := true;
  end if;
  return new;
end;
$$;

create trigger trg_sync_admin_premium
  before insert or update on users
  for each row execute function sync_admin_premium();

-- Apply it immediately to whichever account is already admin right now.
update users set is_premium = true where is_admin = true;
