-- Additive editor workspace. Existing profiles/blocks and Stripe billing are untouched.
create table if not exists linkove.saved_templates (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  theme text not null default 'classic',
  design jsonb not null default '{}'::jsonb,
  blocks jsonb,
  is_shared boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists linkove.brand_kits (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  name text not null default 'Brand kit',
  logo_url text,
  colors jsonb not null default '{}'::jsonb,
  font text,
  font_heading text,
  button jsonb not null default '{}'::jsonb,
  locked boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists linkove.profile_versions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references linkove.profiles(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  reason text not null check (char_length(reason) between 1 and 100),
  snapshot jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists saved_templates_owner_created_idx on linkove.saved_templates(owner_id, created_at desc);
create index if not exists profile_versions_profile_created_idx on linkove.profile_versions(profile_id, created_at desc);

alter table linkove.saved_templates enable row level security;
alter table linkove.brand_kits enable row level security;
alter table linkove.profile_versions enable row level security;

drop policy if exists "Owners manage saved templates" on linkove.saved_templates;
create policy "Owners manage saved templates" on linkove.saved_templates for all to authenticated
using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
drop policy if exists "Owners manage brand kit" on linkove.brand_kits;
create policy "Owners manage brand kit" on linkove.brand_kits for all to authenticated
using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
drop policy if exists "Owners manage profile versions" on linkove.profile_versions;
create policy "Owners manage profile versions" on linkove.profile_versions for all to authenticated
using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);

grant select, insert, update, delete on linkove.saved_templates to authenticated;
grant select, insert, update, delete on linkove.brand_kits to authenticated;
grant select, insert, delete on linkove.profile_versions to authenticated;
revoke all on linkove.saved_templates, linkove.brand_kits, linkove.profile_versions from anon;

-- The editor already supports these two block types. Widening the existing
-- check is atomic and does not rewrite or modify any stored block rows.
alter table linkove.blocks drop constraint if exists blocks_type_check;
alter table linkove.blocks add constraint blocks_type_check check (
  type = any (array[
    'link'::text, 'headline'::text, 'text'::text, 'image'::text,
    'video'::text, 'socials'::text, 'faq'::text, 'countdown'::text,
    'divider'::text, 'tip'::text, 'form'::text
  ])
);

create or replace function linkove.restore_profile_version(p_profile_id uuid, p_version_id uuid)
returns boolean
language plpgsql
security invoker
set search_path = linkove, public
as $$
declare
  v_snapshot jsonb;
begin
  select snapshot into v_snapshot
  from linkove.profile_versions
  where id = p_version_id and profile_id = p_profile_id and owner_id = (select auth.uid());
  if v_snapshot is null then return false; end if;

  update linkove.profiles set
    display_name = v_snapshot->'profile'->>'display_name',
    bio = v_snapshot->'profile'->>'bio',
    avatar_url = nullif(v_snapshot->'profile'->>'avatar_url', ''),
    theme = coalesce(v_snapshot->'profile'->>'theme', theme),
    design = coalesce(v_snapshot->'profile'->'design', '{}'::jsonb),
    updated_at = now()
  where id = p_profile_id and owner_id = (select auth.uid());

  delete from linkove.blocks b
  where b.profile_id = p_profile_id
    and not exists (
      select 1 from jsonb_array_elements(coalesce(v_snapshot->'blocks', '[]'::jsonb)) x
      where (x->>'id')::uuid = b.id
    );

  insert into linkove.blocks (id, profile_id, type, config, position, is_active, starts_at, ends_at, updated_at)
  select x.id, p_profile_id, x.type, coalesce(x.config, '{}'::jsonb), x.position,
    coalesce(x.is_active, true), x.starts_at, x.ends_at, now()
  from jsonb_to_recordset(coalesce(v_snapshot->'blocks', '[]'::jsonb)) as x(
    id uuid, type text, config jsonb, position integer, is_active boolean,
    starts_at timestamptz, ends_at timestamptz
  )
  on conflict (id) do update set
    type = excluded.type, config = excluded.config, position = excluded.position,
    is_active = excluded.is_active, starts_at = excluded.starts_at,
    ends_at = excluded.ends_at, updated_at = now();
  return true;
end;
$$;

revoke all on function linkove.restore_profile_version(uuid, uuid) from public, anon;
grant execute on function linkove.restore_profile_version(uuid, uuid) to authenticated;
