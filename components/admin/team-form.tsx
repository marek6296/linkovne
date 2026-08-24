"use client";

import { useState, useTransition } from "react";
import { addAdmin, removeAdmin, type TeamState } from "@/app/admin/team/actions";

export function AddAdminForm() {
  const [state, setState] = useState<TeamState>();
  const [pending, startTransition] = useTransition();

  return (
    <form
      action={(fd) =>
        startTransition(async () => {
          const res = await addAdmin(fd);
          setState(res);
          if (res?.ok) {
            (document.getElementById("add-admin-form") as HTMLFormElement)?.reset();
          }
        })
      }
      id="add-admin-form"
      className="space-y-3 rounded-2xl border border-line bg-surface p-5"
    >
      <div>
        <p className="text-sm font-semibold">Add an admin</p>
        <p className="mt-1 text-sm text-soft">
          They get the full operator account (admin plan, everything unlocked)
          and access to this panel. If they already have an account, it&apos;s
          upgraded instantly.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          name="email"
          type="email"
          required
          autoComplete="off"
          placeholder="teammate@email.com"
          className="field"
        />
        <button
          type="submit"
          disabled={pending}
          className="btn-ink shrink-0 px-5 py-2.5 text-sm disabled:opacity-60"
        >
          {pending ? "Adding…" : "Add admin"}
        </button>
      </div>

      {state?.error && (
        <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      )}
      {state?.ok && (
        <p className="rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700">
          Admin added.
        </p>
      )}
    </form>
  );
}

export function RemoveAdminButton({
  email,
  disabled,
}: {
  email: string;
  disabled?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (disabled) {
    return <span className="text-xs text-faint">You</span>;
  }

  return (
    <span className="flex items-center gap-2">
      {error && <span className="text-xs text-danger">{error}</span>}
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (
            !confirm(
              `Remove ${email} as admin? They lose admin access and drop to the free plan.`,
            )
          ) {
            return;
          }
          setError(null);
          startTransition(async () => {
            const res = await removeAdmin(email);
            if (res?.error) setError(res.error);
          });
        }}
        className="text-xs text-soft transition hover:text-danger disabled:opacity-50"
      >
        {pending ? "…" : "Remove"}
      </button>
    </span>
  );
}
