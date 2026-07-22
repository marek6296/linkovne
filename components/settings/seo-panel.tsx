"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { saveSeo, type ActionState } from "@/app/dashboard/actions";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-ink px-5 py-2.5 text-sm">
      {pending ? "Saving…" : "Save"}
    </button>
  );
}

export function SeoPanel({
  profileId,
  seoTitle,
  seoDescription,
  isIndexable,
  ageGate,
}: {
  profileId: string;
  seoTitle: string;
  seoDescription: string;
  isIndexable: boolean;
  ageGate: boolean;
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    saveSeo.bind(null, profileId),
    undefined,
  );

  return (
    <form action={formAction} className="card space-y-4 p-5">
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-soft">
          Page title
        </span>
        <input
          name="seo_title"
          defaultValue={seoTitle}
          maxLength={70}
          placeholder="Mia Novak — Photographer"
          className="field py-2.5"
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-xs font-medium text-soft">
          Description
        </span>
        <textarea
          name="seo_description"
          rows={2}
          maxLength={160}
          defaultValue={seoDescription}
          placeholder="Wedding and portrait photography in Prague."
          className="field py-2.5"
        />
        <span className="mt-1 block text-xs text-faint">
          Shown under the title in Google and when the link is shared.
        </span>
      </label>

      <label className="flex items-start gap-2.5 text-sm">
        <input
          type="checkbox"
          name="is_indexable"
          defaultChecked={isIndexable}
          className="mt-1"
        />
        <span>
          Let search engines find this page
          <span className="block text-xs text-soft">
            Turn this off to stay out of Google. People with the link can still
            open it.
          </span>
        </span>
      </label>

      <label className="flex items-start gap-2.5 border-t border-line pt-4 text-sm">
        <input
          type="checkbox"
          name="age_gate"
          defaultChecked={ageGate}
          className="mt-1"
        />
        <span>
          Ask visitors to confirm they&apos;re 18+
          <span className="block text-xs text-soft">
            Shows a confirmation screen before the page. Their answer is
            remembered on their device.
          </span>
        </span>
      </label>

      {state?.error && <p className="alert-error">{state.error}</p>}

      <Submit />
    </form>
  );
}
