import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { siteChannel } from "@/lib/site-analytics";
import { SITE_DOMAIN } from "@/lib/site";

/**
 * Admin → Website. Navstevnost NASHO marketingoveho webu linkovne.com —
 * potencialni zakaznici. Zamerne oddelene od analytiky profilov tvorcov
 * (Overview → Creator pages), ktora meria fanusikov nasich klientov.
 *
 * Data: linkove.site_visits cez admin_site_traffic() (guard is_admin()).
 * Bez cookies — navstevnik = jedno zariadenie za jeden den.
 */

type Row = { key: string; visitors: number };
type Day = { d: string; visitors: number; pageviews: number; signups: number };

type SiteTraffic = {
  days: number;
  from: string;
  to: string;
  since: string | null;
  visitors: number;
  pageviews: number;
  signups: number;
  prev: { visitors: number; pageviews: number; signups: number };
  today: number;
  week: number;
  month: number;
  funnel: { landing: number; pricing: number; register: number; login: number };
  by_day: Day[];
  pages: { path: string; visitors: number; views: number }[];
  sources: { referrer: string | null; utm_source: string | null; visitors: number }[];
  campaigns: {
    source: string | null;
    medium: string | null;
    campaign: string | null;
    visitors: number;
  }[];
  countries: Row[];
  devices: Row[];
  browsers: Row[];
};

const RANGES = [7, 30, 90] as const;

const nf = (n: number) => n.toLocaleString("en-US");
const pct = (part: number, whole: number) =>
  whole > 0 ? `${Math.round((part / whole) * 1000) / 10}%` : "—";

function delta(cur: number, prev: number): { text: string; cls: string } {
  if (prev === 0) return { text: cur > 0 ? "new" : "—", cls: "text-faint" };
  const d = Math.round(((cur - prev) / prev) * 100);
  if (d === 0) return { text: "±0%", cls: "text-faint" };
  return d > 0
    ? { text: `+${d}%`, cls: "text-ok" }
    : { text: `${d}%`, cls: "text-danger" };
}

function fmtDay(iso: string, withWeekday = false) {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-GB", {
    ...(withWeekday ? { weekday: "short" as const } : {}),
    day: "numeric",
    month: "short",
  });
}

let regionNames: Intl.DisplayNames | null = null;
function countryName(code: string) {
  if (code === "??") return "Unknown";
  try {
    regionNames ??= new Intl.DisplayNames(["en"], { type: "region" });
    return regionNames.of(code) ?? code;
  } catch {
    return code;
  }
}

const PAGE_LABELS: Record<string, string> = {
  "/": "Landing page",
  "/register": "Sign up",
  "/login": "Log in",
  "/forgot": "Forgot password",
  "/about": "About",
  "/guides": "Guides",
  "/vs": "Comparisons hub",
  "/safe": "Share safely",
  "/privacy": "Privacy",
  "/terms": "Terms",
};

/** Zlucenie riadkov podla kluca (napr. vela referrerov → jeden kanal). */
function groupSum<T>(items: T[], key: (t: T) => string, val: (t: T) => number) {
  const m = new Map<string, number>();
  for (const it of items) m.set(key(it), (m.get(key(it)) ?? 0) + val(it));
  return [...m.entries()]
    .map(([k, visitors]) => ({ key: k, visitors }))
    .sort((a, b) => b.visitors - a.visitors);
}

// --- male stavebne bloky -------------------------------------------------------

function Stat({
  label,
  value,
  sub,
  trend,
}: {
  label: string;
  value: string | number;
  sub?: string;
  trend?: { text: string; cls: string };
}) {
  return (
    <div className="card p-5">
      <p className="text-xs font-medium tracking-wide text-soft uppercase">
        {label}
      </p>
      <p className="mt-1.5 font-grotesk text-3xl font-bold tabular-nums">
        {value}
      </p>
      <p className="mt-1 text-xs text-faint">
        {trend && <span className={`font-medium ${trend.cls}`}>{trend.text}</span>}
        {trend && sub ? " · " : ""}
        {sub}
      </p>
    </div>
  );
}

/** Horizontalne pruhy s podielom — zdroje, krajiny, zariadenia… */
function ShareList({
  title,
  rows,
  total,
  empty = "No data yet.",
  label = (k: string) => k,
}: {
  title: string;
  rows: Row[];
  total: number;
  empty?: string;
  label?: (k: string) => string;
}) {
  const max = Math.max(1, ...rows.map((r) => r.visitors));
  return (
    <div className="card p-5">
      <p className="text-sm font-semibold">{title}</p>
      <div className="mt-3 space-y-2">
        {rows.length === 0 && <p className="text-sm text-faint">{empty}</p>}
        {rows.map((r) => (
          <div key={r.key}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="min-w-0 truncate">{label(r.key)}</span>
              <span className="shrink-0 text-soft tabular-nums">
                {nf(r.visitors)}
                <span className="ml-1.5 text-xs text-faint">
                  {pct(r.visitors, total)}
                </span>
              </span>
            </div>
            <div className="mt-1 h-1.5 rounded-full bg-line/70">
              <div
                className="h-1.5 rounded-full bg-accent/80"
                style={{ width: `${Math.max(2, (r.visitors / max) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Stlpcovy graf po dnoch (jedna seria, jedna os). Hover na celom stlpci
 * ukaze den so vsetkymi cislami; nulove dni ostanu ako tenka linka.
 */
function DayChart({
  days,
  field,
  height,
  unit,
}: {
  days: Day[];
  field: "visitors" | "signups";
  height: number;
  unit: string;
}) {
  const max = Math.max(1, ...days.map((d) => d[field]));
  const n = days.length;
  return (
    <div>
      <div className="relative" style={{ height }}>
        {/* recesivna mriezka: max a polovica */}
        <div className="pointer-events-none absolute inset-x-0 top-0 border-t border-dashed border-line" />
        <div className="pointer-events-none absolute inset-x-0 top-1/2 border-t border-dashed border-line/70" />
        <span className="pointer-events-none absolute -top-2 right-0 bg-surface pl-1 text-[10px] text-faint tabular-nums">
          {nf(max)}
        </span>
        <div className="absolute inset-0 flex items-end gap-[2px] pr-6">
          {days.map((d, i) => {
            const v = d[field];
            const align =
              i < n * 0.2 ? "left-0" : i > n * 0.8 ? "right-0" : "left-1/2 -translate-x-1/2";
            return (
              <div key={d.d} className="group relative flex h-full min-w-0 flex-1 items-end">
                <div
                  className="w-full rounded-t-[4px] bg-accent/80 transition group-hover:bg-accent"
                  style={{
                    height: v === 0 ? 2 : `${Math.max(4, (v / max) * 100)}%`,
                    opacity: v === 0 ? 0.25 : 1,
                  }}
                />
                <div
                  className={`pointer-events-none absolute bottom-full z-10 mb-1.5 hidden whitespace-nowrap rounded-md bg-ink px-2.5 py-1.5 text-[11px] leading-tight text-paper shadow-lg group-hover:block ${align}`}
                >
                  <p className="font-medium">{fmtDay(d.d, true)}</p>
                  <p className="mt-0.5 text-paper/80">
                    {nf(d.visitors)} visitor{d.visitors === 1 ? "" : "s"} ·{" "}
                    {nf(d.pageviews)} view{d.pageviews === 1 ? "" : "s"} ·{" "}
                    {nf(d.signups)} signup{d.signups === 1 ? "" : "s"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="mt-1.5 flex justify-between pr-6 text-[11px] text-faint">
        <span>{n > 0 ? fmtDay(days[0].d) : ""}</span>
        <span>{unit} per day</span>
        <span>{n > 0 ? fmtDay(days[n - 1].d) : ""}</span>
      </div>
    </div>
  );
}

export default async function AdminWebsitePage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { range } = await searchParams;
  const days = RANGES.includes(Number(range) as (typeof RANGES)[number])
    ? Number(range)
    : 30;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_site_traffic", {
    p_days: days,
  });

  if (error || !data) {
    return (
      <div className="card p-6 text-sm text-soft">
        Website analytics are not available yet
        {error ? ` (${error.message})` : ""}.
      </div>
    );
  }
  const t = data as SiteTraffic;

  const channels = groupSum(
    t.sources,
    (s) => siteChannel(s.referrer, s.utm_source),
    (s) => s.visitors,
  );
  const referrers = groupSum(
    t.sources.filter((s) => s.referrer),
    (s) => s.referrer as string,
    (s) => s.visitors,
  ).slice(0, 12);
  const entryTotal = t.sources.reduce((n, s) => n + s.visitors, 0);

  const funnel = [
    { label: "Landing page", hint: "visited /", value: t.funnel.landing },
    { label: "Saw pricing", hint: "scrolled to pricing on /", value: t.funnel.pricing },
    { label: "Sign-up page", hint: "visited /register", value: t.funnel.register },
    { label: "New accounts", hint: "signed up (any method)", value: t.signups },
  ];
  const funnelTop = Math.max(1, funnel[0].value);

  return (
    <div className="space-y-8">
      {/* Hlavicka + rozsah */}
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold">
            {SITE_DOMAIN} · website traffic
          </h1>
          <p className="mt-1 max-w-2xl text-xs text-soft">
            Potential customers on our own marketing site (landing, guides,
            comparisons, log in, sign up). Cookie-less: a visitor is one device
            per day. Logged-in users, admins, bots and previews are not counted.
            Creator pages (our clients&apos; fans) are separate — see{" "}
            <Link href="/admin" className="underline underline-offset-2">
              Overview → Creator pages
            </Link>
            .
          </p>
        </div>
        <nav className="flex items-center gap-1 rounded-full bg-black/[0.04] p-1">
          {RANGES.map((r) => (
            <Link
              key={r}
              href={`/admin/website?range=${r}`}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
                r === days ? "bg-ink text-white" : "text-soft hover:text-ink"
              }`}
            >
              {r} days
            </Link>
          ))}
        </nav>
      </section>

      {/* KPI */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat
          label={`Visitors · ${days}d`}
          value={nf(t.visitors)}
          trend={delta(t.visitors, t.prev.visitors)}
          sub={`vs previous ${days}d`}
        />
        <Stat
          label={`Page views · ${days}d`}
          value={nf(t.pageviews)}
          trend={delta(t.pageviews, t.prev.pageviews)}
          sub={
            t.visitors > 0
              ? `${Math.round((t.pageviews / t.visitors) * 10) / 10} per visitor`
              : undefined
          }
        />
        <Stat
          label={`New accounts · ${days}d`}
          value={nf(t.signups)}
          trend={delta(t.signups, t.prev.signups)}
          sub={`vs previous ${days}d`}
        />
        <Stat
          label="Visitor → signup"
          value={pct(t.signups, t.visitors)}
          sub="new accounts / visitors"
        />
      </section>

      {/* Unikaty den / tyzden / mesiac */}
      <section className="card grid grid-cols-3 divide-x divide-line p-0">
        {[
          { label: "Today", value: t.today },
          { label: "Last 7 days", value: t.week },
          { label: "Last 30 days", value: t.month },
        ].map((s) => (
          <div key={s.label} className="px-5 py-4">
            <p className="text-xs text-soft">{s.label}</p>
            <p className="mt-0.5 font-grotesk text-2xl font-bold tabular-nums">
              {nf(s.value)}
              <span className="ml-1.5 text-xs font-normal text-faint">
                visitors
              </span>
            </p>
          </div>
        ))}
      </section>

      {/* Graf v case */}
      <section className="card p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-sm font-semibold">Visitors per day</p>
          <p className="text-xs text-faint">
            {t.since
              ? `Tracking since ${fmtDay(t.since)} · times in Europe/Bratislava`
              : "No visits recorded yet"}
          </p>
        </div>
        <div className="mt-6">
          <DayChart days={t.by_day} field="visitors" height={160} unit="visitors" />
        </div>
        <p className="mt-6 text-sm font-semibold">New accounts per day</p>
        <div className="mt-4">
          <DayChart days={t.by_day} field="signups" height={56} unit="new accounts" />
        </div>
        <details className="mt-4 text-xs text-soft">
          <summary className="cursor-pointer select-none hover:text-ink">
            Show as table
          </summary>
          <div className="mt-2 max-h-72 overflow-y-auto">
            <table className="w-full text-left tabular-nums">
              <thead className="sticky top-0 bg-surface text-faint">
                <tr>
                  <th className="py-1 pr-3 font-medium">Day</th>
                  <th className="py-1 pr-3 font-medium">Visitors</th>
                  <th className="py-1 pr-3 font-medium">Views</th>
                  <th className="py-1 font-medium">Signups</th>
                </tr>
              </thead>
              <tbody>
                {[...t.by_day].reverse().map((d) => (
                  <tr key={d.d} className="border-t border-line/60">
                    <td className="py-1 pr-3">{fmtDay(d.d, true)}</td>
                    <td className="py-1 pr-3">{d.visitors}</td>
                    <td className="py-1 pr-3">{d.pageviews}</td>
                    <td className="py-1">{d.signups}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </section>

      {/* Funnel + zdroje */}
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <p className="text-sm font-semibold">Funnel · {days}d</p>
          <p className="mt-1 text-xs text-soft">
            Unique visitors at each step. New accounts include Google sign-ups
            and people who signed up on another day.
          </p>
          <div className="mt-4 space-y-3">
            {funnel.map((f, i) => (
              <div key={f.label}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span>
                    <span className="font-medium">{f.label}</span>{" "}
                    <span className="text-xs text-faint">{f.hint}</span>
                  </span>
                  <span className="shrink-0 tabular-nums">
                    {nf(f.value)}
                    {i > 0 && (
                      <span className="ml-1.5 text-xs text-faint">
                        {pct(f.value, funnel[0].value)}
                      </span>
                    )}
                  </span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-line/70">
                  <div
                    className="h-2 rounded-full bg-accent/80"
                    style={{
                      width: `${f.value === 0 ? 0 : Math.max(2, Math.min(100, (f.value / funnelTop) * 100))}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-faint">
            Log-in page: {nf(t.funnel.login)} visitors (mostly existing users).
          </p>
        </div>

        <ShareList
          title={`Where visitors come from · ${days}d`}
          rows={channels}
          total={entryTotal}
          empty="No visits yet."
        />
      </section>

      {/* Stranky + referreri */}
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <p className="text-sm font-semibold">Pages · {days}d</p>
          <div className="mt-3 overflow-x-auto">
            {t.pages.length === 0 ? (
              <p className="text-sm text-faint">No visits yet.</p>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="border-b border-line text-xs text-faint uppercase">
                  <tr>
                    <th className="py-2 pr-3 font-medium">Page</th>
                    <th className="py-2 pr-3 text-right font-medium">Visitors</th>
                    <th className="py-2 text-right font-medium">Views</th>
                  </tr>
                </thead>
                <tbody>
                  {t.pages.map((p) => (
                    <tr key={p.path} className="border-b border-line/60">
                      <td className="max-w-[16rem] py-2 pr-3">
                        <a
                          href={`https://${SITE_DOMAIN}${p.path}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block truncate font-medium hover:underline"
                        >
                          {p.path}
                        </a>
                        {PAGE_LABELS[p.path] && (
                          <span className="text-xs text-faint">
                            {PAGE_LABELS[p.path]}
                          </span>
                        )}
                      </td>
                      <td className="py-2 pr-3 text-right tabular-nums">
                        {nf(p.visitors)}
                      </td>
                      <td className="py-2 text-right text-soft tabular-nums">
                        {nf(p.views)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <ShareList
          title={`Referring websites · ${days}d`}
          rows={referrers}
          total={entryTotal}
          empty="No external referrers yet — visits are direct or from apps that hide the referrer."
          label={(k) => (k === SITE_DOMAIN ? `${k} (creator pages)` : k)}
        />
      </section>

      {/* Kampane */}
      <section className="card p-5">
        <p className="text-sm font-semibold">Campaigns (UTM) · {days}d</p>
        <p className="mt-1 text-xs text-soft">
          Tag your links, e.g.{" "}
          <code className="rounded bg-line/60 px-1">
            {SITE_DOMAIN}/?utm_source=instagram&amp;utm_campaign=launch
          </code>{" "}
          (short form <code className="rounded bg-line/60 px-1">?s=instagram</code>).
          The “Powered by” badge on creator pages is tagged automatically.
        </p>
        {t.campaigns.length === 0 ? (
          <p className="mt-3 text-sm text-faint">No tagged visits yet.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead className="border-b border-line text-xs text-faint uppercase">
                <tr>
                  <th className="py-2 pr-3 font-medium">Source</th>
                  <th className="py-2 pr-3 font-medium">Medium</th>
                  <th className="py-2 pr-3 font-medium">Campaign</th>
                  <th className="py-2 text-right font-medium">Visitors</th>
                </tr>
              </thead>
              <tbody>
                {t.campaigns.map((c, i) => (
                  <tr key={i} className="border-b border-line/60">
                    <td className="py-2 pr-3 font-medium">{c.source ?? "—"}</td>
                    <td className="py-2 pr-3 text-soft">{c.medium ?? "—"}</td>
                    <td className="py-2 pr-3 text-soft">{c.campaign ?? "—"}</td>
                    <td className="py-2 text-right tabular-nums">{nf(c.visitors)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Krajiny / zariadenia / prehliadace */}
      <section className="grid gap-4 lg:grid-cols-3">
        <ShareList
          title="Countries"
          rows={t.countries}
          total={t.visitors}
          label={countryName}
        />
        <ShareList
          title="Devices"
          rows={t.devices}
          total={t.visitors}
          label={(k) => k.charAt(0).toUpperCase() + k.slice(1)}
        />
        <ShareList title="Browsers" rows={t.browsers} total={t.visitors} />
      </section>
    </div>
  );
}
