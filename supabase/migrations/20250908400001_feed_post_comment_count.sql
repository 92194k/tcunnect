-- TCUnnect: 20250908400001_feed_post_comment_count.sql
-- Comments were only counted after a post's comments were expanded/loaded
-- (lazy-loaded per click), so the count shown on the post itself was blank
-- until then. This adds a real denormalized counter, same pattern as
-- upvotes, kept in sync automatically via triggers instead of needing to
-- load every comment just to know how many there are.

alter table feed_posts add column comment_count integer not null default 0;

create or replace function adjust_feed_post_comment_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if TG_OP = 'INSERT' then
    update feed_posts set comment_count = comment_count + 1 where id = new.post_id;
    return new;
  elsif TG_OP = 'DELETE' then
    update feed_posts set comment_count = greatest(comment_count - 1, 0) where id = old.post_id;
    return old;
  end if;
  return null;
end;
$$;

create trigger trg_feed_comment_count_insert
  after insert on feed_comments
  for each row execute function adjust_feed_post_comment_count();

create trigger trg_feed_comment_count_delete
  after delete on feed_comments
  for each row execute function adjust_feed_post_comment_count();

-- Backfill existing posts so counts aren't zero for comments already there.
update feed_posts fp
set comment_count = (select count(*) from feed_comments fc where fc.post_id = fp.id);
