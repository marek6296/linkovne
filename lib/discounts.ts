import type Stripe from "stripe";

/**
 * Zostaví parametre pre Stripe coupon zo vstupu z admin formulára. Čistá,
 * zdieľaná logika — používa ju tvorba promo kódov aj per-user zľava, nech je
 * validácia (a mapovanie €→centy) na jednom mieste.
 */
export type CouponInput = {
  kind: string; // "percent" | "amount"
  value: number;
  duration: string; // "once" | "repeating" | "forever"
  months?: number;
  name?: string;
};

export function buildCouponParams(
  i: CouponInput,
): { params: Stripe.CouponCreateParams } | { error: string } {
  const params: Stripe.CouponCreateParams = {
    name: i.name?.trim() ? i.name.trim().slice(0, 80) : undefined,
  };

  if (i.kind === "percent") {
    if (!(i.value >= 1 && i.value <= 100)) {
      return { error: "Percentage must be between 1 and 100." };
    }
    params.percent_off = i.value;
  } else {
    if (!(i.value > 0)) return { error: "Amount must be greater than 0." };
    params.amount_off = Math.round(i.value * 100); // €→centy
    params.currency = "eur";
  }

  if (i.duration === "forever") {
    params.duration = "forever";
  } else if (i.duration === "repeating") {
    const m = i.months ?? 0;
    if (!(m >= 1 && m <= 36)) {
      return { error: "Repeating length must be 1–36 months." };
    }
    params.duration = "repeating";
    params.duration_in_months = m;
  } else {
    params.duration = "once";
  }

  return { params };
}

/** Ľudský popis zľavy z couponu (pre admin UI). */
export function couponLabel(c: {
  percent_off?: number | null;
  amount_off?: number | null;
  currency?: string | null;
  duration?: string | null;
  duration_in_months?: number | null;
}): string {
  const amount =
    c.percent_off != null
      ? c.percent_off === 100
        ? "Free (100% off)"
        : `${c.percent_off}% off`
      : c.amount_off != null
        ? `${(c.amount_off / 100).toFixed(2)} ${(c.currency ?? "eur").toUpperCase()} off`
        : "—";
  const dur =
    c.duration === "forever"
      ? "forever"
      : c.duration === "repeating"
        ? `for ${c.duration_in_months} months`
        : "once";
  return `${amount} · ${dur}`;
}
