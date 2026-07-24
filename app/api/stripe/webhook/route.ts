import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { stripe, planForPrice } from "@/lib/stripe";

export const dynamic = "force-dynamic";

/** Service-role klient — webhook nema session a musi pisat naprie uctami. */
function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { db: { schema: "linkove" }, auth: { persistSession: false } },
  );
}

/** Poradie planov — na rozlisenie upgrade vs downgrade v evente. */
const PLAN_RANK: Record<string, number> = { free: 0, pro: 1, business: 2, admin: 3 };

/** Zapis do CRM event logu (service_role obchadza RLS). Best-effort. */
async function logEvent(
  accountId: string,
  type: string,
  fromPlan: string | null,
  toPlan: string | null,
  meta: Record<string, unknown> = {},
) {
  try {
    await admin().from("account_events").insert({
      account_id: accountId,
      type,
      from_plan: fromPlan,
      to_plan: toPlan,
      meta,
    });
  } catch (e) {
    console.error("logEvent failed:", e);
  }
}

/** Najde nas ucet (id) podla user_id z metadata alebo podla Stripe zakaznika. */
async function resolveAccount(sub: Stripe.Subscription, userId?: string) {
  const supabase = admin();
  const q = supabase.from("accounts").select("id, plan");
  const { data } = userId
    ? await q.eq("id", userId).maybeSingle()
    : await q.eq("stripe_customer_id", String(sub.customer)).maybeSingle();
  return data as { id: string; plan: string } | null;
}

/** Ucet podla Stripe customer id (pre invoice/cancel eventy). */
async function accountByCustomer(customer: string) {
  const { data } = await admin()
    .from("accounts")
    .select("id, plan")
    .eq("stripe_customer_id", customer)
    .maybeSingle();
  return data as { id: string; plan: string } | null;
}

async function applySubscription(sub: Stripe.Subscription, userId?: string) {
  const supabase = admin();
  const item = sub.items.data[0];
  const price = item?.price?.id;
  const plan = planForPrice(price);
  // Pristup drzime aj pocas `past_due` — Stripe kartu par dni znova skusa
  // (grace). Na „free" padne az ked Stripe subscription zrusi (canceled /
  // unpaid → subscription.deleted). Takze jedno docasne zlyhanie karty Pro
  // nezhodi, ale ked realne nie su peniaze, po vycerpani pokusov to padne
  // na free. Immediate cut by stacilo z tohto zoznamu vyhodit "past_due".
  const hasAccess =
    sub.status === "active" ||
    sub.status === "trialing" ||
    sub.status === "past_due";
  // current_period_end je (podla verzie SDK) na polozke alebo na subscription.
  const periodEndUnix =
    (item as unknown as { current_period_end?: number })?.current_period_end ??
    (sub as unknown as { current_period_end?: number }).current_period_end ??
    0;
  const periodEnd = new Date(periodEndUnix * 1000).toISOString();

  const newPlan = hasAccess && plan ? plan : "free";
  const before = await resolveAccount(sub, userId);
  const oldPlan = before?.plan ?? null;

  const patch = {
    stripe_customer_id: String(sub.customer),
    stripe_subscription_id: sub.id,
    subscription_status: sub.status,
    plan: newPlan,
    plan_expires_at: hasAccess ? periodEnd : null,
  };

  // Najprv skusime podla user_id z metadata, inak podla zakaznika.
  if (userId) {
    await supabase.from("accounts").update(patch).eq("id", userId);
  } else {
    await supabase
      .from("accounts")
      .update(patch)
      .eq("stripe_customer_id", String(sub.customer));
  }

  // Event: len ked sa plan realne zmenil na PLATENY (churn na free rieši
  // subscription.deleted, nech sa neloguje dvakrat).
  const acctId = before?.id ?? userId;
  if (acctId && newPlan !== "free" && oldPlan !== newPlan) {
    const up = (PLAN_RANK[newPlan] ?? 0) >= (PLAN_RANK[oldPlan ?? "free"] ?? 0);
    await logEvent(acctId, up ? "plan_upgrade" : "plan_downgrade", oldPlan, newPlan, {
      status: sub.status,
      price,
    });
  }
}

/**
 * Odmena za referral po prvej platbe privedeneho usera.
 *  • Free referrer → grant Pro cez plan_expires_at (atomicky spravi RPC, hned
 *    'rewarded').
 *  • Platiaci referrer → RPC referral len ZAMKNE do stavu 'claiming' a kredit
 *    pripiseme v Stripe (N × mesacna cena Pro). AZ po uspesnom kredite ho
 *    confirm posunie na 'rewarded'; pri zlyhani release vrati na 'pending',
 *    takze sa odmena neztrati — zopakuje sa pri dalsej platbe.
 */
async function rewardReferrer(referredUserId: string) {
  const supabase = admin();
  const { data } = await supabase.rpc("claim_referral_reward", {
    p_referred_id: referredUserId,
  });
  const reward = data as {
    referrer_id: string;
    paying: boolean;
    stripe_customer_id: string | null;
    months: number;
  } | null;

  // Nic na spracovanie, alebo neplatiaci referrer (uz odmeneny v RPC).
  if (!reward || !reward.paying) return;

  // Od tohto bodu je referral v stave 'claiming' — musime ho uzavriet.
  try {
    if (!stripe || !reward.stripe_customer_id) throw new Error("stripe not ready");
    const priceId = process.env.STRIPE_PRICE_PRO;
    if (!priceId) throw new Error("missing STRIPE_PRICE_PRO");
    const price = await stripe.prices.retrieve(priceId);
    const unit = price.unit_amount ?? 0;
    if (unit <= 0) throw new Error("invalid Pro price");
    await stripe.customers.createBalanceTransaction(reward.stripe_customer_id, {
      amount: -(unit * reward.months), // zaporne = kredit v prospech zakaznika
      currency: price.currency,
      description: `Referral reward — ${reward.months} months Pro`,
    });
    // Kredit presiel → definitivne oznac ako odmenene.
    await supabase.rpc("confirm_referral_reward", { p_referred_id: referredUserId });
  } catch (e) {
    // Kredit zlyhal → vrat na 'pending', nech sa odmena neztrati (retry).
    console.error("referral stripe credit failed, releasing for retry:", e);
    await supabase.rpc("release_referral_reward", { p_referred_id: referredUserId });
  }
}

export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) {
    return NextResponse.json({ error: "Not configured." }, { status: 503 });
  }

  const body = await request.text();
  const sig = request.headers.get("stripe-signature") ?? "";

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch {
    return NextResponse.json({ error: "Bad signature." }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object as Stripe.Checkout.Session;
        const userId = s.client_reference_id ?? s.metadata?.user_id ?? undefined;
        if (s.subscription) {
          const sub = await stripe.subscriptions.retrieve(
            String(s.subscription),
          );
          await applySubscription(sub, userId ?? undefined);
        }
        // Referral odmenu riesime v `invoice.paid` (az ked realne prisli
        // peniaze), nie tu — 100% zlavovy kod vytvori session s amount €0 a
        // odmena nesmie padnut bez skutocnej platby.
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.created": {
        const sub = event.data.object as Stripe.Subscription;
        await applySubscription(sub, sub.metadata?.user_id);
        break;
      }
      case "invoice.paid": {
        const inv = event.data.object as Stripe.Invoice;
        const reason = (inv as unknown as { billing_reason?: string }).billing_reason;
        const isSubInvoice =
          reason === "subscription_create" || reason === "subscription_cycle";
        if (inv.customer && isSubInvoice) {
          // Realne zaplatena suma (po zlave) = mesacne MRR uctu. €0 pri 100%
          // zlave je spravne 0.
          await admin()
            .from("accounts")
            .update({ mrr_cents: inv.amount_paid })
            .eq("stripe_customer_id", String(inv.customer));

          const acct = await accountByCustomer(String(inv.customer));
          if (acct) {
            // Referral odmena — az ked privedeny user REALNE zaplatil
            // (amount_paid > 0). 100% zlava = €0 → referrer NEDOSTANE odmenu.
            // Idempotentne: RPC odmeni len raz (pending → rewarded).
            if ((inv.amount_paid ?? 0) > 0) await rewardReferrer(acct.id);

            // Uspesna OBNOVA → signal „plati dalej". Prvu platbu (subscription_
            // create) nelogujeme — upgrade uz zalogoval subscription.updated.
            if (reason === "subscription_cycle") {
              await logEvent(acct.id, "payment_succeeded", acct.plan, acct.plan, {
                amount: inv.amount_paid,
                currency: inv.currency,
              });
            }
          }
        }
        break;
      }
      case "invoice.payment_failed": {
        // Zlyhana obnova: plan zatial nechavame (Stripe dunning to skusi znova
        // a pripadne posle subscription.deleted) — len oznacime stav, aby
        // Settings vedeli ukazat „update your card".
        const inv = event.data.object as Stripe.Invoice;
        if (inv.customer) {
          const supabase = admin();
          await supabase
            .from("accounts")
            .update({ subscription_status: "past_due" })
            .eq("stripe_customer_id", String(inv.customer));
          const acct = await accountByCustomer(String(inv.customer));
          if (acct) {
            await logEvent(acct.id, "payment_failed", acct.plan, acct.plan, {
              amount: (inv as unknown as { amount_due?: number }).amount_due,
              currency: inv.currency,
            });
          }
        }
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const supabase = admin();
        const acct = await accountByCustomer(String(sub.customer));
        await supabase
          .from("accounts")
          .update({
            plan: "free",
            plan_expires_at: null,
            subscription_status: "canceled",
            stripe_subscription_id: null,
            mrr_cents: 0,
          })
          .eq("stripe_customer_id", String(sub.customer));
        if (acct) {
          await logEvent(acct.id, "subscription_canceled", acct.plan, "free", {});
        }
        break;
      }
      case "customer.discount.created":
      case "customer.discount.updated":
      case "customer.discount.deleted": {
        // Zlava priradena/odobrana konkretnemu zakaznikovi — zalogujeme komu
        // (Growth prehlad). Coupon detail berieme z discountu.
        const disc = event.data.object as Stripe.Discount;
        if (!disc.customer) break;
        const acct = await accountByCustomer(String(disc.customer));
        if (!acct) break;
        // Coupon je vo v22 pod source.coupon (string id alebo objekt).
        const rawCoupon = disc.source?.coupon;
        const c =
          typeof rawCoupon === "object" && rawCoupon !== null ? rawCoupon : null;
        const type =
          event.type === "customer.discount.deleted"
            ? "discount_removed"
            : "discount_applied";
        await logEvent(acct.id, type, acct.plan, acct.plan, {
          coupon: c?.id ?? (typeof rawCoupon === "string" ? rawCoupon : null),
          percent_off: c?.percent_off ?? null,
          amount_off: c?.amount_off ?? null,
          currency: c?.currency ?? null,
          duration: c?.duration ?? null,
          duration_in_months: c?.duration_in_months ?? null,
          promotion_code:
            typeof disc.promotion_code === "string"
              ? disc.promotion_code
              : (disc.promotion_code?.id ?? null),
        });
        break;
      }
    }
  } catch (e) {
    console.error("stripe webhook error:", e);
    return NextResponse.json({ error: "handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
