"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { AuthState } from "@/app/auth/actions";

function Submit({
  label,
  accent,
}: {
  label: string;
  accent?: "pink" | "blue";
}) {
  const { pending } = useFormStatus();
  const cls = accent
    ? `gradient-button gradient-button--dark gradient-button--${accent} w-full px-6 py-3`
    : "btn-ink w-full";
  return (
    <button type="submit" disabled={pending} className={cls}>
      {pending ? "One moment…" : label}
    </button>
  );
}

export function AuthForm({
  action,
  submitLabel,
  passwordHint,
  emailOnly = false,
  accent,
}: {
  action: (state: AuthState, formData: FormData) => Promise<AuthState>;
  submitLabel: string;
  passwordHint?: string;
  /** Used by the password-reset request form. */
  emailOnly?: boolean;
  /** Hover-fill color for the submit button — matches the auth panel color. */
  accent?: "pink" | "blue";
}) {
  const [state, formAction] = useActionState<AuthState, FormData>(
    action,
    undefined,
  );

  if (state?.ok) {
    return (
      <p className="rounded-xl border border-ok/25 bg-ok/5 px-4 py-3 text-sm text-ok">
        {state.ok}
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="field"
        />
      </div>

      {!emailOnly && (
        <div className="space-y-1.5">
          <label htmlFor="password" className="text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="field"
          />
          {passwordHint && <p className="text-xs text-faint">{passwordHint}</p>}
        </div>
      )}

      {state?.error && (
        <p role="alert" className="alert-error">
          {state.error}
        </p>
      )}

      <Submit label={submitLabel} accent={accent} />
    </form>
  );
}
