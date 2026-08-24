-- Admins must always sit on the `admin` plan (everything unlocked, operator
-- account). There was already a BEFORE INSERT trigger (set_admin_plan) that
-- stamps plan='admin' when an account is created whose email is in `admins`.
-- But it only fires at INSERT — so an account created BEFORE its email was
-- added to `admins` stayed on whatever plan it had (e.g. free), and nothing
-- re-synced. That left the operator account showing "free" + upgrade prompts.
--
-- Two fixes:
--   1) Backfill every existing admin account to the admin plan.
--   2) Promote automatically when an email is ADDED to `admins` later, so the
--      rule holds going forward without a manual DB edit.

-- 1) Backfill existing admins.
update linkove.accounts a
set plan = 'admin'
from auth.users u
join linkove.admins ad on lower(ad.email::text) = lower(u.email::text)
where u.id = a.id
  and a.plan is distinct from 'admin';

-- 2) When a new admin email is inserted, promote the matching account (if that
--    person already has an account — the INSERT trigger on accounts covers the
--    reverse order).
create or replace function linkove.promote_admin_account()
returns trigger
language plpgsql
security definer
set search_path to 'linkove', 'pg_temp'
as $$
begin
  update linkove.accounts a
  set plan = 'admin'
  from auth.users u
  where u.id = a.id
    and lower(u.email::text) = lower(NEW.email::text)
    and a.plan is distinct from 'admin';
  return NEW;
end;
$$;

drop trigger if exists admins_promote_account on linkove.admins;
create trigger admins_promote_account
after insert on linkove.admins
for each row execute function linkove.promote_admin_account();
