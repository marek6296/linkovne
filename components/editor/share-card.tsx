"use client";

import { useState } from "react";
import {
  CHANNELS,
  normaliseSource,
  trackingSlug,
  type TrackedLink,
} from "@/lib/channels";
import { profileLabel, ALT_PREFIXES, SITE_DOMAIN } from "@/lib/site";
import { Collapse } from "@/components/editor/collapse";

export function ShareCard({
  username,
  isPublished,
  trackedLinks,
  onTrackedLinksChange,
  premium,
}: {
  premium: boolean;
  trackedLinks: TrackedLink[];
  onTrackedLinksChange: (links: TrackedLink[]) => void;
  username: string;
  isPublished: boolean;
}) {
  const [label, setLabel] = useState("");
  const [source, setSource] = useState("");
  const [trackingError, setTrackingError] = useState("");
  const [copyError, setCopyError] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [panel, setPanel] = useState<"none" | "qr" | "channels" | "alt">(
    "channels",
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
      setCopyError("");
      await navigator.clipboard.writeText(url);
      setCopied(key);
      setTimeout(() => setCopied(null), 1800);
    } catch {
      setCopied(null);
      setCopyError("Could not copy. Select and copy the URL manually.");
    }
  }

  const origin = `https://${SITE_DOMAIN}`;

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
            href={`${origin}${path}`}
            target="_blank"
            rel="noopener noreferrer"
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
          {isPublished && (
            <a
              href={`${origin}${path}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ink px-4 py-2 text-sm"
            >
              View page
            </a>
          )}
        </div>
      </div>

      {copyError && (
        <p role="alert" className="mt-3 text-sm text-danger">
          {copyError}
        </p>
      )}
      {!isPublished && (
        <p className="mt-3 text-sm text-soft">
          Visitors can&apos;t see it yet — hit Publish when you&apos;re ready.
        </p>
      )}

      <Collapse open={panel === "alt"}>
        <div className="mt-5 border-t border-line pt-5">
          <p className="text-sm font-medium">Alternative links</p>
          <p className="mt-1 max-w-lg text-sm text-soft">
            These addresses open the same page. Use the format you prefer for
            each of your bios.
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
          <h2 className="flex items-center gap-2 text-base font-semibold">Accounts & campaigns <span className="rounded-full bg-ink px-2 py-0.5 text-[10px] text-white">PRO</span></h2>
          <p className="mt-1 text-sm text-soft">
            Create a separate link for each Instagram account, campaign or
            channel. Visits and clicks appear under its source in Analytics.
          </p>
          {!premium && <p className="mt-4 rounded-xl border border-line p-4 text-sm">Custom tracking links are available on Pro and Business. Your saved links stay available. <a href="/dashboard/settings" className="font-semibold underline">Explore plans</a></p>}
          {premium && <form
            className="studio-tracking-form"
            onSubmit={(event) => {
              event.preventDefault();
              const key = normaliseSource(source);
              if (!label.trim() || !key || key !== source) {
                setTrackingError(
                  "Use a label and a source of 2–24 letters, numbers, hyphens or underscores.",
                );
                return;
              }
              if (
                trackedLinks.some((item) => item.source === key) ||
                CHANNELS.some((item) => item.key === key)
              ) {
                setTrackingError(
                  "That source already exists. Add a different account name or campaign suffix.",
                );
                return;
              }
              if (trackedLinks.length >= 50) {
                setTrackingError(
                  "You can save up to 50 tracking links per page.",
                );
                return;
              }
              onTrackedLinksChange([
                ...trackedLinks,
                { label: label.trim(), source: key },
              ]);
              setLabel("");
              setSource("");
              setTrackingError("");
            }}
          >
            <label>
              <span>Account or campaign name</span>
              <input
                className="field"
                maxLength={60}
                placeholder="Instagram · personal"
                value={label}
                onChange={(e) => {
                  setLabel(e.target.value);
                  setSource(trackingSlug(e.target.value));
                }}
                required
              />
            </label>
            <label>
              <span>Tracking source</span>
              <input
                className="field"
                maxLength={24}
                placeholder="instagram-personal"
                value={source}
                onChange={(e) => setSource(e.target.value.toLowerCase())}
                required
                aria-describedby="source-help"
              />
            </label>
            <p id="source-help" className="text-xs text-soft">
              {profileLabel(username)}?s={source || "your-source"}
            </p>
            <button className="btn-ink px-4 py-2.5 text-sm" type="submit">
              Add tracking link
            </button>
          </form>}
          {trackingError && (
            <p role="alert" className="mt-2 text-sm text-danger">
              {trackingError}
            </p>
          )}
          <div className="mt-4 space-y-2">
            {trackedLinks.map((item) => (
              <div key={item.source} className="studio-tracking-row">
                <div>
                  <strong>{item.label}</strong>
                  <code>
                    {origin}
                    {path}?s={item.source}
                  </code>
                </div>
                <button
                  type="button"
                  className="btn-line px-3 py-2 text-xs"
                  onClick={() =>
                    copy(`${origin}${path}?s=${item.source}`, item.source)
                  }
                >
                  {copied === item.source ? "Copied" : "Copy"}
                </button>
                <button
                  type="button"
                  aria-label={`Remove ${item.label} from saved links`}
                  onClick={() =>
                    onTrackedLinksChange(
                      trackedLinks.filter(
                        (link) => link.source !== item.source,
                      ),
                    )
                  }
                  className="studio-icon-button"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <p className="mt-6 text-xs font-semibold uppercase tracking-wide text-soft">
            Standard platform links
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
              Business cards, packaging, a poster in your shop. It always points
              at your page — even if you change your links later.
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
