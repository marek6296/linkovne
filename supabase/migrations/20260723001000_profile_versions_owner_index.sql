-- Covers owner-scoped history cleanup and the owner_id foreign key without
-- changing any existing profile, block, account, or billing data.
create index if not exists profile_versions_owner_created_idx
  on linkove.profile_versions(owner_id, created_at desc);
