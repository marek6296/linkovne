"use client";

import { useState } from "react";
import { CHANNELS } from "@/lib/channels";
import { profileLabel, ALT_PREFIXES } from "@/lib/site";
import { Collapse } from "@/components/editor/collapse";

export function ShareCard({
  username,
  isPublished,
}: {
  username: string;
  isPublished: boolean;
}) {
  const [copied, setCopied] = useState<string | null>(null);
  const [panel, setPanel] = useState<"none" | "qr" | "channels" | "alt">(
    "none",
  );

  const path = `/${username}`;

  // Ten isty profil, rozne „tvary" adresy — na striedanie v bio.
  const altVariants = ["", ...ALT_PREFIXES].map((pfx) => ({
    key: pfx || "plain",
    prefix: pfx,
    label: profileLabel(`${pfx}${username}`),
  }));

  async function copy(url: string, key: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(key);
      setTimeout(() => setCopied(null), 1800);
    } catch {
      setCopied(null);
    }
  }

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <div className="card p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm text-soft">
            {isPublished
              ? "Your page is live at"
              : "Your page (not published yet)"}
          </p>
          <a
            href={path}
            target="_blank"
            className="mt-0.5 block truncate text-lg font-medium hover:underline"
          >
            {profileLabel("")}
            <span className="text-accent">{username}</span>
          </a>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => copy(`${origin}${path}`, "main")}
            className="btn-line px-4 py-2 text-sm"
          >
            {copied === "main" ? "Copied" : "Copy link"}
          </button>
          <button
            onClick={() => setPanel((v) => (v === "alt" ? "none" : "alt"))}
            className={`btn-line px-4 py-2 text-sm ${
              panel === "alt" ? "border-ink" : ""
            }`}
          >
            Alternative links
          </button>
          <button
            onClick={() =>
              setPanel((v) => (v === "channels" ? "none" : "channels"))
            }
            className={`btn-line px-4 py-2 text-sm ${
              panel === "channels" ? "border-ink" : ""
            }`}
          >
            Tracked links
          </button>
          <button
            onClick={() => setPanel((v) => (v === "qr" ? "none" : "qr"))}
            className={`btn-line px-4 py-2 text-sm ${
              panel === "qr" ? "border-ink" : ""
            }`}
          >
            QR code
          </button>
          <a href={path} target="_blank" className="btn-ink px-4 py-2 text-sm">
            View page
          </a>
        </div>
      </div>

      {!isPublished && (
        <p className="mt-3 text-sm text-soft">
          Visitors can&apos;t see it yet — hit Publish when you&apos;re ready.
        </p>
      )}

      <Collapse open={panel === "alt"}>
        <div className="mt-5 border-t border-line pt-5">
          <p className="text-sm font-medium">Alternative links</p>
          <p className="mt-1 max-w-lg text-sm text-soft">
            Same page, a different-looking address. Rotate them across your bios
            — if one gets blocked, the others keep working and your page never
            goes down.
          </p>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {altVariants.map((v) => {
              const url = `${origin}/${v.prefix}${username}`;
              return (
                <div
                  key={v.key}
                  className="flex items-center gap-3 rounded-xl border border-line px-3 py-2"
                >
                  <code className="min-w-0 flex-1 truncate text-xs text-soft">
                    {v.label}
                  </code>
                  <button
                    onClick={() => copy(url, `alt-${v.key}`)}
                    className="shrink-0 rounded-full border border-line px-3 py-1 text-xs text-soft transition hover:border-ink hover:text-ink"
                  >
                    {copied === `alt-${v.key}` ? "Copied" : "Copy"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </Collapse>

      <Collapse open={panel === "channels"}>
        <div className="mt-5 border-t border-line pt-5">
          <p className="text-sm font-medium">One link per platform</p>
          <p className="mt-1 max-w-lg text-sm text-soft">
            Put a different link in each bio. Your page looks identical, but
            analytics will tell you exactly which platform sends real clicks.
          </p>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {CHANNELS.map((c) => {
              const url = `${origin}${path}?s=${c.key}`;
              return (
                <div
                  key={c.key}
                  className="flex items-center gap-3 rounded-xl border border-line px-3 py-2"
                >
                  <span className="w-20 shrink-0 text-sm font-medium">
                    {c.label}
                  </span>
                  <code className="min-w-0 flex-1 truncate text-xs text-soft">
                    {profileLabel(username)}?s={c.key}
                  </code>
                  <button
                    onClick={() => copy(url, c.key)}
                    className="shrink-0 rounded-full border border-line px-3 py-1 text-xs text-soft transition hover:border-ink hover:text-ink"
                  >
                    {copied === c.key ? "Copied" : "Copy"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </Collapse>

      <Collapse open={panel === "qr"}>
        <div className="mt-5 flex flex-wrap items-center gap-5 border-t border-line pt-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/qr?u=${encodeURIComponent(username)}`}
            alt={`QR code for ${profileLabel(username)}`}
            className="h-40 w-40 rounded-xl border border-line bg-white p-2"
          />
          <div className="text-sm">
            <p className="font-medium">Put it on anything</p>
            <p className="mt-1 max-w-xs text-soft">
              Business cards, packaging, a poster in your shop. It always
              points at your page — even if you change your links later.
            </p>
            <a
              href={`/api/qr?u=${encodeURIComponent(username)}&download=1`}
              download={`linkovne-${username}.svg`}
              className="mt-3 inline-flex text-ink underline underline-offset-4"
            >
              Download SVG
            </a>
          </div>
        </div>
      </Collapse>
    </div>
  );
}
