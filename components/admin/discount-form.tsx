"use client";

import { useState, useTransition } from "react";
import {
  createDiscount,
  deactivatePromoCode,
  type DiscountState,
} from "@/app/admin/discounts/actions";

export function DiscountForm() {
  const [kind, setKind] = useState<"percent" | "amount">("percent");
  const [duration, setDuration] = useState<"once" | "repeating" | "forever">(
    "once",
  );
  const [state, setState] = useState<DiscountState>();
  const [pending, startTransition] = useTransition();

  return (
    <form
      action={(fd) =>
        startTransition(async () => {
          const res = await createDiscount(fd);
          setState(res);
          if (res?.ok) {
            (document.getElementById("discount-form") as HTMLFormElement)?.reset();
          }
        })
      }
      id="discount-form"
      className="space-y-4 rounded-2xl border border-line bg-surface p-5"
    >
      <p className="text-sm font-semibold">Create a discount</p>

      {/* Typ + hodnota */}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs text-soft">
          Discount type
          <select
            name="kind"
            value={kind}
            onChange={(e) => setKind(e.target.value as "percent" | "amount")}
            className="field mt-1 py-2"
          >
            <option value="percent">Percent off (%)</option>
            <option value="amount">Fixed amount off (€)</option>
          </select>
        </label>
        <label className="text-xs text-soft">
          {kind === "percent" ? "Percent (1–100, 100 = free)" : "Amount in €"}
          <input
            name="value"
            type="number"
            min={kind === "percent" ? 1 : 0.5}
            max={kind === "percent" ? 100 : undefined}
            step={kind === "percent" ? 1 : 0.5}
            required
            placeholder={kind === "percent" ? "50" : "3.00"}
            className="field mt-1 py-2"
          />
        </label>
      </div>

      {/* Trvanie */}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs text-soft">
          Applies for
          <select
            name="duration"
            value={duration}
            onChange={(e) =>
              setDuration(e.target.value as "once" | "repeating" | "forever")
            }
            className="field mt-1 py-2"
          >
            <option value="once">Once (first invoice)</option>
            <option value="repeating">A number of months</option>
            <option value="forever">Forever</option>
          </select>
        </label>
        {duration === "repeating" && (
          <label className="text-xs text-soft">
            Months (1–36)
            <input
              name="months"
              type="number"
              min={1}
              max={36}
              defaultValue={3}
              className="field mt-1 py-2"
            />
          </label>
        )}
      </div>

      {/* Kód + limity */}
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="text-xs text-soft">
          Code (optional)
          <input
            name="code"
            placeholder="FRIEND50"
            className="field mt-1 py-2 uppercase"
          />
        </label>
        <label className="text-xs text-soft">
          Max uses (optional)
          <input
            name="max_redemptions"
            type="number"
            min={1}
            placeholder="∞"
            className="field mt-1 py-2"
          />
        </label>
        <label className="text-xs text-soft">
          Expires (optional)
          <input name="expires_at" type="date" className="field mt-1 py-2" />
        </label>
      </div>

      <label className="block text-xs text-soft">
        Internal note (optional)
        <input
          name="note"
          placeholder="Launch promo / friend"
          className="field mt-1 py-2"
        />
      </label>

      {state?.error && (
        <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      )}
      {state?.ok && (
        <p className="rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700">
          Discount code created — it&apos;s live in Stripe.
        </p>
      )}

      <button type="submit" disabled={pending} className="btn-ink px-5 py-2.5 text-sm disabled:opacity-60">
        {pending ? "Creating…" : "Create code"}
      </button>
    </form>
  );
}

export function DeactivateCodeButton({ id, code }: { id: string; code: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!confirm(`Deactivate ${code}? Existing discounts keep running.`)) {
          return;
        }
        startTransition(async () => {
          await deactivatePromoCode(id);
        });
      }}
      className="text-xs text-soft transition hover:text-danger disabled:opacity-50"
    >
      {pending ? "…" : "Deactivate"}
    </button>
  );
}
