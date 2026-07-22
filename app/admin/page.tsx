import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  eventLabel,
  fmtDateTime,
  TONE_DOT,
  type AccountEvent,
  type Tone,
} from "@/lib/crm";
import { SITE_DOMAIN } from "@/lib/site";

/**
 * Admin → Overview. Biznis metriky (MRR, konverzia, rast) + zivot platformy
 * (navstevy, kliky, top stranky, cerstve udalosti). Guard riesi layout.
 */

type AdminMetrics = {
  total_accounts: number;
  free: number;
  // Platiaci (realne peniaze)
  paid: number;
  paid_pro: number;
  paid_business: number;
  trial: number;
  past_due: number;
  real_mrr: number;
  atrisk_mrr: number;
  // Free Pro/Business (nulovy prijem)
  granted_total: number;
  granted_invite: number;
  granted_referral: number;
  granted_comp: number;
  granted_value: number;
  // Rast
  signups_30d: number;
  new_paid_30d: number;
  churn_30d: number;
  active_30d: number;
};

type OverviewExtra = {
  views_30d: number;
  clicks_30d: number;
  leads_30d: number;
  pages_total: number;
  pages_published: number;
  domains_total: number;
  ai_runs_30d: number;
  signups_by_day: { d: string; n: number }[];
  recent_events: (AccountEvent & { email: string; account_id: string })[];
  top_pages: { username: string; views: number; owner_email: string }[];
};

export default async function AdminOverviewPage() {
  const supabase = await createClient();
  const [{ data: metricsData }, { data: extraData }] = await Promise.all([
    supabase.rpc("admin_metrics"),
    supabase.rpc("admin_overview_extra"),
  ]);
  const m = (metricsData ?? {}) as Partial<AdminMetrics>;
  const x = (extraData ?? {}) as Partial<OverviewExtra>;

  const total = m.total_accounts ?? 0;
  const paid = m.paid ?? 0;
  const granted = m.granted_total ?? 0;
  const realMrr = m.real_mrr ?? 0;
  const grantedValue = m.granted_value ?? 0;
  // Konverzia = realne platiaci zo vsetkych uctov (free grantov sa netyka).
  const conversion = total > 0 ? Math.round((paid / total) * 100) : 0;
  const eur = (n: number) =>
    `€${n.toLocaleString("en-US", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;

  const days = x.signups_by_day ?? [];
  const maxDay = Math.max(1, ...days.map((d) => d.n));
  const events = x.recent_events ?? [];
  const topPages = (x.top_pages ?? []).filter((p) => Number(p.views) > 0);

  const hero = [
    { label: "Real MRR", value: eur(realMrr), sub: `${paid} paying · card only` },
    { label: "Paying clients", value: paid, sub: `${conversion}% of accounts` },
    {
      label: "Free Pro given",
      value: granted,
      sub: grantedValue > 0 ? `${eur(grantedValue)}/mo value` : "no give-aways",
    },
    { label: "Accounts", value: total, sub: `${m.free ?? 0} on free` },
  ];

  // Platiaci — rozpad podla stavu Stripe subscription.
  const paying = [
    { label: "Active paid", value: paid, tone: "text-ok" },
    { label: "Trials", value: m.trial ?? 0, tone: "text-amber-600" },
    { label: "At risk", value: m.past_due ?? 0, tone: "text-danger" },
  ];

  // Free Pro/Business — rozpad podla zdroja grantu.
  const gifted = [
    { label: "Comp (by you)", value: m.granted_comp ?? 0 },
    { label: "Promo codes", value: m.granted_invite ?? 0 },
    { label: "Referrals", value: m.granted_referral ?? 0 },
  ];

  const growth = [
    { label: "Signups 30d", value: m.signups_30d ?? 0 },
    { label: "New paid 30d", value: m.new_paid_30d ?? 0 },
    { label: "Churn 30d", value: m.churn_30d ?? 0 },
    { label: "AI builds 30d", value: x.ai_runs_30d ?? 0 },
  ];

  const engagement = [
    { label: "Page views 30d", value: x.views_30d ?? 0 },
    { label: "Link clicks 30d", value: x.clicks_30d ?? 0 },
    { label: "Leads 30d", value: x.leads_30d ?? 0 },
    {
      label: "Pages live",
      value: `${x.pages_published ?? 0} / ${x.pages_total ?? 0}`,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Biznis KPI */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {hero.map((s) => (
          <div key={s.label} className="card p-5">
            <p className="text-xs font-medium tracking-wide text-soft uppercase">
              {s.label}
            </p>
            <p className="mt-1.5 font-grotesk text-3xl font-bold tabular-nums">
              {s.value}
            </p>
            <p className="mt-1 text-xs text-faint">{s.sub}</p>
          </div>
        ))}
      </section>

      {/* Platiaci vs. free granty — jadro: odkial realne tecu peniaze */}
      <section className="grid gap-4 lg:grid-cols-2">
        {/* Realne platiaci */}
        <div className="card p-5">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-sm font-semibold">Paying customers</p>
            <p className="font-grotesk text-2xl font-bold tabular-nums text-ok">
              {eur(realMrr)}
              <span className="ml-1 text-xs font-normal text-faint">/mo</span>
            </p>
          </div>
          <p className="mt-1 text-xs text-soft">
            Real recurring revenue — only active card subscriptions.
          </p>
          <div className="mt-4 grid grid-cols-3 gap-4 border-t border-line pt-4">
            {paying.map((s) => (
              <div key={s.label}>
                <p className={`font-grotesk text-2xl font-bold tabular-nums ${s.tone}`}>
                  {s.value}
                </p>
                <p className="mt-0.5 text-xs text-soft">{s.label}</p>
              </div>
            ))}
          </div>
          {(m.paid_pro || m.paid_business) && (
            <p className="mt-3 text-xs text-faint">
              {m.paid_pro ?? 0} Pro · {m.paid_business ?? 0} Business
              {(m.past_due ?? 0) > 0 && ` · ${eur(m.atrisk_mrr ?? 0)}/mo at risk`}
            </p>
          )}
        </div>

        {/* Free Pro/Business — rozdane, nulovy prijem */}
        <div className="card p-5">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-sm font-semibold">Free Pro &amp; Business</p>
            <p className="font-grotesk text-2xl font-bold tabular-nums">
              {granted}
              <span className="ml-1 text-xs font-normal text-faint">accounts</span>
            </p>
          </div>
          <p className="mt-1 text-xs text-soft">
            On a paid plan for free — no money.{" "}
            {grantedValue > 0 && (
              <span className="text-ink">{eur(grantedValue)}/mo given away.</span>
            )}
          </p>
          <div className="mt-4 grid grid-cols-3 gap-4 border-t border-line pt-4">
            {gifted.map((s) => (
              <div key={s.label}>
                <p className="font-grotesk text-2xl font-bold tabular-nums">
                  {s.value}
                </p>
                <p className="mt-0.5 text-xs text-soft">{s.label}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-faint">
            Counts toward active Pro users, never toward MRR.
          </p>
        </div>
      </section>

      {/* Rast + engagement v jednom pruhu */}
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <p className="text-sm font-semibold">Growth · 30 days</p>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {growth.map((s) => (
              <div key={s.label}>
                <p className="font-grotesk text-2xl font-bold tabular-nums">
                  {s.value}
                </p>
                <p className="mt-0.5 text-xs text-soft">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Signups za poslednych 14 dni — jemny stlpcovy graf */}
          <div className="mt-5 border-t border-line pt-4">
            <div className="flex items-end justify-between gap-1" style={{ height: 56 }}>
              {days.map((d) => (
                <div
                  key={d.d}
                  title={`${d.d}: ${d.n} signup${d.n === 1 ? "" : "s"}`}
                  className="flex-1 rounded-t bg-indigo-500/80 transition hover:bg-indigo-500"
                  style={{
                    height: `${Math.max(4, Math.round((d.n / maxDay) * 100))}%`,
                    opacity: d.n === 0 ? 0.18 : 1,
                  }}
                />
              ))}
            </div>
            <div className="mt-1.5 flex justify-between text-[11px] text-faint">
              <span>14 days ago</span>
              <span>signups per day</span>
              <span>today</span>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <p className="text-sm font-semibold">Engagement · 30 days</p>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {engagement.map((s) => (
              <div key={s.label}>
                <p className="font-grotesk text-2xl font-bold tabular-nums">
                  {s.value}
                </p>
                <p className="mt-0.5 text-xs text-soft">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Top stranky podla navstev */}
          <div className="mt-5 border-t border-line pt-4">
            <p className="text-xs font-medium tracking-wide text-soft uppercase">
              Top pages · views 30d
            </p>
            <div className="mt-2.5 space-y-1.5">
              {topPages.length === 0 && (
                <p className="text-sm text-faint">No traffic yet.</p>
              )}
              {topPages.map((p, i) => (
                <div key={p.username} className="flex items-center gap-3 text-sm">
                  <span className="w-4 text-right text-xs text-faint tabular-nums">
                    {i + 1}
                  </span>
                  <a
                    href={`https://${SITE_DOMAIN}/${p.username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-w-0 flex-1 truncate font-medium hover:underline"
                  >
                    /{p.username}
                  </a>
                  <span className="text-soft tabular-nums">{p.views}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Cerstva aktivita naprie uctami */}
      <section className="card p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold">Recent activity</p>
          <Link
            href="/admin/clients"
            className="text-xs text-soft underline underline-offset-4 transition hover:text-ink"
          >
            All clients →
          </Link>
        </div>
        <div className="mt-4 divide-y divide-line/70">
          {events.length === 0 && (
            <p className="py-3 text-sm text-faint">Nothing yet.</p>
          )}
          {events.map((e, i) => {
            const label = eventLabel(e);
            return (
              <div key={i} className="flex items-center gap-3 py-2.5">
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${TONE_DOT[label.tone as Tone]}`}
                />
                <Link
                  href={`/admin/clients/${e.account_id}`}
                  className="min-w-0 max-w-[16rem] truncate text-sm font-medium hover:underline"
                >
                  {e.email}
                </Link>
                <span className="min-w-0 flex-1 truncate text-sm text-soft">
                  {label.title}
                </span>
                <span className="shrink-0 text-xs text-faint">
                  {fmtDateTime(e.created_at)}
                </span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
