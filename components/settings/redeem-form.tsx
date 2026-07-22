"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { redeemCode } from "@/app/dashboard/actions";
import { PlanWelcomeModal } from "@/components/settings/plan-welcome-modal";

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
  const [state, action] = useActionState(redeemCode, undefined);
  const [showWelcome, setShowWelcome] = useState(false);

  // Kazdy uspesny redeem (aj opakovany, iny kod) otvori uvitacie okno nanovo.
  useEffect(() => {
    if (state?.granted) setShowWelcome(true);
  }, [state]);

  return (
    <>
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
        {state?.ok && !showWelcome && (
          <p className="rounded-lg border border-ok/25 bg-ok/5 px-3 py-2 text-sm text-ok">
            {state.ok}
          </p>
        )}
        {state?.error && <p className="alert-error">{state.error}</p>}
      </form>

      {showWelcome && state?.granted && (
        <PlanWelcomeModal
          granted={state.granted}
          onClose={() => setShowWelcome(false)}
        />
      )}
    </>
  );
}
