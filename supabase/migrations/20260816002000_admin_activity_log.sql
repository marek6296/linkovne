-- Platform-wide audit log for the admin panel. account_events already records
-- the lifecycle (signup, plan changes, payments, cancellations, discounts); this
-- exposes it globally to admins, and adds logging for admin add/remove so the
-- Team actions show up too.
--
-- account_events has RLS enabled with no policies (default deny), so reads must
-- go through this SECURITY DEFINER RPC, which self-guards with is_admin().

create or replace function linkove.admin_activity_log(
  p_limit int default 100,
  p_type text default null,
  p_before timestamptz default null
)
returns table(
  id bigint,
  created_at timestamptz,
  type text,
  from_plan text,
  to_plan text,
  meta jsonb,
  account_id uuid,
  email text,
  username text
)
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
  select ae.id,
         ae.created_at,
         ae.type,
         ae.from_plan,
         ae.to_plan,
         coalesce(ae.meta, '{}'::jsonb),
         ae.account_id,
         u.email::text,
         (select p.username
            from linkove.profiles p
           where p.owner_id = ae.account_id
           order by p.created_at
           limit 1) as username
  from linkove.account_events ae
  left join auth.users u on u.id = ae.account_id
  where (p_type is null or ae.type = p_type)
    and (p_before is null or ae.created_at < p_before)
  order by ae.created_at desc
  limit greatest(1, least(coalesce(p_limit, 100), 500));
end;
$$;

revoke all on function linkove.admin_activity_log(int, text, timestamptz) from public, anon;
grant execute on function linkove.admin_activity_log(int, text, timestamptz) to authenticated;

-- Re-declare admin add/remove with audit logging into account_events.
create or replace function linkove.admin_add_admin(p_email text)
returns void
language plpgsql
security definer
set search_path to 'linkove', 'pg_temp'
as $$
declare
  v_email text := lower(trim(p_email));
  v_by text;
begin
  if not linkove.is_admin() then raise exception 'not authorized'; end if;
  if v_email not like '%@%.%' or v_email like '% %' or length(v_email) < 5 then
    raise exception 'invalid email';
  end if;

  insert into linkove.admins(email)
  select v_email
  where not exists (select 1 from linkove.admins where lower(email::text) = v_email);

  if found then
    select lower(email::text) into v_by from auth.users where id = auth.uid();
    insert into linkove.account_events(account_id, type, meta)
    select u.id, 'admin_added', jsonb_build_object('by', v_by)
    from auth.users u
    where lower(u.email::text) = v_email
      and exists (select 1 from linkove.accounts a where a.id = u.id);
  end if;
end;
$$;

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
  if not linkove.is_admin() then raise exception 'not authorized'; end if;

  select lower(u.email::text) into v_caller_email
  from auth.users u where u.id = auth.uid();

  if v_email = v_caller_email then raise exception 'cannot remove yourself'; end if;

  select count(*) into v_count from linkove.admins;
  if v_count <= 1 then raise exception 'cannot remove the last admin'; end if;

  delete from linkove.admins where lower(email::text) = v_email;

  update linkove.accounts a
  set plan = 'free'
  from auth.users u
  where u.id = a.id
    and lower(u.email::text) = v_email
    and a.plan = 'admin';

  insert into linkove.account_events(account_id, type, from_plan, to_plan, meta)
  select u.id, 'admin_removed', 'admin', 'free',
         jsonb_build_object('by', v_caller_email)
  from auth.users u
  where lower(u.email::text) = v_email
    and exists (select 1 from linkove.accounts a where a.id = u.id);
end;
$$;
