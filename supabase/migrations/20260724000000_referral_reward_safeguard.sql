-- Poistka pri referral odmene pre PLATIACICH referrerov: kredit pripisuje Stripe
-- (webhook), takze referral sa nesmie oznacit ako 'rewarded' skor, nez kredit
-- realne prejde. Zavadzame medzistav 'claiming':
--   pending → claiming (claim, uzamkne kvoli idempotencii)
--           → rewarded  (confirm, az po uspesnom Stripe kredite)
--           → pending   (release, pri zlyhani kreditu → retry pri dalsej platbe)
-- Neplatiaci referrer nema externy krok (grant je atomicky) → rovno 'rewarded'.

alter table linkove.referrals drop constraint if exists referrals_status_check;
alter table linkove.referrals
  add constraint referrals_status_check
  check (status in ('pending', 'claiming', 'rewarded', 'void'));

create or replace function linkove.claim_referral_reward(p_referred_id uuid)
 returns jsonb language plpgsql security definer
 set search_path to 'linkove', 'pg_temp'
as $function$
declare r linkove.referrals; ref linkove.accounts; v_paying boolean; v_claim boolean;
begin
  select * into r from linkove.referrals
    where referred_id = p_referred_id and status = 'pending' for update;
  if r.referred_id is null then return null; end if;

  select * into ref from linkove.accounts where id = r.referrer_id for update;
  v_paying := ref.stripe_subscription_id is not null
              and ref.subscription_status in ('active','trialing');
  -- „claim" = platiaci referrer, ktory nie je admin → kredit rieši Stripe.
  v_claim := v_paying and ref.plan <> 'admin';

  if v_claim then
    -- Len uzamkneme; na 'rewarded' posunie confirm_referral_reward po kredite.
    update linkove.referrals set status = 'claiming' where referred_id = p_referred_id;
  else
    -- Neplatiaci (alebo admin): odmena je atomicka, ziadny externy krok.
    update linkove.referrals set status = 'rewarded', rewarded_at = now()
      where referred_id = p_referred_id;
    if ref.plan <> 'admin' then
      update linkove.accounts
        set plan = case when plan = 'free' then 'pro' else plan end,
            plan_expires_at = greatest(coalesce(plan_expires_at, now()), now())
                              + (r.reward_months || ' months')::interval
        where id = r.referrer_id;
    end if;
  end if;

  return jsonb_build_object(
    'referrer_id',        r.referrer_id,
    'paying',             v_claim,
    'stripe_customer_id', ref.stripe_customer_id,
    'months',             r.reward_months
  );
end $function$;

-- Potvrdenie po uspesnom Stripe kredite: claiming → rewarded.
create or replace function linkove.confirm_referral_reward(p_referred_id uuid)
 returns void language plpgsql security definer
 set search_path to 'linkove', 'pg_temp'
as $function$
begin
  update linkove.referrals set status = 'rewarded', rewarded_at = now()
    where referred_id = p_referred_id and status = 'claiming';
end $function$;

-- Uvolnenie pri zlyhani kreditu: claiming → pending (retry pri dalsej platbe).
create or replace function linkove.release_referral_reward(p_referred_id uuid)
 returns void language plpgsql security definer
 set search_path to 'linkove', 'pg_temp'
as $function$
begin
  update linkove.referrals set status = 'pending'
    where referred_id = p_referred_id and status = 'claiming';
end $function$;

-- Tieto dva volá výlučne Stripe webhook (service_role) — nie klienti.
revoke execute on function linkove.confirm_referral_reward(uuid) from anon, authenticated;
revoke execute on function linkove.release_referral_reward(uuid) from anon, authenticated;
