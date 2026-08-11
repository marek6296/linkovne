-- Protection prepínače su nezavisle a kombinovatelne:
--   • Open externally (escape_inapp) — jediny riadi externe otvorenie,
--   • Link Shield (link_shield) — jediny riadi 18+ gate na linkoch,
--   • Creator mode (creator_mode) — cloak/stealth, NEvynucuje ani jedno z hore.
-- Creator mode uz linky skryva cez cloak (client-render), takze shield netreba
-- vynucovat. Preto resolve_link.shielded = len link_shield.
create or replace function linkove.resolve_link(p_block_id uuid)
 returns table(url text, shielded boolean, lock_code text)
 language sql stable security definer set search_path to 'linkove', 'pg_temp'
as $function$
  select el->'config'->>'url' as url,
         coalesce(p.link_shield, false) as shielded,
         nullif(el->'config'->>'lockCode', '') as lock_code
  from linkove.blocks bl
  join linkove.profiles p on p.id = bl.profile_id
  cross join lateral jsonb_array_elements(coalesce(p.published_snapshot->'blocks','[]'::jsonb)) el
  where bl.id = p_block_id and p.is_published
    and el->>'id' = p_block_id::text and el->>'type' in ('link','tip')
  limit 1;
$function$;
