"use client";

import { useEffect } from "react";
import { PLANS, PLAN_BULLETS } from "@/lib/plans";
import type { RedeemGrant } from "@/app/dashboard/actions";

/**
 * Uvitacie okno po uplatneni promokodu — ukaze presne aky plan a na ako
 * dlho (mesiace su na invite kode, viz redeem_invite RPC). Bez expires_at
 * (napr. trvaly admin grant) sa hovori o "no expiry" namiesto datumu.
 */
export function PlanWelcomeModal({
  granted,
  onClose,
}: {
  granted: RedeemGrant;
  onClose: () => void;
}) {
  const plan = PLANS[granted.plan];
  const bullets = PLAN_BULLETS[granted.plan];

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const expiresLabel = granted.expiresAt
    ? new Date(granted.expiresAt).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Welcome to ${plan.label}`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="card reveal w-full max-w-md p-8 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-bold tracking-wide text-indigo-600 uppercase">
          🎉 Unlocked
        </span>
        <h2 className="mt-4 font-grotesk text-3xl font-extrabold tracking-tight">
          Welcome to {plan.label}
        </h2>

        {expiresLabel ? (
          <p className="mt-2 text-sm text-soft">
            {granted.months
              ? `Free for ${granted.months} ${granted.months === 1 ? "month" : "months"} — `
              : "Free "}
            until <span className="font-medium text-ink">{expiresLabel}</span>.
          </p>
        ) : (
          <p className="mt-2 text-sm text-soft">Enjoy full access — no expiry.</p>
        )}

        <ul className="mt-6 space-y-2 text-left text-sm">
          {bullets.map((b) => (
            <li key={b} className="flex gap-2 text-ink">
              <span className="text-ok" aria-hidden>
                ✓
              </span>
              <span>{b}</span>
            </li>
          ))}
        </ul>

        <button type="button" onClick={onClose} className="btn-ink mt-8 w-full py-3">
          Let&apos;s go
        </button>
      </div>
    </div>
  );
}
