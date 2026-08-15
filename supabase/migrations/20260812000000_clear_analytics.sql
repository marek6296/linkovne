-- Owner-triggered wipe of a profile's analytics.
--
-- page_views map by profile_id; clicks map by block_id -> blocks.profile_id.
-- The event tables have no DELETE policy (RLS only allows insert + owner read),
-- so this runs SECURITY DEFINER — but it first verifies the caller actually
-- owns the profile, so one owner can never wipe another's data.
create or replace function linkove.clear_analytics(p_profile_id uuid)
returns void
language plpgsql
security definer
set search_path = linkove, pg_temp
as $$
declare
  v_owner uuid;
begin
  select owner_id into v_owner
    from linkove.profiles
   where id = p_profile_id;

  if v_owner is null or v_owner is distinct from auth.uid() then
    raise exception 'not authorized';
  end if;

  delete from linkove.clicks c
   using linkove.blocks b
   where b.id = c.block_id
     and b.profile_id = p_profile_id;

  delete from linkove.page_views
   where profile_id = p_profile_id;
end;
$$;

revoke all on function linkove.clear_analytics(uuid) from public, anon;
grant execute on function linkove.clear_analytics(uuid) to authenticated;
