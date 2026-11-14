"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { createProfile, type ActionState } from "@/app/dashboard/actions";
import {
  EDITOR_DRAFT_STATE_EVENT,
  type EditorDraftState,
} from "@/lib/editor-draft-state";
import { SITE_DOMAIN } from "@/lib/site";

type Item = { id: string; username: string; is_published: boolean };

function CreateSubmit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-ink px-5 py-2.5 text-sm"
    >
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

  const [waitingForSave, setWaitingForSave] = useState(false);
  useEffect(() => {
    const onDraft = (event: Event) => {
      const state = (event as CustomEvent<EditorDraftState>).detail;
      setWaitingForSave(state.saving || state.saveError);
    };
    window.addEventListener(EDITOR_DRAFT_STATE_EVENT, onDraft);
    return () => window.removeEventListener(EDITOR_DRAFT_STATE_EVENT, onDraft);
  }, []);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <label className="studio-profile-select block">
          <span className="mb-1.5 block text-[11px] font-medium text-soft">
            Your page
          </span>
          <select
            aria-label="Select profile"
            value={currentId}
            disabled={waitingForSave}
            onChange={(event) =>
              router.push(`/dashboard?p=${event.target.value}`)
            }
            className="field py-2.5 font-medium disabled:opacity-60"
          >
            {profiles.map((profile) => (
              <option key={profile.id} value={profile.id}>
                @{profile.username}
                {profile.is_published ? " · Live" : " · Draft"}
              </option>
            ))}
          </select>
        </label>

        {canAddMore ? (
          <button
            disabled={waitingForSave}
            onClick={() => setAdding((v) => !v)}
            aria-expanded={adding}
            className="mt-5 rounded-lg border border-line px-3 py-2.5 text-xs text-soft transition hover:border-soft hover:text-ink disabled:opacity-50"
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
          <form
            action={formAction}
            className="flex flex-wrap items-center gap-3"
          >
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
                aria-label="New profile username"
                minLength={3}
                maxLength={30}
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
