import type Stripe from "stripe";
import { stripe, PLAN_PRICE } from "@/lib/stripe";
import { SITE_URL } from "@/lib/site";

/**
 * Zdieľaná logika Stripe Checkoutu pre predplatné. Používa ju /api/stripe/checkout
 * (upgrade tlačidlo), redeem promo kódu v nastaveniach aj promo linky — nech je
 * na JEDNOM mieste: všetky predplatné aj promo/zľavy idú cez Stripe.
 *
 * Promo kódy sa zadávajú LEN na našom webe (pole v Stripe Checkoute je vypnuté),
 * lebo Stripe nevie z kódu sám spraviť trial. Kód s metadata `trial_days`
 * (napr. PRO2 = 31 dní zadarmo + zľava) dostane trial pridaný tu na serveri.
 */

export type CheckoutResult = { url: string } | { error: string; status: number };

/** Aktívny promotion code + čo z neho vyplýva pre checkout. */
export type FoundPromotion = {
  id: string;
  code: string;
  /** Dni zadarmo pred prvou platbou (z metadata `trial_days`), inak null. */
  trialDays: number | null;
  /** Stripe `restrictions.first_time_transaction` — len noví zákazníci. */
  firstTimeOnly: boolean;
};

const CODE_RE = /^[A-Z0-9]{3,40}$/;
export const MAX_TRIAL_DAYS = 90;

export function normalizePromoCode(raw: string): string | null {
  const code = raw.trim().toUpperCase();
  return CODE_RE.test(code) ? code : null;
}

/** `trial_days` z metadata promo kódu → celé číslo 1–90, inak null. */
export function trialDaysFromMetadata(
  metadata: Record<string, string> | null | undefined,
): number | null {
  const raw = metadata?.trial_days;
  if (!raw || !/^\d{1,3}$/.test(raw.trim())) return null;
  const days = Number(raw.trim());
  return days >= 1 && days <= MAX_TRIAL_DAYS ? days : null;
}

/** Nájde AKTÍVNY Stripe promotion code podľa zákazníckeho kódu (napr. PRO2). */
export async function findPromotion(raw: string): Promise<FoundPromotion | null> {
  if (!stripe) return null;
  const code = normalizePromoCode(raw);
  if (!code) return null;
  try {
    const found = await stripe.promotionCodes.list({
      code,
      active: true,
      limit: 1,
    });
    const pc = found.data[0];
    if (!pc) return null;
    return {
      id: pc.id,
      code: pc.code,
      trialDays: trialDaysFromMetadata(pc.metadata),
      firstTimeOnly: pc.restrictions?.first_time_transaction === true,
    };
  } catch {
    return null;
  }
}

/** Spätná kompatibilita — len ID promotion code. */
export async function findPromotionCode(raw: string): Promise<string | null> {
  return (await findPromotion(raw))?.id ?? null;
}

/**
 * Mal tento Stripe zákazník už niekedy predplatné (aj trial / zrušené)?
 * Neexistujúci zákazník (test→live, zmazaný) = bez histórie.
 */
async function customerHasSubscriptionHistory(customer: string): Promise<boolean> {
  try {
    const subs = await stripe!.subscriptions.list({
      customer,
      status: "all",
      limit: 1,
    });
    return subs.data.length > 0;
  } catch (e) {
    const err = e as { code?: string };
    if (err?.code === "resource_missing") return false;
    throw e;
  }
}

const RENEWAL_NOTE =
  "Subscriptions renew automatically until canceled. When a temporary discount ends, the regular plan price applies.";

function trialNote(days: number) {
  return `You won't be charged today. Your ${days}-day free trial then renews automatically at the discounted price shown above; when the discount ends, the regular plan price applies. Cancel anytime in Settings.`;
}

/**
 * Vytvorí Stripe Checkout session pre predplatné. Ak je zadaný promotion code,
 * predvyplní zľavu (a prípadný trial) a vždy vyžiada platobnú metódu na ďalšie
 * obnovenia. `requirePromo` = zlyhaj, ak kód nesedí (pre redeem toky, kde je kód
 * povinný). `firstTimeOnly` = kód len pre zákazníkov bez predchádzajúceho
 * predplatného (kontrolujeme aj my, nie len Stripe).
 */
export async function createSubscriptionCheckout(opts: {
  userId: string;
  email?: string | null;
  stripeCustomerId?: string | null;
  plan: "pro" | "business";
  promotionCodeId?: string | null;
  requirePromo?: boolean;
  trialDays?: number | null;
  firstTimeOnly?: boolean;
}): Promise<CheckoutResult> {
  if (!stripe) return { error: "Billing isn't switched on yet.", status: 503 };

  const price = PLAN_PRICE[opts.plan];
  if (!price) return { error: "That plan isn't available yet.", status: 503 };

  if (opts.requirePromo && !opts.promotionCodeId) {
    return { error: "That code isn't valid or has expired.", status: 400 };
  }

  const trialDays =
    opts.promotionCodeId &&
    opts.trialDays &&
    opts.trialDays >= 1 &&
    opts.trialDays <= MAX_TRIAL_DAYS
      ? Math.floor(opts.trialDays)
      : null;

  if (opts.promotionCodeId && opts.firstTimeOnly && opts.stripeCustomerId) {
    try {
      if (await customerHasSubscriptionHistory(opts.stripeCustomerId)) {
        return {
          error: "This offer is for new subscribers only.",
          status: 400,
        };
      }
    } catch (e) {
      console.error("stripe history check error:", e);
      return { error: "Couldn't start checkout. Try again.", status: 500 };
    }
  }

  const baseParams: Stripe.Checkout.SessionCreateParams = {
    mode: "subscription",
    line_items: [{ price, quantity: 1 }],
    client_reference_id: opts.userId,
    // Aj pri €0 faktúre / triale uloží platobnú metódu na platené obnovenia.
    payment_method_collection: "always",
    custom_text: {
      submit: { message: trialDays ? trialNote(trialDays) : RENEWAL_NOTE },
    },
    success_url: `${SITE_URL}/dashboard?upgraded=1`,
    cancel_url: `${SITE_URL}/#pricing`,
    subscription_data: {
      metadata: { user_id: opts.userId, plan: opts.plan },
      ...(trialDays ? { trial_period_days: trialDays } : {}),
    },
    metadata: { user_id: opts.userId, plan: opts.plan },
    // Kódy sa zadávajú len u nás (pole v Stripe je vypnuté — trial by sa
    // pri kóde zadanom priamo v Stripe nepridal).
    ...(opts.promotionCodeId
      ? { discounts: [{ promotion_code: opts.promotionCodeId }] }
      : {}),
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
    // ešte raz bez neho, aby checkout nikdy nepadol. Pri kóde len pre nových
    // zákazníkov skúšame znova LEN keď zákazník naozaj neexistuje — inak by
    // nový zákazník obišiel obmedzenie.
    const err = e as { code?: string; param?: string };
    const customerIssue =
      !!opts.stripeCustomerId &&
      (err?.code === "resource_missing" ||
        (!opts.firstTimeOnly && (err?.param ?? "").includes("customer")));
    if (!customerIssue) {
      console.error("stripe checkout error:", e);
      const promoRejected =
        !!opts.promotionCodeId &&
        ((err?.param ?? "").includes("discounts") ||
          (err?.code ?? "").includes("promotion_code"));
      return promoRejected
        ? { error: "This code can't be used on your account.", status: 400 }
        : { error: "Couldn't start checkout. Try again.", status: 500 };
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
