"use client";

import { useActionState, useEffect, useRef } from "react";
import type { RefObject } from "react";
import { useFormStatus } from "react-dom";
import type { AuthState } from "@/app/auth/actions";
import { submitAfterFill } from "@/lib/auth-submit-motion";

function Submit({
  label,
  accent,
  fillRef,
}: {
  label: string;
  accent?: "pink" | "blue";
  fillRef: RefObject<HTMLSpanElement | null>;
}) {
  const { pending } = useFormStatus();
  const cls = accent
    ? `gradient-button gradient-button--dark gradient-button--${accent} w-full px-6 py-3`
    : "btn-ink w-full";
  return (
    <button type="submit" disabled={pending} className={`${cls} auth-submit`} aria-busy={pending} data-submitting={pending}>
      {accent && <span ref={fillRef} className="auth-submit-fill" aria-hidden />}
      {pending && <span className="action-spinner" aria-hidden />}
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
  next,
}: {
  action: (state: AuthState, formData: FormData) => Promise<AuthState>;
  submitLabel: string;
  passwordHint?: string;
  /** Used by the password-reset request form. */
  emailOnly?: boolean;
  /** Click-fill color for the submit button — matches the auth panel color. */
  accent?: "pink" | "blue";
  /** Kam presmerovať po prihlásení (napr. /redeem/<code>). */
  next?: string;
}) {
  const fillRef = useRef<HTMLSpanElement>(null);
  const submitting = useRef(false);
  useEffect(() => {
    const fill = fillRef.current;
    return () => { fill?.getAnimations().forEach(animation => animation.cancel()); };
  }, []);
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    async (previous, data) => {
      try {
        return await submitAfterFill(
          fillRef.current,
          window.matchMedia("(prefers-reduced-motion: reduce)").matches,
          () => action(previous, data),
        );
      } finally {
        submitting.current = false;
      }
    },
    undefined,
  );

  if (state?.ok) {
    return (
      <p role="status" className="feedback-enter rounded-xl border border-ok/25 bg-ok/5 px-4 py-3 text-sm text-ok">
        {state.ok}
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-4" onSubmit={event => {
      if (submitting.current || pending) { event.preventDefault(); return; }
      submitting.current = true;
    }}>
      {next && <input type="hidden" name="next" value={next} />}
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
        <p role="alert" className="alert-error feedback-enter">
          {state.error}
        </p>
      )}

      <Submit label={submitLabel} accent={accent} fillRef={fillRef} />
    </form>
  );
}
