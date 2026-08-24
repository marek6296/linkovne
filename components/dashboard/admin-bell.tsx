"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { eventLabel, relativeDays, TONE_DOT, type AccountEvent } from "@/lib/crm";

type Item = AccountEvent & {
  id: number;
  account_id: string | null;
  email: string | null;
  username: string | null;
  is_unread: boolean;
};

const POLL_MS = 45_000;

/** €-suffix pre platby, ak je suma v meta (centy). */
function amountSuffix(e: Item): string {
  if (e.type !== "payment_succeeded") return "";
  const a = e.meta?.amount;
  const c = typeof e.meta?.currency === "string" ? e.meta.currency : "eur";
  return typeof a === "number" ? ` · ${(a / 100).toFixed(2)} ${c.toUpperCase()}` : "";
}

export function AdminBell() {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState<Item[]>([]);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/notifications", { cache: "no-store" });
      if (!r.ok) return;
      const json = (await r.json()) as { unread: number; items: Item[] };
      setUnread(json.unread ?? 0);
      setItems(Array.isArray(json.items) ? json.items : []);
      setLoaded(true);
    } catch {
      /* offline / transient — skús neskôr */
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, POLL_MS);
    return () => clearInterval(t);
  }, [load]);

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next && unread > 0) {
      setUnread(0); // optimisticky
      try {
        await fetch("/api/admin/notifications", { method: "POST" });
      } catch {
        /* pri chybe sa počet obnoví ďalším pollom */
      }
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-label="Notifications"
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-soft transition hover:bg-black/[0.04] hover:text-ink"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M6 9a6 6 0 0 1 12 0c0 5 1.5 6.5 2 7H4c.5-.5 2-2 2-7z" />
          <path d="M10 20a2 2 0 0 0 4 0" />
        </svg>
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-pink-500 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* click-away */}
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 cursor-default"
          />
          <div className="absolute right-0 z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-line bg-surface shadow-xl">
            <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
              <p className="text-sm font-semibold">Notifications</p>
              <Link
                href="/admin/log"
                onClick={() => setOpen(false)}
                className="text-xs text-soft transition hover:text-ink"
              >
                View all
              </Link>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {!loaded ? (
                <p className="px-4 py-8 text-center text-sm text-soft">Loading…</p>
              ) : items.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-soft">
                  Nothing yet.
                </p>
              ) : (
                <ul className="divide-y divide-line">
                  {items.map((e) => {
                    const { title, tone } = eventLabel(e);
                    const who = e.username || e.email || "unknown";
                    const inner = (
                      <div className="flex items-start gap-2.5 px-4 py-2.5">
                        <span
                          className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${TONE_DOT[tone]}`}
                          aria-hidden
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm">
                            <span className="font-medium">{title}</span>
                            <span className="text-soft">{amountSuffix(e)}</span>
                          </p>
                          <p className="truncate text-xs text-soft">{who}</p>
                        </div>
                        <span className="shrink-0 text-[11px] text-faint tabular-nums">
                          {relativeDays(e.created_at)}
                        </span>
                      </div>
                    );
                    return (
                      <li
                        key={e.id}
                        className={e.is_unread ? "bg-pink-500/[0.05]" : ""}
                      >
                        {e.account_id ? (
                          <Link
                            href={`/admin/clients/${e.account_id}`}
                            onClick={() => setOpen(false)}
                            className="block transition hover:bg-black/[0.03]"
                          >
                            {inner}
                          </Link>
                        ) : (
                          inner
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
