"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { publishProfile, unpublishProfile } from "@/app/dashboard/actions";
import {
  EDITOR_DRAFT_STATE_EVENT,
  EDITOR_PUBLISHED_EVENT,
  type EditorDraftState,
} from "@/lib/editor-draft-state";

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      aria-hidden
    >
      <path d="M4 10.5l4 4 8-9" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg
      viewBox="0 0 20 20"
      className="h-4 w-4 animate-spin"
      fill="none"
      aria-hidden
    >
      <circle
        cx="10"
        cy="10"
        r="7"
        stroke="currentColor"
        strokeWidth="2"
        opacity=".25"
      />
      <path
        d="M17 10a7 7 0 0 0-7-7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function PublishControls({
  profileId,
  initialPublished,
  initialHasUnpublished,
}: {
  profileId: string;
  initialPublished: boolean;
  initialHasUnpublished: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [published, setPublished] = useState(initialPublished);
  const [needsPublish, setNeedsPublish] = useState(
    !initialPublished || initialHasUnpublished,
  );
  const draftRevision = useRef(0);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [blockers, setBlockers] = useState<string[]>([]);
  const [action, setAction] = useState<"publish" | "unpublish">("publish");
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    function onDraftState(event: Event) {
      const detail = (event as CustomEvent<EditorDraftState>).detail;
      if (!detail) return;
      draftRevision.current = detail.revision;
      if (detail.hasChanges) {
        setNeedsPublish(true);
        setFeedback(null);
      }
      setSaving(detail.saving);
      setSaveError(detail.saveError);
      setBlockers(detail.blockers);
    }

    window.addEventListener(EDITOR_DRAFT_STATE_EVENT, onDraftState);
    return () =>
      window.removeEventListener(EDITOR_DRAFT_STATE_EVENT, onDraftState);
  }, []);

  const upToDate = published && !needsPublish;
  const blocked = blockers.length > 0;
  const publishDisabled =
    isPending || saving || saveError || blocked || upToDate;

  function publish() {
    if (publishDisabled) return;
    setAction("publish");
    const revision = draftRevision.current;
    setFeedback(null);
    startTransition(async () => {
      const result = await publishProfile(profileId).catch(() => ({
        error: "Connection interrupted. Your draft is safe — please try again.",
      }));
      if (result?.error) {
        setFeedback(result.error);
        return;
      }
      setPublished(true);
      const newerEdits = draftRevision.current !== revision;
      setNeedsPublish(newerEdits);
      if (!newerEdits) window.dispatchEvent(new Event(EDITOR_PUBLISHED_EVENT));
      setFeedback(
        newerEdits
          ? "Published. You have newer draft changes ready to publish next."
          : "Published successfully — your live page is up to date.",
      );
      router.refresh();
    });
  }

  function unpublish() {
    if (isPending) return;
    setAction("unpublish");
    setFeedback(null);
    startTransition(async () => {
      const result = await unpublishProfile(profileId).catch(() => ({
        error: "Connection interrupted. Your draft is safe — please try again.",
      }));
      if (result?.error) {
        setFeedback(result.error);
        return;
      }
      setPublished(false);
      setNeedsPublish(true);
      setFeedback("Page unpublished. Visitors can no longer open it.");
      router.refresh();
    });
  }

  let buttonLabel = "Publish page";
  if (isPending)
    buttonLabel = action === "unpublish" ? "Unpublishing…" : "Publishing…";
  else if (saving) buttonLabel = "Saving draft…";
  else if (saveError) buttonLabel = "Fix save error";
  else if (blocked) buttonLabel = "Upgrade to publish";
  else if (upToDate) buttonLabel = "Published · up to date";
  else if (published) buttonLabel = "Publish changes";

  return (
    <div className="w-full sm:w-auto">
      <div className="flex w-full items-center gap-2 sm:justify-end">
        {published && (
          <button
            type="button"
            onClick={unpublish}
            disabled={isPending}
            className="btn-quiet mr-auto disabled:cursor-wait disabled:opacity-50 sm:mr-0"
          >
            Unpublish
          </button>
        )}
        <button
          type="button"
          onClick={publish}
          disabled={publishDisabled}
          aria-describedby="publish-status"
          className={`ml-auto inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition sm:ml-0 ${
            upToDate
              ? "cursor-default bg-indigo-600"
              : "bg-indigo-600 hover:bg-indigo-700"
          } disabled:hover:translate-y-0 ${
            publishDisabled && !upToDate ? "cursor-not-allowed opacity-75" : ""
          }`}
        >
          {isPending || saving ? <Spinner /> : upToDate ? <CheckIcon /> : null}
          {buttonLabel}
        </button>
      </div>

      <div
        id="publish-status"
        aria-live="polite"
        className={`mt-2 sm:max-w-md sm:text-right ${upToDate && !feedback ? "hidden sm:block" : ""}`}
      >
        {blocked ? (
          <div className="rounded-xl border border-pink-500/25 bg-pink-500/[0.06] px-3 py-2.5 text-left text-xs leading-relaxed">
            <p className="font-semibold text-ink">
              This preview uses {blockers.length} feature
              {blockers.length === 1 ? "" : "s"} outside your plan:
            </p>
            <p className="mt-1 text-soft">{blockers.join(" · ")}</p>
            <Link
              href="/#pricing"
              className="mt-1.5 inline-flex font-semibold text-pink-600 underline underline-offset-2"
            >
              Unlock Pro to publish
            </Link>
          </div>
        ) : saveError ? (
          <p className="text-xs font-medium text-danger">
            Your draft could not be saved. Fix the error before publishing.
          </p>
        ) : saving ? (
          <p className="text-xs text-soft">
            Saving your draft before it can be published…
          </p>
        ) : needsPublish ? (
          <p className="inline-flex items-center gap-1.5 text-xs font-medium text-pink-600">
            <span className="h-1.5 w-1.5 rounded-full bg-pink-500" />
            {published
              ? "New changes are ready — publish them to update your live page."
              : "Your page is still private — publish it when you’re ready."}
          </p>
        ) : (
          <p className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
            {feedback ?? "Everything visitors see is fully up to date."}
          </p>
        )}
        {feedback && needsPublish && !blocked && !saving && !saveError && (
          <p className="mt-1 text-xs text-soft">{feedback}</p>
        )}
      </div>
    </div>
  );
}
