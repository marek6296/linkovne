"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { setPlan, type SetPlanState } from "@/app/admin/actions";
import { PLAN_KEYS, PLANS } from "@/lib/plans";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full border border-line px-3 py-1.5 text-sm text-soft transition hover:border-ink hover:text-ink disabled:opacity-50"
    >
      {pending ? "…" : "Set plan"}
    </button>
  );
}

/**
 * Rucna zmena planu v admine. DB (admin_set_plan) odmieta zmeny na
 * superadmin ucte a udelenie/odobratie 'admin' od kohokolvek okrem
 * superadmina — tento formular tu chybu skutocne ukaze, namiesto aby
 * zapadla ticho.
 */
export function SetPlanForm({
  accountId,
  currentPlan,
}: {
  accountId: string;
  currentPlan: string;
}) {
  const [state, action] = useActionState<SetPlanState, FormData>(
    (_prev, formData) => setPlan(accountId, formData),
    undefined,
  );

  return (
    <div>
      <form action={action} className="flex items-center gap-2">
        <select
          name="plan"
          defaultValue={currentPlan}
          className="rounded-lg border border-line bg-surface px-2 py-1.5 text-sm"
        >
          {PLAN_KEYS.map((key) => (
            <option key={key} value={key}>
              {PLANS[key].label}
            </option>
          ))}
        </select>
        <Submit />
      </form>
      {state?.error && (
        <p className="mt-1.5 text-xs text-danger">{state.error}</p>
      )}
    </div>
  );
}
