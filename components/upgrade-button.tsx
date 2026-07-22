"use client";

import { useState } from "react";

/**
 * CTA na zaplatenie planu. POST /api/stripe/checkout a presmeruje na Stripe.
 *  • 401 (neprihlaseny) → /register — po registracii si plan kupi z dashboardu.
 *  • 503 (Stripe este nezapnuty) alebo ina chyba → jemna sprava pod tlacidlom,
 *    nic sa nerozbije. Vdaka tomu mozeme UI nasadit skor nez pridu kluce.
 */
export function UpgradeButton({
  plan,
  className,
  noteClassName = "text-soft",
  children,
}: {
  plan: "pro" | "business";
  className?: string;
  /** Farba spravy pod tlacidlom — na farebnych kartach napr. "text-white/85". */
  noteClassName?: string;
  children: React.ReactNode;
}) {
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  async function start() {
    if (busy) return;
    setBusy(true);
    setNote(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      if (res.status === 401) {
        window.location.href = "/register";
        return;
      }
      const data = (await res.json().catch(() => null)) as {
        url?: string;
        error?: string;
      } | null;
      if (res.ok && data?.url) {
        window.location.href = data.url;
        return;
      }
      setNote(
        res.status === 503
          ? "Payments open shortly — got a promo code? Redeem it in Settings."
          : (data?.error ?? "Something went wrong. Try again."),
      );
    } catch {
      setNote("Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={start}
        disabled={busy}
        className={`${className ?? ""} disabled:cursor-wait disabled:opacity-70`}
      >
        {busy ? "Opening…" : children}
      </button>
      {note && (
        <p
          role="status"
          className={`relative z-20 mt-2 text-center text-xs ${noteClassName}`}
        >
          {note}
        </p>
      )}
    </>
  );
}
