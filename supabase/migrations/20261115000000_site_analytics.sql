-- Navstevnost NASHO webu linkovne.com (marketing: landing, about, guides, /vs,
-- login, register…). Zamerne oddelene od analytiky profilov tvorcov
-- (page_views / clicks) — to su fanusikovia nasich klientov, nie nasi
-- potencialni zakaznici, a nesmie sa to miesat.
--
-- Bez cookies a bez ukladania IP:
--   visitor = sha256(denna_sol | IP | user agent), skrateny na 32 hex znakov.
--   Sol je nahodna, generuje sa raz za den (Europe/Bratislava) a starsie sa
--   mazu, takze hash sa neda spatne prelozit na IP ani sparovat naprie dnami.
--   „Unikatny navstevnik" je teda jedno zariadenie za jeden den; tyzden/mesiac
--   = sucet dennych unikatov (rovnako to robi Plausible).
--
-- Zapis ide len cez track_site_visit() a ten smie volat len service_role
-- (API route /api/sv, ktora predtym odfiltruje botov, prihlasenych, preview
-- a lokalny vyvoj). Citanie len cez admin_site_traffic() s is_admin().

-- 1) Denne soli ----------------------------------------------------------------
create table if not exists linkove.site_salts (
  day  date primary key,
  salt text not null
);
alter table linkove.site_salts enable row level security;
revoke all on linkove.site_salts from public, anon, authenticated;

-- 2) Navstevy -----------------------------------------------------------------
create table if not exists linkove.site_visits (
  id           bigint generated always as identity primary key,
  created_at   timestamptz not null default now(),
  day          date not null,              -- den v Europe/Bratislava
  visitor      text not null,              -- denny hash, nie IP
  path         text not null,              -- cesta bez query, napr. /vs/linktree
  kind         text not null default 'page'
               check (kind in ('page', 'section')), -- section = cennik na landingu
  entry        boolean not null default false,       -- prva stranka navstevy (nesie zdroj)
  referrer     text,                        -- len hostname externeho referrera
  utm_source   text,
  utm_medium   text,
  utm_campaign text,
  country      text,                        -- ISO-2 z Vercel edge
  device       text,                        -- mobile / tablet / desktop
  browser      text
);
create index if not exists site_visits_day_idx
  on linkove.site_visits (day);
create index if not exists site_visits_visitor_idx
  on linkove.site_visits (visitor, created_at);
alter table linkove.site_visits enable row level security;
revoke all on linkove.site_visits from public, anon, authenticated;

-- 3) Zapis jednej navstevy ------------------------------------------------------
create or replace function linkove.track_site_visit(
  p_ip           text,
  p_ua           text,
  p_path         text,
  p_kind         text    default 'page',
  p_entry        boolean default false,
  p_referrer     text    default null,
  p_utm_source   text    default null,
  p_utm_medium   text    default null,
  p_utm_campaign text    default null,
  p_country      text    default null,
  p_device       text    default null,
  p_browser      text    default null
)
returns boolean
language plpgsql
volatile
security definer
set search_path to 'linkove', 'pg_temp'
as $$
declare
  v_day     date := (now() at time zone 'Europe/Bratislava')::date;
  v_kind    text := coalesce(p_kind, 'page');
  v_salt    text;
  v_visitor text;
begin
  if p_path is null or p_path !~ '^/[A-Za-z0-9/_.#-]{0,120}$' then
    return false;
  end if;
  if v_kind not in ('page', 'section') then
    return false;
  end if;

  -- Sol na dnesok; prvy request dna ju vytvori a zmaze stare.
  select s.salt into v_salt from linkove.site_salts s where s.day = v_day;
  if v_salt is null then
    insert into linkove.site_salts (day, salt)
    values (
      v_day,
      encode(sha256(convert_to(
        gen_random_uuid()::text || gen_random_uuid()::text || clock_timestamp()::text,
        'UTF8')), 'hex')
    )
    on conflict (day) do nothing;
    select s.salt into v_salt from linkove.site_salts s where s.day = v_day;
    delete from linkove.site_salts s where s.day < v_day;
  end if;

  v_visitor := left(encode(sha256(convert_to(
    v_salt || '|' || coalesce(p_ip, '') || '|' || coalesce(p_ua, ''),
    'UTF8')), 'hex'), 32);

  -- Duplicita: ta ista stranka od toho isteho navstevnika do 30 min
  -- (reload, dvojity beacon, spatne tlacidlo).
  if exists (
    select 1 from linkove.site_visits v
    where v.visitor = v_visitor
      and v.path = p_path
      and v.created_at > now() - interval '30 minutes'
  ) then
    return false;
  end if;

  -- Strop na navstevnika za den — skript, ktory presiel filtrom botov,
  -- nenafukne cisla.
  if (
    select count(*) from linkove.site_visits v
    where v.visitor = v_visitor and v.day = v_day
  ) >= 100 then
    return false;
  end if;

  insert into linkove.site_visits (
    day, visitor, path, kind, entry, referrer,
    utm_source, utm_medium, utm_campaign, country, device, browser
  ) values (
    v_day, v_visitor, p_path, v_kind, coalesce(p_entry, false),
    left(lower(nullif(trim(p_referrer), '')), 120),
    left(lower(nullif(trim(p_utm_source), '')), 64),
    left(lower(nullif(trim(p_utm_medium), '')), 64),
    left(lower(nullif(trim(p_utm_campaign), '')), 64),
    case when p_country ~ '^[A-Z]{2}$' then p_country end,
    case when p_device in ('mobile', 'tablet', 'desktop') then p_device end,
    left(nullif(trim(p_browser), ''), 32)
  );
  return true;
end;
$$;

revoke all on function linkove.track_site_visit(
  text, text, text, text, boolean, text, text, text, text, text, text, text
) from public, anon, authenticated;
grant execute on function linkove.track_site_visit(
  text, text, text, text, boolean, text, text, text, text, text, text, text
) to service_role;

-- 4) Prehlad pre admin ----------------------------------------------------------
create or replace function linkove.admin_site_traffic(p_days int default 30)
returns jsonb
language plpgsql
stable
security definer
set search_path to 'linkove', 'pg_temp'
as $$
declare
  v_days  int  := greatest(1, least(coalesce(p_days, 30), 365));
  v_today date := (now() at time zone 'Europe/Bratislava')::date;
  v_from  date := v_today - (v_days - 1);
  v_prev  date := v_from - v_days;
  result  jsonb;
begin
  if not linkove.is_admin() then
    raise exception 'not authorized';
  end if;

  with r as (
    -- zvolene obdobie
    select * from linkove.site_visits where day >= v_from
  ),
  p as (
    -- rovnako dlhe predchadzajuce obdobie (na porovnanie)
    select * from linkove.site_visits where day >= v_prev and day < v_from
  ),
  su as (
    -- registracie = nove Linkovne ucty (nie vsetci auth.users zdielanej DB)
    select (a.created_at at time zone 'Europe/Bratislava')::date as day
    from linkove.accounts a
    where a.created_at >= (v_prev::timestamp at time zone 'Europe/Bratislava')
  )
  select jsonb_build_object(
    'days', v_days,
    'from', v_from,
    'to',   v_today,
    'since', (select min(day) from linkove.site_visits),
    'visitors',  (select count(distinct (day, visitor)) from r),
    'pageviews', (select count(*) from r where kind = 'page'),
    'signups',   (select count(*) from su where day >= v_from),
    'prev', jsonb_build_object(
      'visitors',  (select count(distinct (day, visitor)) from p),
      'pageviews', (select count(*) from p where kind = 'page'),
      'signups',   (select count(*) from su where day < v_from)
    ),
    'today', (select count(distinct visitor) from linkove.site_visits where day = v_today),
    'week',  (select count(distinct (day, visitor)) from linkove.site_visits where day > v_today - 7),
    'month', (select count(distinct (day, visitor)) from linkove.site_visits where day > v_today - 30),
    'funnel', jsonb_build_object(
      'landing',  (select count(distinct (day, visitor)) from r where kind = 'page' and path = '/'),
      'pricing',  (select count(distinct (day, visitor)) from r where kind = 'section' and path = '/#pricing'),
      'register', (select count(distinct (day, visitor)) from r where kind = 'page' and path = '/register'),
      'login',    (select count(distinct (day, visitor)) from r where kind = 'page' and path = '/login')
    ),
    'by_day', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'd', g.d,
        'visitors',  coalesce(v.visitors, 0),
        'pageviews', coalesce(v.pageviews, 0),
        'signups',   coalesce(s.n, 0)
      ) order by g.d), '[]'::jsonb)
      from (select generate_series(v_from, v_today, interval '1 day')::date as d) g
      left join (
        select day, count(distinct visitor) as visitors,
               count(*) filter (where kind = 'page') as pageviews
        from r group by day
      ) v on v.day = g.d
      left join (
        select day, count(*) as n from su where day >= v_from group by day
      ) s on s.day = g.d
    ),
    'pages', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'path', t.path, 'visitors', t.visitors, 'views', t.views
      ) order by t.visitors desc, t.views desc), '[]'::jsonb)
      from (
        select path, count(distinct (day, visitor)) as visitors, count(*) as views
        from r where kind = 'page'
        group by path order by 2 desc, 3 desc limit 25
      ) t
    ),
    'sources', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'referrer', t.referrer, 'utm_source', t.utm_source, 'visitors', t.visitors
      ) order by t.visitors desc), '[]'::jsonb)
      from (
        select referrer, utm_source, count(distinct (day, visitor)) as visitors
        from r where entry
        group by 1, 2 order by 3 desc limit 100
      ) t
    ),
    'campaigns', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'source', t.utm_source, 'medium', t.utm_medium,
        'campaign', t.utm_campaign, 'visitors', t.visitors
      ) order by t.visitors desc), '[]'::jsonb)
      from (
        select utm_source, utm_medium, utm_campaign,
               count(distinct (day, visitor)) as visitors
        from r
        where entry and (utm_source is not null or utm_campaign is not null)
        group by 1, 2, 3 order by 4 desc limit 20
      ) t
    ),
    'countries', (
      select coalesce(jsonb_agg(jsonb_build_object('key', t.k, 'visitors', t.n)
        order by t.n desc), '[]'::jsonb)
      from (
        select coalesce(country, '??') as k, count(distinct (day, visitor)) as n
        from r group by 1 order by 2 desc limit 12
      ) t
    ),
    'devices', (
      select coalesce(jsonb_agg(jsonb_build_object('key', t.k, 'visitors', t.n)
        order by t.n desc), '[]'::jsonb)
      from (
        select coalesce(device, 'unknown') as k, count(distinct (day, visitor)) as n
        from r group by 1 order by 2 desc
      ) t
    ),
    'browsers', (
      select coalesce(jsonb_agg(jsonb_build_object('key', t.k, 'visitors', t.n)
        order by t.n desc), '[]'::jsonb)
      from (
        select coalesce(browser, 'Other') as k, count(distinct (day, visitor)) as n
        from r group by 1 order by 2 desc limit 10
      ) t
    )
  ) into result;

  return result;
end;
$$;

revoke all on function linkove.admin_site_traffic(int) from public, anon;
grant execute on function linkove.admin_site_traffic(int) to authenticated;
