"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { createProfile, type ActionState } from "@/app/dashboard/actions";
import { SITE_DOMAIN } from "@/lib/site";

type Item = { id: string; username: string; is_published: boolean };

function CreateSubmit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-ink px-5 py-2.5 text-sm">
      {pending ? "Creating…" : "Create"}
    </button>
  );
}

export function ProfileSwitcher({
  profiles,
  currentId,
  canAddMore,
  limit,
}: {
  profiles: Item[];
  currentId: string;
  canAddMore: boolean;
  limit: number;
}) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [state, formAction] = useActionState<ActionState, FormData>(
    createProfile,
    undefined,
  );

  // Jeden profil a ziadna moznost pridat dalsi => prepinac je len sum
  if (profiles.length === 1 && !canAddMore) return null;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-xs font-medium tracking-wide text-faint uppercase">
          Profiles
        </span>

        {profiles.map((p) => (
          <button
            key={p.id}
            onClick={() => router.push(`/dashboard?p=${p.id}`)}
            className={`rounded-full border px-3.5 py-1.5 text-sm transition ${
              p.id === currentId
                ? "border-ink bg-ink text-paper"
                : "border-line hover:border-soft"
            }`}
          >
            {p.username}
          </button>
        ))}

        {canAddMore ? (
          <button
            onClick={() => setAdding((v) => !v)}
            className="rounded-full border border-dashed border-line px-3.5 py-1.5 text-sm text-soft transition hover:border-soft hover:text-ink"
          >
            + New profile
          </button>
        ) : (
          <span className="text-xs text-faint">
            {profiles.length}/{limit} profiles — upgrade for more
          </span>
        )}
      </div>

      {adding && canAddMore && (
        <div className="pt-3">
          <form action={formAction} className="flex flex-wrap items-center gap-3">
            <div className="flex flex-1 items-stretch overflow-hidden rounded-xl border border-line bg-surface focus-within:border-ink">
              <span className="flex items-center pl-4 text-faint">
                {SITE_DOMAIN}/
              </span>
              <input
                name="username"
                required
                autoFocus
                spellCheck={false}
                placeholder="clientname"
                className="w-full bg-transparent py-2.5 pr-4 pl-0.5 outline-none placeholder:text-faint"
              />
            </div>
            <CreateSubmit />
          </form>
          {state?.error && <p className="alert-error mt-2">{state.error}</p>}
        </div>
      )}
    </div>
  );
}
