-- In-app admin notifications (the bell). Reads the notable slice of
-- account_events and tracks a per-admin "seen" marker for the unread count.
-- (Replaces the earlier Telegram experiment — dropped in this migration.)

drop trigger if exists account_events_notify on linkove.account_events;
drop function if exists linkove.notify_account_event();
drop table if exists linkove.app_config;

-- Per-admin last-seen marker.
create table if not exists linkove.admin_notify_state (
  user_id uuid primary key,
  seen_at timestamptz not null default now()
);
alter table linkove.admin_notify_state enable row level security;
-- No policies: reachable only through the SECURITY DEFINER RPCs below.

-- The events worth surfacing to an operator.
create or replace function linkove.admin_notify_types()
returns text[]
language sql immutable
as $$
  select array[
    'signup','plan_upgrade','plan_downgrade','payment_succeeded',
    'payment_failed','subscription_canceled','plan_expired','discount_applied'
  ];
$$;

-- Recent notable events with an is_unread flag (vs the caller's seen marker).
create or replace function linkove.admin_notifications(p_limit int default 20)
returns table(
  id bigint, created_at timestamptz, type text, to_plan text, meta jsonb,
  account_id uuid, email text, username text, is_unread boolean
)
language plpgsql stable security definer
set search_path to 'linkove', 'pg_temp'
as $$
declare v_seen timestamptz;
begin
  if not linkove.is_admin() then raise exception 'not authorized'; end if;
  select seen_at into v_seen from linkove.admin_notify_state where user_id = auth.uid();

  return query
  select ae.id, ae.created_at, ae.type, ae.to_plan, coalesce(ae.meta, '{}'::jsonb),
         ae.account_id, u.email::text,
         (select p.username from linkove.profiles p
            where p.owner_id = ae.account_id order by p.created_at limit 1),
         (v_seen is null or ae.created_at > v_seen)
  from linkove.account_events ae
  left join auth.users u on u.id = ae.account_id
  where ae.type = any(linkove.admin_notify_types())
  order by ae.created_at desc
  limit greatest(1, least(coalesce(p_limit, 20), 50));
end;
$$;

-- Count of unread notable events (for the badge).
create or replace function linkove.admin_unread_count()
returns int
language plpgsql stable security definer
set search_path to 'linkove', 'pg_temp'
as $$
declare v_seen timestamptz; v_n int;
begin
  if not linkove.is_admin() then raise exception 'not authorized'; end if;
  select seen_at into v_seen from linkove.admin_notify_state where user_id = auth.uid();
  select count(*) into v_n
  from linkove.account_events ae
  where ae.type = any(linkove.admin_notify_types())
    and (v_seen is null or ae.created_at > v_seen);
  return coalesce(v_n, 0);
end;
$$;

-- Mark everything up to now as seen (resets the badge).
create or replace function linkove.admin_mark_notifications_seen()
returns void
language plpgsql security definer
set search_path to 'linkove', 'pg_temp'
as $$
begin
  if not linkove.is_admin() then raise exception 'not authorized'; end if;
  insert into linkove.admin_notify_state(user_id, seen_at)
  values (auth.uid(), now())
  on conflict (user_id) do update set seen_at = now();
end;
$$;

revoke all on function linkove.admin_notifications(int) from public, anon;
revoke all on function linkove.admin_unread_count() from public, anon;
revoke all on function linkove.admin_mark_notifications_seen() from public, anon;
grant execute on function linkove.admin_notifications(int) to authenticated;
grant execute on function linkove.admin_unread_count() to authenticated;
grant execute on function linkove.admin_mark_notifications_seen() to authenticated;
