-- TCUnnect: 001_core_schema.sql
-- Users, verification, discovery/likes/matches, messaging.
-- Run via: supabase db push  (or supabase migration up locally)

create extension if not exists "pgcrypto"; -- gen_random_uuid()

create table users (
  id                  uuid primary key default gen_random_uuid(),
  auth_id             uuid unique not null references auth.users(id) on delete cascade,
  email               text unique not null,
  name                text not null,
  dept                text not null check (dept in ('CICT','COED','CBA','CCS','CON','COE','Other')),
  year_level          text not null check (year_level in ('1st Year','2nd Year','3rd Year','4th Year')),
  program             text,
  bio                 text check (char_length(bio) <= 150),
  interests           text[] not null default '{}',
  photo_url           text,
  date_of_birth       date not null,
  is_verified         boolean not null default false,
  verification_status text not null default 'pending' check (verification_status in ('pending','approved','rejected')),
  is_premium          boolean not null default false,
  is_admin            boolean not null default false,
  is_banned           boolean not null default false,
  is_suspended_until  timestamptz,
  created_at          timestamptz not null default now(),

  constraint interests_min_5 check (
    verification_status <> 'approved' or array_length(interests, 1) >= 5
  )
);

create index idx_users_dept on users(dept);
create index idx_users_verification_status on users(verification_status);

create table verification_submissions (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references users(id) on delete cascade,
  id_document_url    text not null,
  selfie_url         text not null,
  face_match_score   numeric,
  face_match_passed  boolean,
  reviewed_by        uuid references users(id),
  review_notes       text,
  status             text not null default 'pending' check (status in ('pending','approved','rejected')),
  submitted_at       timestamptz not null default now(),
  reviewed_at        timestamptz
);

create index idx_verif_status on verification_submissions(status);
create index idx_verif_user on verification_submissions(user_id);

create table likes (
  id          uuid primary key default gen_random_uuid(),
  from_user   uuid not null references users(id) on delete cascade,
  to_user     uuid not null references users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (from_user, to_user),
  check (from_user <> to_user)
);

create index idx_likes_to_user on likes(to_user);

create table matches (
  id            uuid primary key default gen_random_uuid(),
  user_a        uuid not null references users(id) on delete cascade,
  user_b        uuid not null references users(id) on delete cascade,
  matched_at    timestamptz not null default now(),
  unmatched_at  timestamptz,
  unmatched_by  uuid references users(id),
  check (user_a <> user_b)
);

create index idx_matches_user_a on matches(user_a);
create index idx_matches_user_b on matches(user_b);

create table messages (
  id          uuid primary key default gen_random_uuid(),
  match_id    uuid not null references matches(id) on delete cascade,
  sender_id   uuid not null references users(id),
  text        text not null,
  sent_at     timestamptz not null default now(),
  seen_at     timestamptz
);

create index idx_messages_match on messages(match_id, sent_at);
