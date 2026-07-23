"use client";

import { useState, useTransition } from "react";
import {
  giveUserDiscount,
  removeUserDiscount,
  type UserDiscountState,
} from "@/app/admin/clients/actions";

export function UserDiscount({
  customerId,
  canDiscount,
}: {
  customerId: string | null;
  canDiscount: boolean;
}) {
  const [kind, setKind] = useState<"percent" | "amount">("percent");
  const [duration, setDuration] = useState<"once" | "repeating" | "forever">(
    "forever",
  );
  const [state, setState] = useState<UserDiscountState>();
  const [pending, startTransition] = useTransition();

  if (!customerId || !canDiscount) {
    return (
      <p className="text-sm text-soft">
        Per-customer discounts apply to an active paid subscription. This
        customer has none yet — create a shareable promo code in{" "}
        <span className="font-medium">Discounts</span> instead.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <form
        action={(fd) =>
          startTransition(async () => {
            setState(await giveUserDiscount(customerId, fd));
          })
        }
        className="grid gap-3 sm:grid-cols-4"
      >
        <label className="text-xs text-soft">
          Type
          <select
            name="kind"
            value={kind}
            onChange={(e) => setKind(e.target.value as "percent" | "amount")}
            className="field mt-1 py-2"
          >
            <option value="percent">Percent (%)</option>
            <option value="amount">Amount (€)</option>
          </select>
        </label>
        <label className="text-xs text-soft">
          {kind === "percent" ? "% (100 = free)" : "€ off"}
          <input
            name="value"
            type="number"
            min={kind === "percent" ? 1 : 0.5}
            max={kind === "percent" ? 100 : undefined}
            step={kind === "percent" ? 1 : 0.5}
            required
            className="field mt-1 py-2"
          />
        </label>
        <label className="text-xs text-soft">
          For
          <select
            name="duration"
            value={duration}
            onChange={(e) =>
              setDuration(e.target.value as "once" | "repeating" | "forever")
            }
            className="field mt-1 py-2"
          >
            <option value="forever">Forever</option>
            <option value="repeating">N months</option>
            <option value="once">Once</option>
          </select>
        </label>
        {duration === "repeating" ? (
          <label className="text-xs text-soft">
            Months
            <input
              name="months"
              type="number"
              min={1}
              max={36}
              defaultValue={3}
              className="field mt-1 py-2"
            />
          </label>
        ) : (
          <div className="flex items-end">
            <button
              type="submit"
              disabled={pending}
              className="btn-ink w-full px-4 py-2 text-sm disabled:opacity-60"
            >
              {pending ? "Applying…" : "Apply"}
            </button>
          </div>
        )}
        {duration === "repeating" && (
          <div className="flex items-end sm:col-span-4">
            <button
              type="submit"
              disabled={pending}
              className="btn-ink px-5 py-2 text-sm disabled:opacity-60"
            >
              {pending ? "Applying…" : "Apply discount"}
            </button>
          </div>
        )}
      </form>

      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              setState(await removeUserDiscount(customerId));
            })
          }
          className="text-xs text-soft transition hover:text-danger disabled:opacity-50"
        >
          Remove current discount
        </button>
        {state?.error && <span className="text-xs text-danger">{state.error}</span>}
        {state?.ok && (
          <span className="text-xs text-emerald-700">Done — synced to Stripe.</span>
        )}
      </div>
    </div>
  );
}
