-- TCUnnect: 20250908290001_name_change_cooldown.sql

alter table users add column name_changed_at timestamptz;

create or replace function enforce_name_change_cooldown()
returns trigger
language plpgsql
as $$
begin
  if new.name is distinct from old.name then
    if old.name_changed_at is not null and now() - old.name_changed_at < interval '7 days' then
      raise exception 'You can only change your name once every 7 days. Try again after %.',
        (old.name_changed_at + interval '7 days')::date;
    end if;
    new.name_changed_at := now();
  end if;
  return new;
end;
$$;

create trigger trg_enforce_name_change_cooldown
  before update on users
  for each row execute function enforce_name_change_cooldown();
