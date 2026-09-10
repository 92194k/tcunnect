-- TCUnnect: 021_block_prevents_messaging.sql
-- Blocking no longer unmatches (see app-layer change in Dashboard.tsx) so
-- the conversation stays visible to the blocker as a record. But that means
-- the match itself is still "active", so without this, either side could
-- still technically send new messages through it. This closes that gap at
-- the database level, not just by disabling the UI input box.

drop policy "participants can send messages in their active matches" on messages;

create policy "participants can send messages in their active, non-blocked matches"
  on messages for insert
  with check (
    sender_id = current_app_user_id()
    and exists (
      select 1 from matches m
      where m.id = messages.match_id
        and m.unmatched_at is null
        and (m.user_a = current_app_user_id() or m.user_b = current_app_user_id())
    )
    and not exists (
      select 1 from blocks b
      join matches m on m.id = messages.match_id
      where (b.blocker_id = m.user_a and b.blocked_id = m.user_b)
         or (b.blocker_id = m.user_b and b.blocked_id = m.user_a)
    )
  );
