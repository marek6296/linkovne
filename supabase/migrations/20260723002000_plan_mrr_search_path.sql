-- Pripnutie search_path na linkove.plan_mrr (security hardening).
-- Ostatne linkove funkcie uz maju `SET search_path TO 'linkove','pg_temp'`;
-- tato ako jedina mala mutable search_path (Supabase advisor:
-- function_search_path_mutable). Zabranuje search-path injection do
-- SECURITY DEFINER / STABLE funkcie.
alter function linkove.plan_mrr(text) set search_path to 'linkove', 'pg_temp';
