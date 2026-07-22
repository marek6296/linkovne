"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { changePassword, type AuthState } from "@/app/auth/actions";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-ink w-full">
      {pending ? "Saving…" : "Save new password"}
    </button>
  );
}

export function ResetForm({ redirectTo }: { redirectTo?: string }) {
  const [state, formAction] = useActionState<AuthState, FormData>(
    changePassword,
    undefined,
  );

  return (
    <form action={formAction} className="space-y-4">
      {redirectTo && <input type="hidden" name="next" value={redirectTo} />}

      <div className="space-y-1.5">
        <label htmlFor="password" className="text-sm font-medium">
          New password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          className="field"
        />
        <p className="text-xs text-faint">At least 10 characters.</p>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="confirm" className="text-sm font-medium">
          Repeat password
        </label>
        <input
          id="confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
          className="field"
        />
      </div>

      {state?.error && (
        <p role="alert" className="alert-error">
          {state.error}
        </p>
      )}

      <Submit />
    </form>
  );
}
