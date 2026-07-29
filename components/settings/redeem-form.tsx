"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { redeemPromoCode } from "@/app/dashboard/actions";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-ink shrink-0 px-5 disabled:opacity-50"
    >
      {pending ? "…" : "Apply"}
    </button>
  );
}

export function RedeemForm() {
  const [state, action] = useActionState(redeemPromoCode, undefined);

  // Platný kód → Stripe Checkout (100% = zadarmo, inak zľavnená platba).
  useEffect(() => {
    if (state?.url) window.location.href = state.url;
  }, [state]);

  return (
    <form action={action} className="space-y-2">
      <div className="flex gap-2">
        <input
          name="code"
          placeholder="Promo code"
          spellCheck={false}
          className="field uppercase tracking-wide"
        />
        <Submit />
      </div>
      {state?.url && (
        <p className="rounded-lg border border-ok/25 bg-ok/5 px-3 py-2 text-sm text-ok">
          Code accepted — taking you to secure checkout…
        </p>
      )}
      {state?.error && <p className="alert-error">{state.error}</p>}
    </form>
  );
}
