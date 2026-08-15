"use client";

import { useState } from "react";
import { defaultConfig, type Block } from "@/lib/blocks";
import type { Design } from "@/lib/design";

export type ImportResult = {
  display_name: string;
  bio: string;
  avatar_url: string;
  blocks: Block[];
  /** Len pri klonovani z inej linkovne stranky — prenesie sa aj vzhlad. */
  theme?: string | null;
  design?: Partial<Design> | null;
};

export function ImportPanel({
  onApply,
  bare = false,
}: {
  onApply: (result: ImportResult) => void;
  /** Ked je zabaleny v Section — bez vlastnej karty (nezdvojovat obal). */
  bare?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Import failed.");
        return;
      }

      let blocks: Block[];
      if (Array.isArray(json.blocks)) {
        // Interny klon inej linkovne stranky — plne bloky (vsetky typy aj
        // konfiguracie) 1:1. Len nove id a cerstve poradie, nech nekoliduju.
        blocks = (json.blocks as Block[]).map((b, i) => ({
          ...b,
          id: crypto.randomUUID(),
          position: i,
          is_active: b.is_active !== false,
          starts_at: b.starts_at ?? null,
          ends_at: b.ends_at ?? null,
        }));
      } else {
        // Externy zdroj (Linktree / Link.me …) — mame len title+url+thumb.
        blocks = (json.links ?? []).map(
          (l: { title: string; url: string; thumb?: string }, i: number) => ({
            id: crypto.randomUUID(),
            type: "link" as const,
            position: i,
            is_active: true,
            config: {
              ...defaultConfig("link"),
              title: l.title,
              url: l.url,
              // Fotka na buttone, ak ju importujeme — rovno aj layout "thumb".
              ...(l.thumb ? { thumb: l.thumb, layout: "thumb" as const } : {}),
            },
          }),
        );
      }

      onApply({
        display_name: json.profile?.display_name ?? "",
        bio: json.profile?.bio ?? "",
        avatar_url: json.profile?.avatar_url ?? "",
        blocks,
        theme: json.theme ?? undefined,
        design: json.design ?? undefined,
      });
      setOpen(false);
    } catch {
      setError("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`flex w-full items-center justify-between p-4 text-left text-sm transition hover:border-soft ${
          bare ? "rounded-xl border border-line" : "card mt-3"
        }`}
      >
        <span>
          <span className="font-medium">Import an existing page</span>
          <span className="ml-2 text-soft">
            another linkovne page, Linktree or Link.me
          </span>
        </span>
        <span className="text-faint">→</span>
      </button>
    );
  }

  return (
    <div className={`space-y-3 ${bare ? "" : "card mt-3 p-5"}`}>
      <div>
        <p className="text-sm font-semibold">Import an existing page</p>
        <p className="mt-1 text-sm text-soft">
          Paste another <strong>linkovne.com</strong> page to clone everything —
          links, layout and design — or a Linktree, Link.me, Beacons or bio.link
          page to bring the links across. This replaces the blocks below.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          value={url}
          autoFocus
          spellCheck={false}
          placeholder="linkovne.com/name or linktr.ee/name"
          onChange={(e) => setUrl(e.target.value)}
          className="field"
        />
        <button
          type="button"
          onClick={run}
          disabled={busy || url.trim().length < 5}
          className="btn-ink shrink-0 disabled:opacity-50"
        >
          {busy ? "Importing…" : "Import"}
        </button>
      </div>

      {error && <p className="alert-error">{error}</p>}

      <button type="button" onClick={() => setOpen(false)} className="btn-quiet">
        Cancel
      </button>
    </div>
  );
}
