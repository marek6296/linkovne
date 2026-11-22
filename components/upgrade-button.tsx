"use client";

import { useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";

const CODE_RE = /^[A-Z0-9]{3,40}$/;

/**
 * CTA na zaplatenie planu. POST /api/stripe/checkout a presmeruje na Stripe.
 *  • 401 (neprihlaseny) → /register — s promo kodom rovno na /redeem/KOD po
 *    registracii, inak si plan kupi z dashboardu.
 *  • 503 (Stripe este nezapnuty) alebo ina chyba → jemna sprava pod tlacidlom,
 *    nic sa nerozbije. Vdaka tomu mozeme UI nasadit skor nez pridu kluce.
 *  • `promoField` = pod tlacidlom „Have a promo code?" — kody sa zadavaju LEN
 *    u nas (v Stripe checkoute pole nie je, trial by sa tam nepridal).
 */
export function UpgradeButton({
  plan,
  className,
  noteClassName = "text-soft",
  promoField = false,
  promoClassName,
  children,
}: {
  plan: "pro" | "business";
  className?: string;
  /** Farba spravy pod tlacidlom — na farebnych kartach napr. "text-white/85". */
  noteClassName?: string;
  promoField?: boolean;
  /** Vzhľad poľa na kód (na farebnych kartach biele/priehladne). */
  promoClassName?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const inputId = useId();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [promoOpen, setPromoOpen] = useState(false);
  const [promo, setPromo] = useState("");

  // Promo kod z linku (?promo=KOD) — predvyplnime a pole otvorime.
  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get("promo");
    const code = fromUrl?.trim().toUpperCase();
    if (code && CODE_RE.test(code)) {
      setPromo(code);
      if (promoField) setPromoOpen(true);
    }
  }, [promoField]);

  async function start() {
    if (busy) return;
    setNote(null);
    const code = promo.trim().toUpperCase();
    if (code && !CODE_RE.test(code)) {
      setNote("That code isn't valid. Check it and try again.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, promo: code || undefined }),
      });
      if (res.status === 401) {
        router.push(
          code
            ? `/register?next=${encodeURIComponent(`/redeem/${code}`)}`
            : "/register",
        );
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
      {promoField &&
        (promoOpen ? (
          <div className="relative z-20 mt-2 flex items-center gap-2">
            <label htmlFor={inputId} className="sr-only">
              Promo code
            </label>
            <input
              id={inputId}
              value={promo}
              onChange={(e) =>
                setPromo(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void start();
                }
              }}
              maxLength={40}
              autoComplete="off"
              spellCheck={false}
              placeholder="PROMO CODE"
              className={
                promoClassName ??
                "field min-w-0 flex-1 py-2 text-center font-mono text-sm uppercase tracking-widest"
              }
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              setPromoOpen(true);
              // Fokus len po kliknuti (nie pri ?promo= z linku — nescrollovat).
              requestAnimationFrame(() =>
                document.getElementById(inputId)?.focus(),
              );
            }}
            className={`relative z-20 mt-2 text-center text-xs underline decoration-dotted underline-offset-4 ${noteClassName}`}
          >
            Have a promo code?
          </button>
        ))}
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
