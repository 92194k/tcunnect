-- TCUnnect: 007_fix_rls_recursion.sql
-- Bug fix: current_app_user_id() and is_admin() query `users`, but every
-- policy on `users` calls one of these functions to decide access — so
-- evaluating the policy re-triggers the function, which re-triggers the
-- policy, forever. Marking these SECURITY DEFINER makes them run with the
-- function owner's privileges (bypassing RLS for this specific lookup only),
-- breaking the loop while leaving every other RLS rule untouched.

create or replace function current_app_user_id()
returns uuid
language sql stable
security definer
set search_path = public
as $$
  select id from users where auth_id = auth.uid();
$$;

create or replace function is_admin()
returns boolean
language sql stable
security definer
set search_path = public
as $$
  select coalesce((select is_admin from users where auth_id = auth.uid()), false);
$$;
