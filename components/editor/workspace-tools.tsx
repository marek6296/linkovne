"use client";

import type { AuditIssue } from "@/lib/editor-pro";

export function EditorToolbar({
  status,
  onReset,
  onAudit,
}: {
  status: string;
  onReset: () => void;
  onAudit: () => void;
}) {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl border border-line bg-surface p-2">
      <span aria-live="polite" className="px-2 text-xs text-faint">
        {status}
      </span>
      <button
        type="button"
        onClick={onReset}
        className="ml-auto rounded-xl px-3 py-2 text-sm text-soft transition hover:bg-paper hover:text-ink"
      >
        Reset current section
      </button>
      <button
        type="button"
        onClick={onAudit}
        className="rounded-xl bg-ink px-3.5 py-2 text-sm font-medium text-paper"
      >
        Design checker
      </button>
    </div>
  );
}

export function DesignChecker({
  issues,
  onFixAll,
  onOpen,
  onClose,
}: {
  issues: AuditIssue[];
  onFixAll: () => void;
  onOpen: (id?: string) => void;
  onClose: () => void;
}) {
  const fixable = issues.some((issue) => issue.fix);
  return (
    <div className="mt-3 rounded-2xl border border-line bg-paper p-4 shadow-lg">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-semibold">Design checker</h2>
          <p className="mt-1 text-xs text-soft">
            Contrast, motion, accessibility, links and image weight.
          </p>
        </div>
        <button type="button" onClick={onClose} className="text-soft">
          ×
        </button>
      </div>
      {issues.length === 0 ? (
        <div className="mt-4 rounded-xl bg-ok/10 p-4 text-sm text-ok">
          ✓ Everything looks healthy.
        </div>
      ) : (
        <div className="mt-4 space-y-2">
          {issues.map((issue) => (
            <button
              type="button"
              key={issue.id}
              onClick={() => onOpen(issue.blockId)}
              className="flex w-full items-start gap-3 rounded-xl border border-line p-3 text-left transition hover:border-soft"
            >
              <span
                className={
                  issue.severity === "error" ? "text-danger" : "text-amber-600"
                }
              >
                ●
              </span>
              <span>
                <span className="block text-sm font-medium">{issue.title}</span>
                <span className="mt-0.5 block text-xs text-soft">
                  {issue.detail}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
      {fixable && (
        <button
          type="button"
          onClick={onFixAll}
          className="mt-4 w-full rounded-xl bg-ink py-2.5 text-sm font-medium text-paper"
        >
          Fix automatically
        </button>
      )}
    </div>
  );
}
