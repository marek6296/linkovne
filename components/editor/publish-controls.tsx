"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { SITE_DOMAIN, profileLabel } from "@/lib/site";
import { publishProfile, unpublishProfile } from "@/app/dashboard/actions";
import {
  EDITOR_DRAFT_STATE_EVENT,
  EDITOR_PUBLISHED_EVENT,
  EDITOR_PUBLISHING_EVENT,
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
  username,
  initialPublished,
  initialHasUnpublished,
}: {
  profileId: string;
  username: string;
  initialPublished: boolean;
  initialHasUnpublished: boolean;
}) {
  const router = useRouter();
  const menu = useRef<HTMLDetailsElement>(null);
  const [feedbackError, setFeedbackError] = useState(false);
  useEffect(() => {
    const outside = (event: MouseEvent) => {
      if (menu.current && !menu.current.contains(event.target as Node))
        menu.current.open = false;
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && menu.current?.open) {
        menu.current.open = false;
        menu.current.querySelector("summary")?.focus();
      }
    };
    document.addEventListener("click", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("click", outside);
      document.removeEventListener("keydown", escape);
    };
  }, []);
  const [isPending, startTransition] = useTransition();
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent(EDITOR_PUBLISHING_EVENT, { detail: isPending }),
    );
    return () => {
      window.dispatchEvent(
        new CustomEvent(EDITOR_PUBLISHING_EVENT, { detail: false }),
      );
    };
  }, [isPending]);
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
    setFeedbackError(false);
    startTransition(async () => {
      const result = await publishProfile(profileId).catch(() => ({
        error: "Connection interrupted. Your draft is safe — please try again.",
      }));
      if (result?.error) {
        setFeedback(result.error);
        setFeedbackError(true);
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
    if (menu.current) menu.current.open = false;
    setAction("unpublish");
    setFeedback(null);
    setFeedbackError(false);
    startTransition(async () => {
      const result = await unpublishProfile(profileId).catch(() => ({
        error: "Connection interrupted. Your draft is safe — please try again.",
      }));
      if (result?.error) {
        setFeedback(result.error);
        setFeedbackError(true);
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
    <div className="profile-publish">
      <div className="profile-publish-row">
        <div className="profile-page-address">
          <span className={`profile-live-label ${published ? "is-live" : ""}`}>
            <i aria-hidden />
            {published ? "Live" : "Draft"}
          </span>
          {published ? (
            <a
              href={`https://${SITE_DOMAIN}/${username}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {profileLabel(username)}
              <svg
                viewBox="0 0 16 16"
                width="13"
                height="13"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden
              >
                <path d="M4 12 12 4M4 4h8v8" />
              </svg>
            </a>
          ) : (
            <span className="profile-draft-address">
              {profileLabel(username)}
            </span>
          )}
        </div>
        <div className="profile-publish-actions">
          <span
            className={`profile-save-label ${saveError ? "is-error" : ""}`}
            role="status"
          >
            {saving ? (
              "Saving draft…"
            ) : saveError ? (
              "Not saved"
            ) : blocked ? (
              "Pro features in preview"
            ) : needsPublish ? (
              published ? (
                "Unpublished changes"
              ) : (
                "Only you can see this"
              )
            ) : (
              <>
                <CheckIcon />
                All changes published
              </>
            )}
          </span>
          {(!upToDate || isPending || saving || saveError || blocked) && (
            <button
              type="button"
              onClick={publish}
              disabled={publishDisabled}
              aria-describedby="publish-status"
              className="profile-primary-action"
            >
              {isPending || saving ? <Spinner /> : null}
              {buttonLabel}
            </button>
          )}
          {published && (
            <details ref={menu} className="profile-actions-menu">
              <summary aria-label="Page actions" title="Page actions">
                <svg
                  viewBox="0 0 20 20"
                  width="20"
                  height="20"
                  fill="currentColor"
                  aria-hidden
                >
                  <circle cx="4" cy="10" r="1.5" />
                  <circle cx="10" cy="10" r="1.5" />
                  <circle cx="16" cy="10" r="1.5" />
                </svg>
              </summary>
              <div className="profile-actions-popover">
                <button type="button" onClick={unpublish} disabled={isPending}>
                  <span>Unpublish page</span>
                  <small>Hide this page from visitors</small>
                </button>
              </div>
            </details>
          )}
        </div>
      </div>
      <div id="publish-status" aria-live="polite">
        {blocked ? (
          <div className="profile-publish-message">
            <span>This preview needs Pro: {blockers.join(" · ")}</span>
            <Link href="/#pricing">View plans →</Link>
          </div>
        ) : saveError ? (
          <p className="profile-publish-message is-error">
            Your draft could not be saved. Use Retry saving in the editor before
            publishing.
          </p>
        ) : null}
        {feedback && !saving && (
          <p
            className={`profile-publish-message ${feedbackError ? "is-error" : ""}`}
            role={feedbackError ? "alert" : "status"}
          >
            {feedback}
          </p>
        )}
      </div>
    </div>
  );
}
