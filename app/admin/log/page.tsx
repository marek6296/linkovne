import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  eventLabel,
  fmtDateTime,
  relativeDays,
  TONE_DOT,
  type AccountEvent,
} from "@/lib/crm";

export const dynamic = "force-dynamic";

type Row = AccountEvent & {
  id: number;
  account_id: string | null;
  email: string | null;
  username: string | null;
};

/** Rychle filtre — kazdy vedie na jeden typ udalosti (prazdny = vsetko). */
const FILTERS: { type: string; label: string }[] = [
  { type: "", label: "All" },
  { type: "signup", label: "Signups" },
  { type: "plan_upgrade", label: "Upgrades" },
  { type: "plan_downgrade", label: "Downgrades" },
  { type: "payment_succeeded", label: "Payments" },
  { type: "payment_failed", label: "Failed" },
  { type: "subscription_canceled", label: "Cancellations" },
  { type: "discount_applied", label: "Discounts" },
  { type: "admin_change", label: "Plan by admin" },
  { type: "admin_added", label: "Admins +" },
  { type: "admin_removed", label: "Admins −" },
];

const LIMIT = 100;

export default async function ActivityLogPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; before?: string }>;
}) {
  const { type, before } = await searchParams;
  const supabase = await createClient();

  const { data } = await supabase.rpc("admin_activity_log", {
    p_limit: LIMIT,
    p_type: type && type.length > 0 ? type : null,
    p_before: before && before.length > 0 ? before : null,
  });
  const rows = (data ?? []) as Row[];

  const qs = (t: string, b?: string) => {
    const p = new URLSearchParams();
    if (t) p.set("type", t);
    if (b) p.set("before", b);
    const s = p.toString();
    return `/admin/log${s ? `?${s}` : ""}`;
  };

  const last = rows.length === LIMIT ? rows[rows.length - 1] : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-grotesk text-2xl font-bold tracking-tight">
          Activity log
        </h1>
        <p className="mt-1 text-sm text-soft">
          Everything happening across the platform — signups, plan changes,
          payments, cancellations and admin actions. Newest first.
        </p>
      </div>

      {/* Filtre */}
      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((f) => {
          const active = (type ?? "") === f.type;
          return (
            <Link
              key={f.type || "all"}
              href={qs(f.type)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                active
                  ? "bg-ink text-white"
                  : "text-soft hover:bg-black/[0.04] hover:text-ink"
              }`}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-surface">
        {rows.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-soft">
            Nothing here yet.
          </p>
        ) : (
          <div className="divide-y divide-line">
            {rows.map((e) => {
              const { title, tone } = eventLabel(e);
              const who = e.username || e.email || "unknown";
              const by =
                typeof e.meta?.by === "string" ? (e.meta.by as string) : null;
              return (
                <div
                  key={e.id}
                  className="flex items-start gap-3 px-5 py-3"
                >
                  <span
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${TONE_DOT[tone]}`}
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">
                      <span className="font-medium">{title}</span>
                      {by && (
                        <span className="text-soft"> · by {by}</span>
                      )}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-soft">
                      {e.account_id ? (
                        <Link
                          href={`/admin/clients/${e.account_id}`}
                          className="hover:text-ink hover:underline"
                        >
                          {who}
                        </Link>
                      ) : (
                        who
                      )}
                      {e.email && e.username && (
                        <span className="text-faint"> · {e.email}</span>
                      )}
                    </p>
                  </div>
                  <time
                    dateTime={e.created_at}
                    title={fmtDateTime(e.created_at)}
                    className="shrink-0 text-xs text-faint tabular-nums"
                  >
                    {relativeDays(e.created_at)}
                  </time>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {last && (
        <div className="text-center">
          <Link
            href={qs(type ?? "", last.created_at)}
            className="inline-block rounded-full border border-line px-5 py-2 text-sm text-soft transition hover:border-ink hover:text-ink"
          >
            Load older
          </Link>
        </div>
      )}
    </div>
  );
}
