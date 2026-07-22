import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { planOf } from "@/lib/plans";
import { buildTrafficRows, trafficInsight } from "@/lib/traffic";
import { profileLabel } from "@/lib/site";
import type { BlockConfig } from "@/lib/blocks";

type OverviewRow = {
  profile_id: string;
  username: string;
  is_published: boolean;
  blocks_count: number;
  views_30d: number;
  clicks_30d: number;
};

function dayKey(iso: string) {
  return iso.slice(0, 10);
}

const REGION_NAMES = new Intl.DisplayNames(["en"], { type: "region" });

/** ISO-2 → „🇺🇸 United States". Fallback na samotny kod. */
function countryLabel(code: string): string {
  if (!/^[A-Z]{2}$/.test(code)) return "Unknown";
  const flag = code.replace(/./g, (c) =>
    String.fromCodePoint(127397 + c.charCodeAt(0)),
  );
  let name = code;
  try {
    name = REGION_NAMES.of(code) ?? code;
  } catch {
    /* ostane kod */
  }
  return `${flag} ${name}`;
}

/** Zmena oproti predoslemu obdobiu. */
function Delta({ now, prev }: { now: number; prev: number }) {
  if (prev === 0) {
    if (now === 0) return null;
    return <span className="text-xs font-medium text-ok">new</span>;
  }
  const pct = Math.round(((now - prev) / prev) * 100);
  if (pct === 0)
    return <span className="text-xs font-medium text-faint">±0%</span>;
  const up = pct > 0;
  return (
    <span
      className={`text-xs font-medium ${up ? "text-ok" : "text-danger"}`}
    >
      {up ? "▲" : "▼"} {Math.abs(pct)}%
    </span>
  );
}

/** Jednoduchy donut pre rozdelenie (napr. zariadenia). */
function Donut({ rows }: { rows: { label: string; value: number }[] }) {
  const total = rows.reduce((n, r) => n + r.value, 0);
  const colors = ["#191813", "#9a8f80", "#cdbfa9", "#e7e4dd"];
  if (total === 0)
    return <p className="py-8 text-center text-sm text-soft">No data yet.</p>;

  const R = 42;
  const C = 2 * Math.PI * R;
  let offset = 0;
  const arcs = rows.map((r, i) => {
    const frac = r.value / total;
    const seg = (
      <circle
        key={r.label}
        cx="60"
        cy="60"
        r={R}
        fill="none"
        stroke={colors[i % colors.length]}
        strokeWidth="16"
        strokeDasharray={`${frac * C} ${C}`}
        strokeDashoffset={-offset * C}
        transform="rotate(-90 60 60)"
      />
    );
    offset += frac;
    return seg;
  });

  return (
    <div className="flex flex-wrap items-center gap-6">
      <svg viewBox="0 0 120 120" className="h-32 w-32 shrink-0">
        {arcs}
      </svg>
      <ul className="space-y-2 text-sm">
        {rows.map((r, i) => (
          <li key={r.label} className="flex items-center gap-2">
            <span
              className="h-3 w-3 rounded-full"
              style={{ background: colors[i % colors.length] }}
            />
            <span className="capitalize">{r.label}</span>
            <span className="text-soft tabular-nums">
              {Math.round((r.value / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------- presentational bits ---------- */

function StatCard({
  label,
  value,
  hint,
  delta,
}: {
  label: string;
  value: string | number;
  hint?: string;
  delta?: React.ReactNode;
}) {
  return (
    <div className="card p-6">
      <p className="text-xs font-medium tracking-wide text-faint uppercase">
        {label}
      </p>
      <div className="mt-2 flex items-baseline gap-2">
        <p className="text-4xl font-semibold tracking-tight tabular-nums">
          {value}
        </p>
        {delta}
      </div>
      {hint && <p className="mt-1 text-xs text-soft">{hint}</p>}
    </div>
  );
}

/** Vertikalny stlpcovy graf s jemnymi mriezkami a hodnotou pri prejdeni. */
function TrendChart({
  rows,
  chartDays,
}: {
  rows: { day: string; count: number }[];
  chartDays: number;
}) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <section className="card p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold">Views</h2>
        <p className="text-xs text-faint">Last {chartDays} days</p>
      </div>

      <div className="relative mt-6 h-44">
        {/* mriezky */}
        <div className="absolute inset-0 flex flex-col justify-between">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className="h-px w-full bg-line/70" />
          ))}
        </div>
        {/* stlpce */}
        <div className="relative flex h-full items-end gap-1.5">
          {rows.map((r) => (
            <div
              key={r.day}
              className="group relative flex flex-1 items-end justify-center"
              style={{ height: "100%" }}
            >
              <span
                className="w-full rounded-t-md bg-ink/85 transition-all duration-500 group-hover:bg-ink"
                style={{ height: `${Math.max(2, (r.count / max) * 100)}%` }}
              />
              <span className="pointer-events-none absolute -top-6 rounded-md bg-ink px-1.5 py-0.5 text-[10px] font-medium text-paper opacity-0 transition group-hover:opacity-100">
                {r.count}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* osi dni */}
      <div className="mt-2 flex gap-1.5">
        {rows.map((r, i) => (
          <span
            key={r.day}
            className="flex-1 text-center text-[10px] text-faint tabular-nums"
          >
            {i % 2 === 0 ? r.day.slice(8, 10) : ""}
          </span>
        ))}
      </div>

      <p className="mt-4 text-xs text-faint">
        Counted on our own server. No cookies, no third-party pixels.
      </p>
    </section>
  );
}

/** Horizontalne pruhy — pouzite pre top linky, zdroje, zariadenia, modelky. */
function HBars({
  rows,
  emptyLabel,
}: {
  rows: { label: string; value: number }[];
  emptyLabel: string;
}) {
  if (rows.length === 0) {
    return <p className="py-8 text-center text-sm text-soft">{emptyLabel}</p>;
  }
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.label} className="flex items-center gap-3 text-sm">
          <span className="w-28 shrink-0 truncate text-soft">{r.label}</span>
          <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-line">
            <span
              className="block h-full rounded-full bg-ink transition-all duration-500"
              style={{ width: `${(r.value / max) * 100}%` }}
            />
          </span>
          <span className="w-10 shrink-0 text-right font-medium tabular-nums">
            {r.value}
          </span>
        </li>
      ))}
    </ul>
  );
}

function Card({
  title,
  children,
  aside,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  aside?: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`card p-6 ${className}`}>
      <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

/* ---------- page ---------- */

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ p?: string }>;
}) {
  const { p } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username")
    .eq("owner_id", user.id)
    .order("created_at");

  if (!profiles || profiles.length === 0) redirect("/onboarding");

  const [{ data: account }, { data: overview }] = await Promise.all([
    supabase.from("accounts").select("plan").eq("id", user.id).maybeSingle(),
    supabase.rpc("account_overview"),
  ]);

  const plan = planOf(account?.plan);
  const multi = profiles.length > 1;
  const overviewRows = (overview ?? []) as OverviewRow[];

  // Rozsah: "all" (agregat) alebo konkretna modelka. Pri viacero modelkach je
  // default "all"; pri jednej vzdy ta jedna.
  const wantAll = multi && (p === "all" || !p);
  const current = profiles.find((x) => x.id === p) ?? profiles[0];

  const selector = multi ? (
    <div className="flex max-w-full items-center gap-1 overflow-x-auto rounded-full border border-line bg-surface p-1">
      <Link
        href="/dashboard/analytics?p=all"
        className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
          wantAll ? "bg-ink text-paper" : "text-soft hover:text-ink"
        }`}
      >
        All profiles
      </Link>
      {profiles.map((m) => (
        <Link
          key={m.id}
          href={`/dashboard/analytics?p=${m.id}`}
          className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm transition ${
            !wantAll && m.id === current.id
              ? "bg-ink text-paper"
              : "text-soft hover:text-ink"
          }`}
        >
          {m.username}
        </Link>
      ))}
    </div>
  ) : null;

  /* ---------- AGGREGATE (all models) ---------- */
  if (wantAll) {
    const ovViews = overviewRows.reduce((n, r) => n + Number(r.views_30d), 0);
    const ovClicks = overviewRows.reduce((n, r) => n + Number(r.clicks_30d), 0);
    const ovLive = overviewRows.filter((r) => r.is_published).length;
    const ctr = ovViews > 0 ? Math.round((ovClicks / ovViews) * 100) : 0;

    const modelViews = [...overviewRows]
      .map((r) => ({ label: r.username, value: Number(r.views_30d) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 12);

    return (
      <div className="space-y-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="font-grotesk font-bold text-3xl tracking-tight">Analytics</h1>
              <p className="mt-1 text-sm text-soft">
                Last 30 days · all profiles
              </p>
            </div>
            {selector}
          </div>

          <section className="grid gap-4 sm:grid-cols-4">
            <StatCard
              label="Live"
              value={`${ovLive}/${overviewRows.length}`}
            />
            <StatCard label="Views" value={ovViews} />
            <StatCard label="Clicks" value={ovClicks} />
            <StatCard label="Click rate" value={`${ctr}%`} />
          </section>

          <Card title="Views by profile">
            <HBars rows={modelViews} emptyLabel="No views recorded yet." />
          </Card>

          <section className="card overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line text-xs tracking-wide text-faint uppercase">
                <tr>
                  <th className="px-5 py-3.5 font-medium">Profile</th>
                  <th className="px-5 py-3.5 font-medium">Status</th>
                  <th className="px-5 py-3.5 text-right font-medium">Blocks</th>
                  <th className="px-5 py-3.5 text-right font-medium">Views</th>
                  <th className="px-5 py-3.5 text-right font-medium">Clicks</th>
                  <th className="px-5 py-3.5 text-right font-medium">Rate</th>
                  <th className="px-5 py-3.5" />
                </tr>
              </thead>
              <tbody>
                {overviewRows.map((r) => (
                  <tr
                    key={r.profile_id}
                    className="border-b border-line/60 transition hover:bg-surface"
                  >
                    <td className="px-5 py-3.5">
                      <a
                        href={`/${r.username}`}
                        target="_blank"
                        className="font-medium hover:underline"
                      >
                        {r.username}
                      </a>
                      <p className="text-xs text-faint">
                        {profileLabel(r.username)}
                      </p>
                    </td>
                    <td className="px-5 py-3.5">
                      {r.is_published ? (
                        <span className="text-ok">live</span>
                      ) : (
                        <span className="text-faint">hidden</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right tabular-nums">
                      {r.blocks_count}
                    </td>
                    <td className="px-5 py-3.5 text-right tabular-nums">
                      {r.views_30d}
                    </td>
                    <td className="px-5 py-3.5 text-right tabular-nums">
                      {r.clicks_30d}
                    </td>
                    <td className="px-5 py-3.5 text-right text-soft tabular-nums">
                      {Number(r.views_30d) > 0
                        ? `${Math.round(
                            (Number(r.clicks_30d) / Number(r.views_30d)) * 100,
                          )}%`
                        : "—"}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href={`/dashboard/analytics?p=${r.profile_id}`}
                        className="rounded-full border border-line px-3 py-1.5 text-xs text-soft transition hover:border-ink hover:text-ink"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {overviewRows.length === 0 && (
              <p className="p-10 text-center text-sm text-soft">No profiles yet.</p>
            )}
          </section>
      </div>
    );
  }

  /* ---------- PER MODEL ---------- */
  const days = plan.analyticsDays;
  const chartDays = Math.min(days, 14);
  const since = new Date(Date.now() - days * 864e5).toISOString();

  // Predoslé obdobie rovnakej dlzky — na porovnanie (▲/▼ %).
  const prevSince = new Date(Date.now() - 2 * days * 864e5).toISOString();

  const [{ data: views }, { data: blocks }, { count: prevViews }] =
    await Promise.all([
      supabase
        .from("page_views")
        .select("referrer, device, source, country, created_at")
        .eq("profile_id", current.id)
        .gte("created_at", since),
      supabase
        .from("blocks")
        .select("id, type, config")
        .eq("profile_id", current.id),
      supabase
        .from("page_views")
        .select("*", { count: "exact", head: true })
        .eq("profile_id", current.id)
        .gte("created_at", prevSince)
        .lt("created_at", since),
    ]);

  const blockIds = (blocks ?? []).map((b) => b.id as string);
  const [{ data: clicks }, { count: prevClicks }] = blockIds.length
    ? await Promise.all([
        supabase
          .from("clicks")
          .select("block_id, source, referrer, created_at")
          .in("block_id", blockIds)
          .gte("created_at", since),
        supabase
          .from("clicks")
          .select("*", { count: "exact", head: true })
          .in("block_id", blockIds)
          .gte("created_at", prevSince)
          .lt("created_at", since),
      ])
    : [{ data: [] }, { count: 0 }];

  const viewList = views ?? [];
  const clickList = clicks ?? [];

  const totalViews = viewList.length;
  const totalClicks = clickList.length;
  const ctr = totalViews > 0 ? Math.round((totalClicks / totalViews) * 100) : 0;

  const byDay = new Map<string, number>();
  for (let i = chartDays - 1; i >= 0; i--) {
    byDay.set(new Date(Date.now() - i * 864e5).toISOString().slice(0, 10), 0);
  }
  for (const v of viewList) {
    const k = dayKey(v.created_at as string);
    if (byDay.has(k)) byDay.set(k, (byDay.get(k) ?? 0) + 1);
  }
  const trendRows = [...byDay.entries()].map(([day, count]) => ({ day, count }));

  const titleFor = new Map<string, string>();
  for (const b of blocks ?? []) {
    const cfg = (b.config ?? {}) as BlockConfig;
    titleFor.set(b.id as string, cfg.title || `${b.type} block`);
  }

  const perBlock = new Map<string, number>();
  for (const c of clickList) {
    const id = c.block_id as string;
    perBlock.set(id, (perBlock.get(id) ?? 0) + 1);
  }
  const linkRows = [...perBlock.entries()]
    .map(([id, value]) => ({ label: titleFor.get(id) ?? "Deleted block", value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  // Jednotny pohlad „odkial fanusikovia chodia" — klasifikovane z referrera
  // (funguje bez trackovanych linkov) + tracked source, s mierou prekliku.
  const fanRows = buildTrafficRows(
    viewList as { referrer?: string | null; source?: string | null }[],
    clickList as { referrer?: string | null; source?: string | null }[],
  );
  const fanInsight = trafficInsight(fanRows);

  const devCounts = new Map<string, number>();
  for (const v of viewList) {
    const key = (v.device as string | null) || "unknown";
    devCounts.set(key, (devCounts.get(key) ?? 0) + 1);
  }
  const devRows = [...devCounts.entries()].map(([label, value]) => ({
    label,
    value,
  }));

  const countryCounts = new Map<string, number>();
  for (const v of viewList) {
    const c = (v.country as string | null) || "??";
    countryCounts.set(c, (countryCounts.get(c) ?? 0) + 1);
  }
  const countryRows = [...countryCounts.entries()]
    .filter(([c]) => c !== "??")
    .map(([code, value]) => ({ label: countryLabel(code), value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  return (
    <div className="space-y-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-grotesk font-bold text-3xl tracking-tight">Analytics</h1>
            <p className="mt-1 text-sm text-soft">
              Last {days} days · {profileLabel(current.username)}
            </p>
          </div>
          {selector}
        </div>

        <section className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Page views"
            value={totalViews}
            delta={<Delta now={totalViews} prev={prevViews ?? 0} />}
          />
          <StatCard
            label="Link clicks"
            value={totalClicks}
            delta={<Delta now={totalClicks} prev={prevClicks ?? 0} />}
          />
          <StatCard label="Click rate" value={`${ctr}%`} />
        </section>

        {totalViews === 0 && totalClicks === 0 ? (
          <div className="card flex flex-col items-center gap-3 px-6 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-pink-500/10 text-2xl">
              📈
            </div>
            <h2 className="font-grotesk font-bold text-xl tracking-tight">No visitors yet</h2>
            <p className="max-w-sm text-sm text-soft">
              Share your link — your traffic, top platforms and click-through
              rates will show up here, updated live.
            </p>
            <code className="mt-1 rounded-lg border border-line bg-surface px-3 py-1.5 font-mono text-sm text-soft">
              {profileLabel(current.username)}
            </code>
          </div>
        ) : (
          <>
            <TrendChart rows={trendRows} chartDays={chartDays} />

            <Card
              title="Where your fans come from"
          aside={
            <p className="text-xs text-faint">Auto-detected — no setup needed</p>
          }
        >
          {fanInsight && (
            <p className="mb-5 rounded-xl border border-pink-500/20 bg-pink-500/5 px-4 py-3 text-sm text-ink">
              💡 {fanInsight}
            </p>
          )}
          {fanRows.length === 0 ? (
            <p className="py-8 text-center text-sm text-soft">
              No visits recorded yet.
            </p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="text-xs tracking-wide text-faint uppercase">
                <tr>
                  <th className="pb-3 font-medium">Platform</th>
                  <th className="pb-3 text-right font-medium">Visitors</th>
                  <th className="pb-3 text-right font-medium">Clicks</th>
                  <th className="pb-3 text-right font-medium">Rate</th>
                </tr>
              </thead>
              <tbody>
                {fanRows.map((r) => (
                  <tr key={r.label} className="border-t border-line">
                    <td className="py-2.5 font-medium">{r.label}</td>
                    <td className="py-2.5 text-right tabular-nums">{r.views}</td>
                    <td className="py-2.5 text-right tabular-nums">
                      {r.clicks}
                    </td>
                    <td className="py-2.5 text-right text-soft tabular-nums">
                      {r.views > 0 ? `${r.rate}%` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card title="Top links">
            <HBars rows={linkRows} emptyLabel="No clicks recorded yet." />
          </Card>
          <Card title="Top countries">
            <HBars
              rows={countryRows}
              emptyLabel="No location data yet."
            />
          </Card>
          <Card title="Devices">
            <Donut rows={devRows} />
          </Card>
            </div>
          </>
        )}

        {plan.analyticsDays < 30 && (
          <div className="card flex flex-wrap items-center justify-between gap-3 p-5 text-sm">
            <span className="text-soft">
              Free keeps 7 days of history. Paid plans keep 30.
            </span>
            <Link href="/#pricing" className="btn-ink px-4 py-2 text-sm">
              Upgrade
            </Link>
          </div>
        )}
    </div>
  );
}
