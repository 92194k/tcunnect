-- ─────────────────────────────────────────────────────────────
-- TCUnnect · Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ─────────────────────────────────────────────────────────────

-- Enable UUID extension (already enabled on Supabase)
create extension if not exists "uuid-ossp";

-- ─── Profiles ─────────────────────────────────────────────────
-- Extends Supabase auth.users with app-specific data
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text not null,
  full_name     text not null default '',
  age           int,
  bio           text not null default '',
  location      text not null default '',
  profile_photo text not null default '',
  travel_interests text[] not null default '{}',
  is_premium    boolean not null default false,
  is_verified   boolean not null default false,
  is_admin      boolean not null default false,
  created_at    timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can insert their own profile"
  on public.profiles for insert with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── Likes ────────────────────────────────────────────────────
create table if not exists public.likes (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  liked_user_id uuid not null references public.profiles(id) on delete cascade,
  created_at    timestamptz not null default now(),
  unique(user_id, liked_user_id)
);

alter table public.likes enable row level security;

create policy "Users can see their own likes"
  on public.likes for select using (auth.uid() = user_id);

create policy "Users can insert their own likes"
  on public.likes for insert with check (auth.uid() = user_id);

create policy "Users can delete their own likes"
  on public.likes for delete using (auth.uid() = user_id);

-- ─── Matches ──────────────────────────────────────────────────
create table if not exists public.matches (
  id         uuid primary key default uuid_generate_v4(),
  user1_id   uuid not null references public.profiles(id) on delete cascade,
  user2_id   uuid not null references public.profiles(id) on delete cascade,
  status     text not null default 'active' check (status in ('active', 'blocked', 'archived')),
  created_at timestamptz not null default now(),
  unique(user1_id, user2_id)
);

alter table public.matches enable row level security;

create policy "Users can see their own matches"
  on public.matches for select
  using (auth.uid() = user1_id or auth.uid() = user2_id);

-- Auto-create match when mutual like occurs
create or replace function public.handle_mutual_like()
returns trigger as $$
begin
  if exists (
    select 1 from public.likes
    where user_id = new.liked_user_id and liked_user_id = new.user_id
  ) then
    insert into public.matches (user1_id, user2_id)
    values (least(new.user_id, new.liked_user_id), greatest(new.user_id, new.liked_user_id))
    on conflict do nothing;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_like_inserted on public.likes;
create trigger on_like_inserted
  after insert on public.likes
  for each row execute procedure public.handle_mutual_like();

-- ─── Messages ─────────────────────────────────────────────────
create table if not exists public.messages (
  id         uuid primary key default uuid_generate_v4(),
  match_id   uuid not null references public.matches(id) on delete cascade,
  sender_id  uuid not null references public.profiles(id) on delete cascade,
  content    text not null,
  read       boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.messages enable row level security;

create policy "Users can read messages in their matches"
  on public.messages for select
  using (
    exists (
      select 1 from public.matches m
      where m.id = match_id
        and (m.user1_id = auth.uid() or m.user2_id = auth.uid())
    )
  );

create policy "Users can send messages in their matches"
  on public.messages for insert
  with check (
    auth.uid() = sender_id and
    exists (
      select 1 from public.matches m
      where m.id = match_id
        and (m.user1_id = auth.uid() or m.user2_id = auth.uid())
    )
  );

-- ─── Hidden Gems ──────────────────────────────────────────────
create table if not exists public.hidden_gems (
  id                uuid primary key default uuid_generate_v4(),
  name              text not null,
  location          text not null,
  category          text not null,
  description       text not null default '',
  images            text[] not null default '{}',
  budget_level      text not null default '₱' check (budget_level in ('₱', '₱₱', '₱₱₱')),
  best_time_to_visit text not null default '',
  submitted_by      uuid references public.profiles(id) on delete set null,
  status            text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  is_featured       boolean not null default false,
  created_at        timestamptz not null default now()
);

alter table public.hidden_gems enable row level security;

create policy "Approved gems are public"
  on public.hidden_gems for select using (status = 'approved' or auth.uid() = submitted_by);

create policy "Authenticated users can submit gems"
  on public.hidden_gems for insert with check (auth.uid() is not null);

create policy "Submitters can update their pending gems"
  on public.hidden_gems for update using (auth.uid() = submitted_by and status = 'pending');

-- ─── Bookings ─────────────────────────────────────────────────
create table if not exists public.bookings (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  gem_id     uuid not null references public.hidden_gems(id) on delete cascade,
  gem_name   text not null,
  trip_type  text not null check (trip_type in ('solo', 'group', 'couple', 'family')),
  date       date not null,
  guests     int not null default 1,
  notes      text not null default '',
  status     text not null default 'pending' check (status in ('pending', 'confirmed', 'completed', 'cancelled')),
  created_at timestamptz not null default now()
);

alter table public.bookings enable row level security;

create policy "Users can see their own bookings"
  on public.bookings for select using (auth.uid() = user_id);

create policy "Users can create their own bookings"
  on public.bookings for insert with check (auth.uid() = user_id);

create policy "Users can update their own bookings"
  on public.bookings for update using (auth.uid() = user_id);

-- ─── Notifications ────────────────────────────────────────────
create table if not exists public.notifications (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  type       text not null,
  title      text not null,
  body       text not null default '',
  read       boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.notifications enable row level security;

create policy "Users can see their own notifications"
  on public.notifications for select using (auth.uid() = user_id);

create policy "Users can update their own notifications"
  on public.notifications for update using (auth.uid() = user_id);

-- ─── Posts (Community) ────────────────────────────────────────
create table if not exists public.posts (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  content       text not null,
  location      text,
  upvotes       int not null default 0,
  comment_count int not null default 0,
  created_at    timestamptz not null default now()
);

alter table public.posts enable row level security;

create policy "Posts are public"
  on public.posts for select using (true);

create policy "Authenticated users can post"
  on public.posts for insert with check (auth.uid() is not null);

create policy "Authors can update their posts"
  on public.posts for update using (auth.uid() = user_id);

-- ─── Payments ─────────────────────────────────────────────────
create table if not exists public.payments (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  amount      numeric not null default 30,
  method      text not null check (method in ('GCash', 'Maya')),
  receipt_url text not null default '',
  status      text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at  timestamptz not null default now()
);

alter table public.payments enable row level security;

create policy "Users can see their own payments"
  on public.payments for select using (auth.uid() = user_id);

create policy "Users can submit their own payments"
  on public.payments for insert with check (auth.uid() = user_id);

-- ─── Reports ──────────────────────────────────────────────────
create table if not exists public.reports (
  id                 uuid primary key default uuid_generate_v4(),
  reported_by        uuid not null references public.profiles(id) on delete cascade,
  reported_item_type text not null check (reported_item_type in ('Post', 'Comment', 'User')),
  reported_item_id   uuid not null,
  reason             text not null,
  status             text not null default 'pending' check (status in ('pending', 'resolved', 'dismissed')),
  created_at         timestamptz not null default now()
);

alter table public.reports enable row level security;

create policy "Users can submit reports"
  on public.reports for insert with check (auth.uid() = reported_by);

-- Admins can read/update everything — handled via service_role key in admin panel
