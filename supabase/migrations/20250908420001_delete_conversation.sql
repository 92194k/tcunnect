-- TCUnnect: 20250908420001_delete_conversation.sql
-- Different from unmatch_users() on purpose: unmatching deliberately KEEPS
-- the match/message history as a record (per the original design). This is
-- for when someone genuinely wants a conversation gone completely — a real
-- hard delete of the match row and every message in it, for BOTH
-- participants, no trace left. Irreversible.

create or replace function delete_conversation(target_match_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := current_app_user_id();
  match_row matches%rowtype;
begin
  if me is null then
    raise exception 'Not authenticated';
  end if;

  select * into match_row from matches where id = target_match_id;
  if match_row.id is null then
    raise exception 'Conversation not found';
  end if;
  if match_row.user_a <> me and match_row.user_b <> me then
    raise exception 'You are not a participant in this conversation';
  end if;

  -- messages cascade-delete automatically via their match_id foreign key,
  -- this removes the match row (and therefore the messages) entirely.
  delete from matches where id = target_match_id;
end;
$$;
