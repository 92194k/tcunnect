-- TCUnnect: 016_single_admin_constraint.sql
-- Enforces "only one super admin can exist" at the database level, not just
-- by convention. A partial unique index on a constant expression, filtered
-- to rows where is_admin = true, means Postgres physically refuses a second
-- row from ever having is_admin = true — the UPDATE statement itself fails
-- with a uniqueness violation, not just a UI restriction.

create unique index idx_only_one_admin on users ((true)) where is_admin = true;
