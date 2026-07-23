-- Reálne MRR: doteraz sa rátalo fixne podľa plánu (€4.99/€14.99), takže
-- zľavnení zákazníci nadhodnocovali príjem. Teraz ukladáme reálne zaplatenú
-- sumu (po zľave) do accounts.mrr_cents (z webhooku invoice.paid), a metriky
-- ju uprednostnia pred fixnou cenou. NULL = zatiaľ neznáme → fallback na plán.
alter table linkove.accounts
  add column if not exists mrr_cents integer;

-- admin_metrics: mrr per účet = reálna suma ak ju máme, inak plán.
create or replace function linkove.admin_metrics()
 returns jsonb
 language plpgsql
 stable security definer
 set search_path to 'linkove', 'pg_temp'
as $function$
declare result jsonb;
begin
  if not linkove.is_admin() then raise exception 'forbidden'; end if;

  with src as (
    select a.*,
           linkove.revenue_source(a) as source,
           coalesce(a.mrr_cents / 100.0, linkove.plan_mrr(a.plan)) as mrr
    from linkove.accounts a
  )
  select jsonb_build_object(
    'total_accounts',    (select count(*) from src),
    'free',              (select count(*) from src where plan = 'free'),
    'paid',              (select count(*) from src where source = 'paid'),
    'paid_pro',          (select count(*) from src where source = 'paid' and plan = 'pro'),
    'paid_business',     (select count(*) from src where source = 'paid' and plan = 'business'),
    'trial',             (select count(*) from src where source = 'trial'),
    'past_due',          (select count(*) from src where source = 'past_due'),
    'real_mrr',          (select coalesce(sum(mrr), 0) from src where source = 'paid'),
    'atrisk_mrr',        (select coalesce(sum(mrr), 0) from src where source = 'past_due'),
    'granted_total',     (select count(*) from src where source in ('invite','referral','comp')),
    'granted_invite',    (select count(*) from src where source = 'invite'),
    'granted_referral',  (select count(*) from src where source = 'referral'),
    'granted_comp',      (select count(*) from src where source = 'comp'),
    'granted_value',     (select coalesce(sum(mrr), 0) from src where source in ('invite','referral','comp')),
    -- spatna kompatibilita
    'paying',            (select count(*) from src where source = 'paid'),
    'mrr',               (select coalesce(sum(mrr), 0) from src where source = 'paid'),
    'signups_30d',       (select count(*) from linkove.accounts where created_at > now() - interval '30 days'),
    'new_paid_30d',      (select count(distinct account_id) from linkove.account_events
        where type in ('payment_succeeded','plan_upgrade') and to_plan in ('pro','business')
        and created_at > now() - interval '30 days'),
    'churn_30d',         (select count(*) from linkove.account_events
        where type in ('subscription_canceled','plan_expired')
        and created_at > now() - interval '30 days'),
    'active_30d',        (select count(*) from linkove.accounts a join auth.users u on u.id = a.id
        where u.last_sign_in_at > now() - interval '30 days')
  ) into result;

  return result;
end;
$function$;
