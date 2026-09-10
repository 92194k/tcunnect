-- TCUnnect: 003_row_level_security.sql
-- This is where "blocked users never see each other" and "verification
-- gates access" stop being app-layer promises and become DB-enforced rules.

alter table users enable row level security;
alter table verification_submissions enable row level security;
alter table likes enable row level security;
alter table matches enable row level security;
alter table messages enable row level security;
alter table feed_posts enable row level security;
alter table feed_comments enable row level security;
alter table reports enable row level security;
alter table blocks enable row level security;
alter table moderation_actions enable row level security;
alter table premium_purchases enable row level security;

-- Helper: current app user's row, derived from the Supabase auth session
create or replace function current_app_user_id()
returns uuid
language sql stable
as $$
  select id from users where auth_id = auth.uid();
$$;

create or replace function is_admin()
returns boolean
language sql stable
as $$
  select coalesce((select is_admin from users where auth_id = auth.uid()), false);
$$;

-- ============================================
-- USERS
-- ============================================

-- Everyone verified & not blocked can see basic discovery fields of others.
-- (In production, prefer a narrower `public_profile` VIEW exposing only
-- discovery-safe columns instead of selecting from `users` directly.)
create policy "verified users can view other verified, non-blocked users"
  on users for select
  using (
    is_verified = true
    and not exists (
      select 1 from blocks b
      where (b.blocker_id = current_app_user_id() and b.blocked_id = users.id)
         or (b.blocker_id = users.id and b.blocked_id = current_app_user_id())
    )
  );

create policy "users can view their own row regardless of verification"
  on users for select
  using (auth_id = auth.uid());

create policy "users can update their own profile fields"
  on users for update
  using (auth_id = auth.uid())
  with check (auth_id = auth.uid());

create policy "admins can view all users"
  on users for select
  using (is_admin());

create policy "admins can update verification/ban fields"
  on users for update
  using (is_admin());

-- ============================================
-- VERIFICATION SUBMISSIONS (private — user + admins only)
-- ============================================

create policy "users can view their own submissions"
  on verification_submissions for select
  using (user_id = current_app_user_id());

create policy "users can insert their own submission"
  on verification_submissions for insert
  with check (user_id = current_app_user_id());

create policy "admins can view all submissions"
  on verification_submissions for select
  using (is_admin());

create policy "admins can update submissions (approve/reject)"
  on verification_submissions for update
  using (is_admin());

-- ============================================
-- LIKES — you can see likes you sent; recipients only see the AGGREGATE
-- via a separate view/RPC, never raw rows with identity (until premium
-- reveals it) — see 004_rpc_functions.sql for get_my_likers().
-- ============================================

create policy "users can insert their own likes"
  on likes for insert
  with check (
    from_user = current_app_user_id()
    and not exists (
      select 1 from blocks b
      where (b.blocker_id = from_user and b.blocked_id = to_user)
         or (b.blocker_id = to_user and b.blocked_id = from_user)
    )
  );

create policy "users can view likes they sent"
  on likes for select
  using (from_user = current_app_user_id());

-- ============================================
-- MATCHES & MESSAGES — only the two participants, and only while not unmatched
-- ============================================

create policy "participants can view their matches"
  on matches for select
  using (
    (user_a = current_app_user_id() or user_b = current_app_user_id())
  );

create policy "participants can unmatch"
  on matches for update
  using (user_a = current_app_user_id() or user_b = current_app_user_id());

create policy "participants can view messages in their active matches"
  on messages for select
  using (
    exists (
      select 1 from matches m
      where m.id = messages.match_id
        and m.unmatched_at is null
        and (m.user_a = current_app_user_id() or m.user_b = current_app_user_id())
    )
  );

create policy "participants can send messages in their active matches"
  on messages for insert
  with check (
    sender_id = current_app_user_id()
    and exists (
      select 1 from matches m
      where m.id = messages.match_id
        and m.unmatched_at is null
        and (m.user_a = current_app_user_id() or m.user_b = current_app_user_id())
    )
  );

-- ============================================
-- ANONYMOUS FEED — readable by any verified user; no identity column exists
-- to leak in the first place, so policy just needs to gate on verification.
-- ============================================

create policy "verified users can view non-removed feed posts"
  on feed_posts for select
  using (
    not is_removed
    and exists (select 1 from users u where u.auth_id = auth.uid() and u.is_verified)
  );

create policy "verified users can post to the feed"
  on feed_posts for insert
  with check (
    exists (select 1 from users u where u.auth_id = auth.uid() and u.is_verified)
  );

create policy "verified users can view non-removed comments"
  on feed_comments for select
  using (
    not is_removed
    and exists (select 1 from users u where u.auth_id = auth.uid() and u.is_verified)
  );

create policy "verified users can comment"
  on feed_comments for insert
  with check (
    exists (select 1 from users u where u.auth_id = auth.uid() and u.is_verified)
  );

create policy "admins can moderate feed posts"
  on feed_posts for update
  using (is_admin());

create policy "admins can moderate feed comments"
  on feed_comments for update
  using (is_admin());

-- ============================================
-- REPORTS, BLOCKS, MODERATION ACTIONS
-- ============================================

create policy "users can create reports"
  on reports for insert
  with check (reporter_id = current_app_user_id());

create policy "users can view their own reports"
  on reports for select
  using (reporter_id = current_app_user_id());

create policy "admins can view and resolve all reports"
  on reports for select
  using (is_admin());

create policy "admins can update reports"
  on reports for update
  using (is_admin());

create policy "users can create their own blocks"
  on blocks for insert
  with check (blocker_id = current_app_user_id());

create policy "users can view their own blocks"
  on blocks for select
  using (blocker_id = current_app_user_id());

create policy "users can remove their own blocks"
  on blocks for delete
  using (blocker_id = current_app_user_id());

create policy "admins can view moderation actions"
  on moderation_actions for select
  using (is_admin());

create policy "admins can create moderation actions"
  on moderation_actions for insert
  with check (is_admin());

-- ============================================
-- PREMIUM PURCHASES — user sees their own; writes happen via service role
-- from the checkout/webhook Edge Functions, never directly from the client.
-- ============================================

create policy "users can view their own purchases"
  on premium_purchases for select
  using (user_id = current_app_user_id());

-- Deliberately no insert/update policy for regular users — all writes to
-- this table happen via the Edge Functions using the service role key,
-- which bypasses RLS. This stops a client from ever setting is_premium
-- or a 'paid' status on itself directly.
