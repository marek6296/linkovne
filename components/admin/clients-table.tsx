"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  lifecycleStatus,
  planMrr,
  REVENUE_SOURCE,
  revenueSource,
  TONE_BADGE,
  type Tone,
} from "@/lib/crm";

export type ClientRow = {
  account_id: string;
  email: string;
  plan: string;
  subscription_status: string | null;
  revenue_source: string | null;
  profiles_count: number;
  published_count: number;
  usernames: string;
  created_at: string;
  last_sign_in_at: string | null;
  plan_expires_at: string | null;
  first_paid_at: string | null;
  views_30d: number;
  clicks_30d: number;
};

type SortKey = "created_at" | "last_sign_in_at" | "views_30d" | "mrr";

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** „5 days ago" / „today" pre poslednú aktivitu. */
function relative(iso: string | null): string {
  if (!iso) return "never";
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

export function ClientsTable({ accounts }: { accounts: ClientRow[] }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortKey>("created_at");

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const filtered = needle
      ? accounts.filter(
          (a) =>
            a.email.toLowerCase().includes(needle) ||
            a.usernames.toLowerCase().includes(needle),
        )
      : accounts;
    const val = (a: ClientRow) => {
      switch (sort) {
        case "mrr":
          return planMrr(a.plan);
        case "views_30d":
          return Number(a.views_30d);
        case "last_sign_in_at":
          return a.last_sign_in_at ? new Date(a.last_sign_in_at).getTime() : 0;
        default:
          return new Date(a.created_at).getTime();
      }
    };
    return [...filtered].sort((a, b) => val(b) - val(a));
  }, [accounts, q, sort]);

  const SortBtn = ({ k, label }: { k: SortKey; label: string }) => (
    <button
      type="button"
      onClick={() => setSort(k)}
      className={`transition ${sort === k ? "text-ink" : "text-soft hover:text-ink"}`}
    >
      {label}
      {sort === k ? " ↓" : ""}
    </button>
  );

  return (
    <section className="card mt-8 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">
          Clients{" "}
          <span className="ml-1 font-normal text-faint">({rows.length})</span>
        </h2>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search email or page…"
          className="field max-w-xs py-2 text-sm"
        />
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-line text-xs text-faint uppercase">
            <tr>
              <th className="px-3 py-2 font-medium">Client</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">
                <SortBtn k="mrr" label="Plan" />
              </th>
              <th className="px-3 py-2 font-medium">Revenue</th>
              <th className="px-3 py-2 font-medium">
                <SortBtn k="created_at" label="Joined" />
              </th>
              <th className="px-3 py-2 font-medium">
                <SortBtn k="last_sign_in_at" label="Last active" />
              </th>
              <th className="px-3 py-2 text-right font-medium">
                <SortBtn k="views_30d" label="Views 30d" />
              </th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {rows.map((a) => {
              const s = lifecycleStatus(a);
              return (
                <tr
                  key={a.account_id}
                  className="border-b border-line/60 transition hover:bg-paper"
                >
                  <td className="px-3 py-2.5">
                    <Link
                      href={`/admin/clients/${a.account_id}`}
                      className="font-medium hover:underline"
                    >
                      {a.email}
                    </Link>
                    <p className="text-xs text-faint">{a.usernames}</p>
                  </td>
                  <td className="px-3 py-2.5">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${TONE_BADGE[s.tone as Tone]}`}
                    >
                      {s.label}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="capitalize">{a.plan}</span>
                  </td>
                  <td className="px-3 py-2.5">
                    {a.plan === "pro" || a.plan === "business" ? (
                      (() => {
                        const rs = REVENUE_SOURCE[revenueSource(a.revenue_source)];
                        return (
                          <span
                            title={rs.note}
                            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${TONE_BADGE[rs.tone]}`}
                          >
                            {rs.label}
                          </span>
                        );
                      })()
                    ) : (
                      <span className="text-faint">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-soft">{fmtDate(a.created_at)}</td>
                  <td className="px-3 py-2.5 text-soft">
                    {relative(a.last_sign_in_at)}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums">
                    {a.views_30d}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <Link
                      href={`/admin/clients/${a.account_id}`}
                      className="rounded-full border border-line px-3 py-1 text-xs text-soft transition hover:border-ink hover:text-ink"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {rows.length === 0 && (
          <p className="p-10 text-center text-sm text-soft">
            {q ? "No clients match your search." : "No accounts yet."}
          </p>
        )}
      </div>
    </section>
  );
}
