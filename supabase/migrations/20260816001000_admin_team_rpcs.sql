-- Team management for the admin panel: list / add / remove admins.
-- The `admins` table (email allowlist) drives is_admin(); adding a row also
-- promotes the matching account to the admin plan via the admins_promote_account
-- trigger. All three RPCs are SECURITY DEFINER but self-guard with is_admin(),
-- so only an existing admin can touch the roster (defence in depth on top of the
-- /admin layout guard).

-- List admins with whether they have an account yet + that account's plan.
create or replace function linkove.admin_list_admins()
returns table(email text, created_at timestamptz, has_account boolean, plan text)
language plpgsql
stable
security definer
set search_path to 'linkove', 'pg_temp'
as $$
begin
  if not linkove.is_admin() then
    raise exception 'not authorized';
  end if;

  return query
  select ad.email::text,
         ad.created_at,
         (u.id is not null) as has_account,
         a.plan::text
  from linkove.admins ad
  left join auth.users u on lower(u.email::text) = lower(ad.email::text)
  left join linkove.accounts a on a.id = u.id
  order by ad.created_at;
end;
$$;

-- Add an admin by email. The promote trigger handles the plan if that person
-- already has an account; otherwise set_admin_plan() catches it at signup.
create or replace function linkove.admin_add_admin(p_email text)
returns void
language plpgsql
security definer
set search_path to 'linkove', 'pg_temp'
as $$
declare
  v_email text := lower(trim(p_email));
begin
  if not linkove.is_admin() then
    raise exception 'not authorized';
  end if;
  if v_email not like '%@%.%' or v_email like '% %' or length(v_email) < 5 then
    raise exception 'invalid email';
  end if;

  insert into linkove.admins(email)
  select v_email
  where not exists (
    select 1 from linkove.admins where lower(email::text) = v_email
  );
end;
$$;

-- Remove an admin. Guards: cannot remove yourself (no self-lockout) and cannot
-- remove the last admin. On removal, drop that account back to the free plan so
-- revoked admins lose the operator perks.
create or replace function linkove.admin_remove_admin(p_email text)
returns void
language plpgsql
security definer
set search_path to 'linkove', 'pg_temp'
as $$
declare
  v_email text := lower(trim(p_email));
  v_caller_email text;
  v_count int;
begin
  if not linkove.is_admin() then
    raise exception 'not authorized';
  end if;

  select lower(u.email::text) into v_caller_email
  from auth.users u where u.id = auth.uid();

  if v_email = v_caller_email then
    raise exception 'cannot remove yourself';
  end if;

  select count(*) into v_count from linkove.admins;
  if v_count <= 1 then
    raise exception 'cannot remove the last admin';
  end if;

  delete from linkove.admins where lower(email::text) = v_email;

  update linkove.accounts a
  set plan = 'free'
  from auth.users u
  where u.id = a.id
    and lower(u.email::text) = v_email
    and a.plan = 'admin';
end;
$$;

revoke all on function linkove.admin_list_admins() from public, anon;
revoke all on function linkove.admin_add_admin(text) from public, anon;
revoke all on function linkove.admin_remove_admin(text) from public, anon;
grant execute on function linkove.admin_list_admins() to authenticated;
grant execute on function linkove.admin_add_admin(text) to authenticated;
grant execute on function linkove.admin_remove_admin(text) to authenticated;
