import Stripe from "stripe";

/**
 * Stripe klient a mapovanie planov na Price ID. Kluce a Price ID sa doplnia
 * cez env az ked bude Stripe ucet (zajtra). Kym nie su, `stripe` je null a
 * checkout/webhook sa spravaju ako „coming soon" — nic sa nerozbije.
 */

export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

/** Plan -> Stripe Price ID (mesacne predplatne). */
export const PLAN_PRICE: Record<"pro" | "business", string | undefined> = {
  pro: process.env.STRIPE_PRICE_PRO,
  business: process.env.STRIPE_PRICE_BUSINESS,
};

/** Stripe Price ID -> nas plan (pouziva webhook). */
export function planForPrice(priceId: string | undefined): string | null {
  if (!priceId) return null;
  if (priceId === process.env.STRIPE_PRICE_PRO) return "pro";
  if (priceId === process.env.STRIPE_PRICE_BUSINESS) return "business";
  return null;
}

export const stripeConfigured = !!stripe;
