-- TCUnnect: 006_fix_users_insert_policy.sql
-- Bug fix: 003_row_level_security.sql defined SELECT and UPDATE policies for
-- `users` but never an INSERT policy, so RLS silently blocked every new
-- signup from creating their own profile row during Onboarding.

create policy "users can insert their own row"
  on users for insert
  with check (auth_id = auth.uid());
