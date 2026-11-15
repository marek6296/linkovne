"use client";

import { useEffect, useRef, useState } from "react";

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

  const [error, setError] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  async function copy() {
    setError(false);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1800);
    } catch {
      setError(true);
    }
  }

  const shareText = `Create your own link-in-bio page with Linkovne:`;

  return (
    <div className="invite-details">
      {/* Link + copy */}
      <div className="card invite-link-card">
        <label htmlFor="referral-link" className="invite-link-label">
          Your invite link
        </label>
        <div className="mt-2 flex gap-2">
          <input
            id="referral-link"
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
        <p role="status" className="invite-copy-status">
          {error
            ? "Select the link above and copy it manually."
            : copied
              ? "Link copied to your clipboard."
              : "Share this link to track your invitations."}
        </p>
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
      <div className="invite-stats">
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
      <p className="mt-1 text-sm text-soft">{label}</p>
    </div>
  );
}
