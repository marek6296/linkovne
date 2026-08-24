-- Admin notifications: one trigger on account_events fires an async HTTP POST
-- (via pg_net) to our /api/hooks/notify route for EVERY event, whatever wrote it
-- (Stripe webhook, cron, admin action, signup trigger). The route formats the
-- message and sends it to Telegram. Secrets:
--   * the Telegram bot token + chat id live only in Vercel env (never in the DB)
--   * a shared `notify_secret` (generated below) authenticates the DB → route
--     call; the same value goes into Vercel as NOTIFY_HOOK_SECRET.
-- Until app_config is filled + the route is configured, the trigger is a no-op.

-- Small service-role-only config store (RLS on, no policies = default deny).
create table if not exists linkove.app_config (
  key text primary key,
  value text
);
alter table linkove.app_config enable row level security;

-- Where to POST notifications, and the shared secret. gen_random_uuid keeps the
-- secret out of the repo (generated per environment on first apply).
insert into linkove.app_config(key, value)
values ('notify_url', 'https://linkovne.com/api/hooks/notify')
on conflict (key) do nothing;

insert into linkove.app_config(key, value)
values (
  'notify_secret',
  replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '')
)
on conflict (key) do nothing;

-- Trigger: enrich the event with email + username and POST it. SECURITY DEFINER
-- so it can read auth.users / config regardless of the inserting role.
create or replace function linkove.notify_account_event()
returns trigger
language plpgsql
security definer
set search_path to 'linkove', 'public', 'pg_temp'
as $$
declare
  v_url text;
  v_secret text;
  v_email text;
  v_username text;
begin
  select value into v_url from linkove.app_config where key = 'notify_url';
  select value into v_secret from linkove.app_config where key = 'notify_secret';
  -- Not configured yet → do nothing (never block the insert).
  if v_url is null or v_url = '' or v_secret is null or v_secret = '' then
    return NEW;
  end if;

  select u.email::text into v_email
  from auth.users u where u.id = NEW.account_id;

  select p.username into v_username
  from linkove.profiles p
  where p.owner_id = NEW.account_id
  order by p.created_at
  limit 1;

  perform net.http_post(
    url := v_url,
    body := jsonb_build_object(
      'id', NEW.id,
      'type', NEW.type,
      'from_plan', NEW.from_plan,
      'to_plan', NEW.to_plan,
      'meta', coalesce(NEW.meta, '{}'::jsonb),
      'account_id', NEW.account_id,
      'email', v_email,
      'username', v_username,
      'created_at', NEW.created_at
    ),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-notify-secret', v_secret
    ),
    timeout_milliseconds := 5000
  );

  return NEW;
exception when others then
  -- A notification failure must never break the event write.
  return NEW;
end;
$$;

drop trigger if exists account_events_notify on linkove.account_events;
create trigger account_events_notify
after insert on linkove.account_events
for each row execute function linkove.notify_account_event();
