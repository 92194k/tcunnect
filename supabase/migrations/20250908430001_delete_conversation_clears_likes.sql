-- TCUnnect: 20250908430001_delete_conversation_clears_likes.sql
-- Bug: delete_conversation() only removed the match/messages, but never
-- cleared the underlying `likes` rows — same gap unmatch_users() originally
-- had (see 20250908350001). Discover excludes anyone already in your
-- `likes` table, so without this, a deleted conversation's other person
-- would stay hidden from Discover forever, even though nothing else
-- connects you anymore.

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

  delete from likes
  where (from_user = match_row.user_a and to_user = match_row.user_b)
     or (from_user = match_row.user_b and to_user = match_row.user_a);

  -- messages cascade-delete automatically via their match_id foreign key.
  delete from matches where id = target_match_id;
end;
$$;
