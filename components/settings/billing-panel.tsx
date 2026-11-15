"use client";

import { useState } from "react";
import { planOf } from "@/lib/plans";
import { UpgradeButton } from "@/components/upgrade-button";

/**
 * Sekcia Billing v Settings — aktualny plan, stav predplatneho a akcie:
 *  • free → upgrade tlacidla (Stripe Checkout),
 *  • platiaci so Stripe zakaznikom → „Manage billing" (Customer Portal).
 * Plan z invite/promo kodu nema Stripe zakaznika — vtedy portal neponukame.
 */

const PLAN_LABEL: Record<string, string> = {
  free: "Free",
  pro: "Pro",
  business: "Business",
  admin: "Admin",
};

const STATUS_LABEL: Record<string, string> = {
  active: "Active",
  trialing: "Trial",
  past_due: "Payment issue",
  canceled: "Canceled",
};

export function BillingPanel({
  plan,
  status,
  expiresAt,
  hasStripeCustomer,
}: {
  plan: string;
  status: string | null;
  expiresAt: string | null;
  hasStripeCustomer: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const features = planOf(plan);
  const paid = plan === "pro" || plan === "business";
  const renewal =
    expiresAt &&
    new Date(expiresAt).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  async function openPortal() {
    if (busy) return;
    setBusy(true);
    setNote(null);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = (await res.json().catch(() => null)) as {
        url?: string;
        error?: string;
      } | null;
      if (res.ok && data?.url) {
        window.location.href = data.url;
        return;
      }
      setNote(data?.error ?? "Couldn't open billing. Try again.");
    } catch {
      setNote("Couldn't open billing. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card billing-summary max-w-md p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-soft">Current plan</p>
          <p className="mt-0.5 font-grotesk text-2xl font-bold text-ink">
            {PLAN_LABEL[plan] ?? plan}
          </p>
        </div>
        {status && STATUS_LABEL[status] && (
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              status === "past_due"
                ? "bg-danger/10 text-danger"
                : "bg-ok/10 text-ok"
            }`}
          >
            {STATUS_LABEL[status]}
          </span>
        )}
      </div>

      <p className="billing-description">
        {plan === "admin"
          ? "Full access for managing Linkovne."
          : features.tagline}
      </p>
      <dl className="billing-features">
        <div>
          <dt>Profiles</dt>
          <dd>Up to {features.profiles}</dd>
        </div>
        <div>
          <dt>Blocks per page</dt>
          <dd>{features.maxBlocks ?? "Unlimited"}</dd>
        </div>
        <div>
          <dt>Analytics history</dt>
          <dd>{features.analyticsDays} days</dd>
        </div>
      </dl>
      {paid && renewal && (
        <p className="mt-2 text-sm text-soft">
          {status === "canceled" ? "Access until" : "Renews"} {renewal}
        </p>
      )}
      {status === "past_due" && (
        <p className="mt-2 text-sm text-danger">
          Your last payment didn&apos;t go through — update your card to keep
          your plan.
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {(plan === "free" || plan === "pro") && (
          <UpgradeButton
            plan={plan === "pro" ? "business" : "pro"}
            className="btn-ink px-5 py-2 text-sm"
          >
            {plan === "pro" ? "Upgrade to Business" : "Upgrade to Pro"}
          </UpgradeButton>
        )}
        {plan === "free" && (
          <UpgradeButton plan="business" className="btn-line px-5 py-2 text-sm">
            Get Business
          </UpgradeButton>
        )}
        {hasStripeCustomer && (
          <button
            type="button"
            onClick={openPortal}
            disabled={busy}
            className="btn-line px-5 py-2 text-sm disabled:cursor-wait disabled:opacity-70"
          >
            {busy ? "Opening…" : "Manage billing"}
          </button>
        )}
      </div>
      {note && (
        <p role="status" className="mt-2 text-xs text-danger">
          {note}
        </p>
      )}
    </div>
  );
}
