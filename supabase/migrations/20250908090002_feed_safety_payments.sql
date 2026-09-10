-- TCUnnect: 002_feed_safety_payments.sql

create table feed_posts (
  id                   uuid primary key default gen_random_uuid(),
  -- deliberately NO user_id column: anonymity is structural, not UI-hidden
  poster_session_hash  text not null,
  dept_tag             text check (dept_tag in ('CICT','COED','CBA','CCS','CON','COE','Other') or dept_tag is null),
  text                 text not null check (char_length(text) <= 500),
  photo_url            text,
  upvotes              int not null default 0,
  created_at           timestamptz not null default now(),
  is_removed           boolean not null default false
);

create index idx_feed_posts_created on feed_posts(created_at desc) where not is_removed;

create table feed_comments (
  id                   uuid primary key default gen_random_uuid(),
  post_id              uuid not null references feed_posts(id) on delete cascade,
  poster_session_hash  text not null,
  text                 text not null,
  created_at           timestamptz not null default now(),
  is_removed           boolean not null default false
);

create index idx_feed_comments_post on feed_comments(post_id);

create table reports (
  id            uuid primary key default gen_random_uuid(),
  reporter_id   uuid not null references users(id),
  target_type   text not null check (target_type in ('user','feed_post','feed_comment','message')),
  target_id     uuid not null,
  reason        text not null,
  details       text,
  status        text not null default 'open' check (status in ('open','reviewing','actioned','dismissed')),
  created_at    timestamptz not null default now(),
  resolved_by   uuid references users(id),
  resolved_at   timestamptz
);

create index idx_reports_status on reports(status);

create table blocks (
  id          uuid primary key default gen_random_uuid(),
  blocker_id  uuid not null references users(id) on delete cascade,
  blocked_id  uuid not null references users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create index idx_blocks_blocker on blocks(blocker_id);
create index idx_blocks_blocked on blocks(blocked_id);

create table moderation_actions (
  id            uuid primary key default gen_random_uuid(),
  target_user   uuid not null references users(id),
  action        text not null check (action in ('warn','suspend','ban','content_removed')),
  reason        text not null,
  actioned_by   uuid not null references users(id),
  duration_days int,
  created_at    timestamptz not null default now()
);

create table premium_purchases (
  id                          uuid primary key default gen_random_uuid(),
  user_id                     uuid not null references users(id) on delete cascade,
  amount_php                  numeric not null default 30,
  payment_method              text not null check (payment_method in ('gcash','maya','card')),
  paymongo_checkout_session_id text,
  status                      text not null default 'pending' check (status in ('pending','paid','failed')),
  webhook_verified_at         timestamptz,
  created_at                  timestamptz not null default now()
);

create index idx_premium_purchases_user on premium_purchases(user_id);
