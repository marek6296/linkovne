"use client";

import { useState } from "react";
import Link from "next/link";
import { defaultConfig, type Block, type SocialPlatform } from "@/lib/blocks";
import type { Design, FontKey } from "@/lib/design";

export type DraftResult = {
  display_name: string;
  bio: string;
  theme: string;
  design: Design;
  blocks: Block[];
};

type ApiBlock = {
  type: "link" | "headline" | "text" | "socials";
  title: string;
  url: string;
  icon: string;
  featured: boolean;
  text: string;
  socials: { platform: SocialPlatform; url: string }[];
};

/** Prevod odpovede modelu na bloky editora. */
function toBlocks(items: ApiBlock[]): Block[] {
  return items.slice(0, 20).map((item, i) => {
    const base = {
      id: crypto.randomUUID(),
      position: i,
      is_active: true,
    };

    switch (item.type) {
      case "link":
        return {
          ...base,
          type: "link" as const,
          config: {
            ...defaultConfig("link"),
            title: item.title || "Link",
            url: item.url || "",
            featured: item.featured === true,
            ...(item.icon ? { icon: item.icon } : {}),
          },
        };
      case "headline":
        return {
          ...base,
          type: "headline" as const,
          config: { text: item.title || item.text || "Section" },
        };
      case "text":
        return {
          ...base,
          type: "text" as const,
          config: { text: item.text || "" },
        };
      case "socials":
        return {
          ...base,
          type: "socials" as const,
          config: { items: item.socials ?? [] },
        };
    }
  });
}

export function AiDraft({
  enabled,
  onApply,
  bare = false,
}: {
  enabled: boolean;
  onApply: (draft: DraftResult) => void;
  /** Ked je zabaleny v Section — bez vlastnej karty (nezdvojovat obal). */
  bare?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [links, setLinks] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description, links }),
      });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? "Couldn't generate a draft.");
        return;
      }

      const d = json.draft;
      onApply({
        display_name: d.display_name ?? "",
        bio: d.bio ?? "",
        theme: d.theme ?? "classic",
        design: {
          font: d.font as FontKey,
          fontHeading: d.font_heading as FontKey,
        },
        blocks: toBlocks(d.blocks ?? []),
      });
      setOpen(false);
    } catch {
      setError("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  }

  if (!enabled) {
    return (
      <div
        className={`flex flex-wrap items-center justify-between gap-3 text-sm ${
          bare ? "" : "card mt-4 p-4"
        }`}
      >
        <span className="text-soft">
          <span className="font-medium text-ink">Build it with AI</span> —
          describe yourself and get a finished page in seconds
        </span>
        <Link href="/#pricing" className="btn-ink px-4 py-2 text-sm">
          Upgrade
        </Link>
      </div>
    );
  }

  return (
    <div className={bare ? "" : "mt-4"}>
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`flex w-full items-center justify-between p-4 text-left text-sm transition hover:border-soft ${
            bare ? "rounded-xl border border-line" : "card"
          }`}
        >
          <span>
            <span className="font-medium">Build it with AI</span>
            <span className="ml-2 text-soft">
              describe yourself, get a finished page
            </span>
          </span>
          <span className="text-faint">→</span>
        </button>
      ) : (
        <div className={`space-y-3 ${bare ? "" : "card p-5"}`}>
          <div>
            <p className="text-sm font-semibold">Build it with AI</p>
            <p className="mt-1 text-sm text-soft">
              This replaces everything on the page. You can edit it all
              afterwards.
            </p>
          </div>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-soft">
              Who are you and what do you do?
            </span>
            <textarea
              rows={3}
              maxLength={2000}
              autoFocus
              value={description}
              placeholder="Photographer in Prague. I shoot weddings and portraits, sell presets, and post behind-the-scenes on Instagram."
              onChange={(e) => setDescription(e.target.value)}
              className="field py-2.5"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-soft">
              Your links (paste them, one per line)
            </span>
            <textarea
              rows={3}
              maxLength={2000}
              value={links}
              placeholder={"https://instagram.com/…\nhttps://…/presets\nbookings@…"}
              onChange={(e) => setLinks(e.target.value)}
              className="field py-2.5"
            />
            <span className="mt-1 block text-xs text-faint">
              Only links you paste here get used — nothing is invented.
            </span>
          </label>

          {error && <p className="alert-error">{error}</p>}

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={generate}
              disabled={busy || description.trim().length < 10}
              className="btn-ink px-5 py-2.5 text-sm disabled:opacity-50"
            >
              {busy ? "Building…" : "Build my page"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="btn-quiet"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
