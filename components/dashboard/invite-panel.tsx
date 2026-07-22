"use client";

import { useState } from "react";

/**
 * Referral panel — vlastny link, kopirovanie a statistiky. Ciselka pridu zo
 * servera (my_referral RPC); tu je len interakcia (copy) a zdielanie.
 */
export function InvitePanel({
  url,
  signups,
  rewarded,
  months,
}: {
  url: string;
  signups: number;
  rewarded: number;
  months: number;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard nedostupny — user si link oznaci rucne */
    }
  }

  const shareText = `Grab your own link-in-bio that survives platform bans — try Linkovne:`;

  return (
    <div className="space-y-8">
      {/* Link + copy */}
      <div className="card max-w-xl p-5">
        <label className="font-mono text-xs tracking-wide text-faint uppercase">
          Your invite link
        </label>
        <div className="mt-2 flex gap-2">
          <input
            readOnly
            value={url}
            onFocus={(e) => e.currentTarget.select()}
            className="field flex-1 font-mono text-sm"
          />
          <button
            type="button"
            onClick={copy}
            className="btn-ink shrink-0 px-5"
          >
            {copied ? "Copied ✓" : "Copy"}
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-sm">
          <a
            href={`https://wa.me/?text=${encodeURIComponent(shareText + " " + url)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-line px-4 py-2"
          >
            Share on WhatsApp
          </a>
          <a
            href={`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(shareText)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-line px-4 py-2"
          >
            Share on Telegram
          </a>
        </div>
      </div>

      {/* Stats */}
      <div className="grid max-w-xl gap-4 sm:grid-cols-3">
        <Stat value={signups} label="Signed up" />
        <Stat value={rewarded} label="Subscribed" />
        <Stat value={months} label="Months earned" accent />
      </div>
    </div>
  );
}

function Stat({
  value,
  label,
  accent,
}: {
  value: number;
  label: string;
  accent?: boolean;
}) {
  return (
    <div className="card p-5">
      <p
        className={`font-grotesk text-3xl font-extrabold ${accent ? "text-pink-500" : "text-ink"}`}
      >
        {value}
      </p>
      <p className="mt-1 font-mono text-xs tracking-wide text-faint uppercase">
        {label}
      </p>
    </div>
  );
}
