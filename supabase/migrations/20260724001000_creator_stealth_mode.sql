-- Creator / Stealth mode — opt-in ochranná vrstva pre tvorcov (Pro/Business).
-- Keď je zapnutá, verejný profil: vynúti Link Shield na všetkých linkoch,
-- noindex, očistí metadata a bio nerenderuje do SSR HTML (crawler ho nevidí).
alter table linkove.profiles
  add column if not exists creator_mode boolean not null default false;

-- public_profile vracia navyše creator_mode (mení return type → drop+create).
drop function if exists linkove.public_profile(text);
create function linkove.public_profile(p_username text)
 returns table(id uuid, username text, snapshot jsonb, seo_title text,
   seo_description text, is_indexable boolean, age_gate boolean,
   escape_inapp boolean, hide_branding boolean, creator_mode boolean, plan text)
 language sql stable security definer set search_path to 'linkove', 'pg_temp'
as $function$
  select p.id, p.username::text, p.published_snapshot,
         p.seo_title, p.seo_description, p.is_indexable, p.age_gate,
         p.escape_inapp, p.hide_branding, p.creator_mode, a.plan
  from linkove.profiles p
  join linkove.accounts a on a.id = p.owner_id
  where lower(p.username::text) = lower(p_username)
    and p.is_published and p.published_snapshot is not null
  limit 1;
$function$;

-- resolve_link: shield sa vynúti aj keď je zapnutý creator_mode.
create or replace function linkove.resolve_link(p_block_id uuid)
 returns table(url text, shielded boolean, lock_code text)
 language sql stable security definer set search_path to 'linkove', 'pg_temp'
as $function$
  select el->'config'->>'url' as url,
         (coalesce(p.link_shield, false) or coalesce(p.creator_mode, false)) as shielded,
         nullif(el->'config'->>'lockCode', '') as lock_code
  from linkove.blocks bl
  join linkove.profiles p on p.id = bl.profile_id
  cross join lateral jsonb_array_elements(coalesce(p.published_snapshot->'blocks','[]'::jsonb)) el
  where bl.id = p_block_id and p.is_published
    and el->>'id' = p_block_id::text and el->>'type' in ('link','tip')
  limit 1;
$function$;
