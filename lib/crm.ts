/**
 * Zdielana CRM logika pre admin — odvodenie stavu zivotneho cyklu z dat a
 * popisky udalosti. Ziadne DB volania, cisto mapovanie.
 */

export type Tone = "ok" | "danger" | "warn" | "muted" | "accent";

export type LifecycleInput = {
  plan: string;
  subscription_status: string | null;
  first_paid_at: string | null;
};

export type Lifecycle = { label: string; tone: Tone };

/** Stav klienta v cykle — jedno slovo pre zoznam + farebny tón. */
export function lifecycleStatus(a: LifecycleInput): Lifecycle {
  if (a.plan === "admin") return { label: "Admin", tone: "accent" };
  if (a.subscription_status === "past_due")
    return { label: "Payment issue", tone: "danger" };
  if (a.subscription_status === "trialing")
    return { label: "Trial", tone: "warn" };
  if (a.plan === "pro" || a.plan === "business")
    return { label: "Active", tone: "ok" };
  // plan === free: rozlisime nikdy-neplatiaceho od churnutého
  if (a.first_paid_at) return { label: "Churned", tone: "danger" };
  return { label: "Free", tone: "muted" };
}

/** Tailwind triedy pre farebny štítok podľa tónu. */
export const TONE_BADGE: Record<Tone, string> = {
  ok: "bg-ok/10 text-ok",
  danger: "bg-danger/10 text-danger",
  warn: "bg-amber-500/10 text-amber-600",
  muted: "bg-line text-soft",
  accent: "bg-accent/10 text-accent",
};

export const TONE_DOT: Record<Tone, string> = {
  ok: "bg-ok",
  danger: "bg-danger",
  warn: "bg-amber-500",
  muted: "bg-faint",
  accent: "bg-accent",
};

export type AccountEvent = {
  type: string;
  from_plan: string | null;
  to_plan: string | null;
  meta: Record<string, unknown>;
  created_at: string;
};

/** Ľudský popis udalosti pre časovú os. */
export function eventLabel(e: AccountEvent): { title: string; tone: Tone } {
  const to = e.to_plan ? cap(e.to_plan) : "";
  switch (e.type) {
    case "signup":
      return { title: "Signed up", tone: "muted" };
    case "plan_upgrade":
      return { title: `Upgraded to ${to}`, tone: "ok" };
    case "plan_downgrade":
      return { title: `Downgraded to ${to}`, tone: "warn" };
    case "promo_grant": {
      const code = typeof e.meta?.code === "string" ? e.meta.code : null;
      return {
        title: `Redeemed code${code ? ` ${code.toUpperCase()}` : ""} → ${to}`,
        tone: "accent",
      };
    }
    case "payment_succeeded":
      return { title: "Payment received", tone: "ok" };
    case "payment_failed":
      return { title: "Payment failed", tone: "danger" };
    case "subscription_canceled":
      return { title: "Canceled subscription", tone: "danger" };
    case "plan_expired":
      return { title: "Plan expired → Free", tone: "warn" };
    case "admin_change":
      return { title: `Admin set plan → ${to}`, tone: "accent" };
    default:
      return { title: e.type, tone: "muted" };
  }
}

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** €/mesiac príspevok podľa plánu — na MRR a hodnotu klienta. */
export function planMrr(plan: string): number {
  if (plan === "pro") return 4.99;
  if (plan === "business") return 14.99;
  return 0;
}

/* ---------- Zdroj príjmu: platiaci vs. free granty ---------- */

/**
 * Odkiaľ ma ucet platený plán. DB (linkove.revenue_source) to pocita a vracia
 * jeden z tychto klucov — tu su len popisky a farby. Kluc `paying` hovori, ci
 * z toho realne tecu peniaze (ide do MRR).
 */
export type RevenueSource =
  | "paid"
  | "trial"
  | "past_due"
  | "invite"
  | "referral"
  | "comp"
  | "free";

export const REVENUE_SOURCE: Record<
  RevenueSource,
  { label: string; tone: Tone; paying: boolean; note: string }
> = {
  paid: { label: "Paying", tone: "ok", paying: true, note: "Active card subscription" },
  trial: { label: "Trial", tone: "warn", paying: false, note: "In free trial, no payment yet" },
  past_due: { label: "At risk", tone: "danger", paying: false, note: "Payment failed" },
  invite: { label: "Promo code", tone: "accent", paying: false, note: "Redeemed a free code" },
  referral: { label: "Referral", tone: "accent", paying: false, note: "Referral reward" },
  comp: { label: "Comp", tone: "muted", paying: false, note: "Granted by you, free" },
  free: { label: "Free", tone: "muted", paying: false, note: "On the free plan" },
};

/** Bezpecne precitanie zdroja z DB (fallback na free pri neznamom). */
export function revenueSource(raw: string | null | undefined): RevenueSource {
  return raw && raw in REVENUE_SOURCE ? (raw as RevenueSource) : "free";
}

/* ---------- Zdielane formatovanie datumov v admin paneli ---------- */

export function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function fmtDateTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** „5d ago" / „today" — kompaktny relativny cas do tabuliek a feedov. */
export function relativeDays(iso: string | null): string {
  if (!iso) return "never";
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}
