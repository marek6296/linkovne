import type Stripe from "stripe";
import { stripe, PLAN_PRICE } from "@/lib/stripe";
import { SITE_URL } from "@/lib/site";

/**
 * Zdieľaná logika Stripe Checkoutu pre predplatné. Používa ju /api/stripe/checkout
 * (upgrade tlačidlo), redeem promo kódu v nastaveniach aj promo linky — nech je
 * na JEDNOM mieste: všetky predplatné aj promo/zľavy idú cez Stripe.
 */

export type CheckoutResult = { url: string } | { error: string; status: number };

const CODE_RE = /^[A-Z0-9]{3,40}$/;

/** Nájde AKTÍVNY Stripe promotion code podľa zákazníckeho kódu (napr. FRIEND50). */
export async function findPromotionCode(raw: string): Promise<string | null> {
  if (!stripe) return null;
  const code = raw.trim().toUpperCase();
  if (!CODE_RE.test(code)) return null;
  try {
    const found = await stripe.promotionCodes.list({
      code,
      active: true,
      limit: 1,
    });
    return found.data[0]?.id ?? null;
  } catch {
    return null;
  }
}

/**
 * Vytvorí Stripe Checkout session pre predplatné. Ak je zadaný promotion code,
 * predvyplní zľavu (100% = €0 → nepýta kartu). `requirePromo` = zlyhaj, ak kód
 * nesedí (pre redeem toky, kde je kód povinný).
 */
export async function createSubscriptionCheckout(opts: {
  userId: string;
  email?: string | null;
  stripeCustomerId?: string | null;
  plan: "pro" | "business";
  promotionCodeId?: string | null;
  requirePromo?: boolean;
}): Promise<CheckoutResult> {
  if (!stripe) return { error: "Billing isn't switched on yet.", status: 503 };

  const price = PLAN_PRICE[opts.plan];
  if (!price) return { error: "That plan isn't available yet.", status: 503 };

  if (opts.requirePromo && !opts.promotionCodeId) {
    return { error: "That code isn't valid or has expired.", status: 400 };
  }

  const baseParams: Stripe.Checkout.SessionCreateParams = {
    mode: "subscription",
    line_items: [{ price, quantity: 1 }],
    client_reference_id: opts.userId,
    // 100% zľava = €0 → Stripe vtedy nepýta kartu (inak by ju vyžadoval).
    payment_method_collection: "if_required",
    success_url: `${SITE_URL}/dashboard?upgraded=1`,
    cancel_url: `${SITE_URL}/#pricing`,
    subscription_data: { metadata: { user_id: opts.userId, plan: opts.plan } },
    metadata: { user_id: opts.userId, plan: opts.plan },
    // discounts a allow_promotion_codes sa VYLUČUJÚ.
    ...(opts.promotionCodeId
      ? { discounts: [{ promotion_code: opts.promotionCodeId }] }
      : { allow_promotion_codes: true }),
  };

  const create = (params: Stripe.Checkout.SessionCreateParams) =>
    stripe!.checkout.sessions.create(params);

  try {
    const session = await create({
      ...baseParams,
      customer: opts.stripeCustomerId ?? undefined,
      customer_email: opts.stripeCustomerId ? undefined : opts.email ?? undefined,
    });
    return session.url
      ? { url: session.url }
      : { error: "Couldn't start checkout. Try again.", status: 500 };
  } catch (e) {
    // Uložený stripe_customer_id môže byť neplatný (test→live, zmazaný) — skúsime
    // ešte raz bez neho, aby checkout nikdy nepadol.
    const err = e as { code?: string; param?: string };
    const customerIssue =
      !!opts.stripeCustomerId &&
      (err?.code === "resource_missing" ||
        (err?.param ?? "").includes("customer"));
    if (!customerIssue) {
      console.error("stripe checkout error:", e);
      return { error: "Couldn't start checkout. Try again.", status: 500 };
    }
    try {
      const session = await create({
        ...baseParams,
        customer_email: opts.email ?? undefined,
      });
      return session.url
        ? { url: session.url }
        : { error: "Couldn't start checkout. Try again.", status: 500 };
    } catch (e2) {
      console.error("stripe checkout retry error:", e2);
      return { error: "Couldn't start checkout. Try again.", status: 500 };
    }
  }
}
