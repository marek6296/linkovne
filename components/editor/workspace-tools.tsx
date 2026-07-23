"use client";

export function EditorToolbar({
  status,
  onReset,
}: {
  status: string;
  onReset: () => void;
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
    </div>
  );
}
