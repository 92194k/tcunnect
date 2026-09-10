-- TCUnnect: 20250908410001_report_resolution_notify_reporter.sql

-- BUG FIX: admin could delete reported posts and messages, but never got
-- delete rights on comments — deleteReportedContent('feed_comment', ...)
-- has been silently failing this whole time.
create policy "admins can delete feed comments"
  on feed_comments for delete
  using (is_admin());

-- FEATURE: after an admin resolves a report, automatically message the
-- reporter (as the admin, in a real conversation they can reply to or
-- ignore) explaining what happened with their report. Uses the existing
-- messaging system — creates/reactivates a match between admin and
-- reporter if one doesn't already exist, since they're very likely not
-- otherwise matched.
create or replace function admin_notify_reporter(target_report_id uuid, resolution_text text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := current_app_user_id();
  reporter uuid;
  existing_match matches%rowtype;
  target_match_id uuid;
begin
  if not is_admin() then
    raise exception 'Only admins can notify reporters';
  end if;

  select reporter_id into reporter from reports where id = target_report_id;
  if reporter is null then
    raise exception 'Report not found';
  end if;

  if reporter = me then
    -- Admin reported something themselves — nothing to notify, skip quietly.
    return;
  end if;

  select * into existing_match from matches
    where user_a = least(me, reporter) and user_b = greatest(me, reporter);

  if existing_match.id is null then
    insert into matches (user_a, user_b)
    values (least(me, reporter), greatest(me, reporter))
    returning id into target_match_id;
  else
    target_match_id := existing_match.id;
    if existing_match.unmatched_at is not null then
      update matches set unmatched_at = null, unmatched_by = null, matched_at = now()
      where id = target_match_id;
    end if;
  end if;

  insert into messages (match_id, sender_id, text)
  values (target_match_id, me, resolution_text);
end;
$$;
