import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SetPlanForm } from "@/components/admin/set-plan-form";
import { PLANS } from "@/lib/plans";
import { SITE_DOMAIN } from "@/lib/site";
import {
  eventLabel,
  lifecycleStatus,
  REVENUE_SOURCE,
  revenueSource,
  TONE_BADGE,
  TONE_DOT,
  type AccountEvent,
  type Tone,
} from "@/lib/crm";

type Detail = {
  account: {
    id: string;
    email: string;
    plan: string;
    subscription_status: string | null;
    revenue_source: string | null;
    created_at: string;
    last_sign_in_at: string | null;
    plan_expires_at: string | null;
    stripe_customer_id: string | null;
    referral_code: string | null;
  } | null;
  profiles: {
    username: string;
    is_published: boolean;
    views_30d: number;
    clicks_30d: number;
  }[];
  events: AccountEvent[];
};

function fmt(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Guard (login + is_admin) riesi app/admin/layout.tsx.
  const { data } = await supabase.rpc("admin_account_detail", { p_account: id });
  const detail = (data ?? null) as Detail | null;
  if (!detail?.account) notFound();

  const a = detail.account;
  const status = lifecycleStatus({
    plan: a.plan,
    subscription_status: a.subscription_status,
    first_paid_at:
      detail.events.find((e) => e.to_plan === "pro" || e.to_plan === "business")
        ?.created_at ?? null,
  });

  const totalViews = detail.profiles.reduce((n, p) => n + Number(p.views_30d), 0);
  const totalClicks = detail.profiles.reduce((n, p) => n + Number(p.clicks_30d), 0);

  const isPaidPlan = a.plan === "pro" || a.plan === "business";
  const rs = REVENUE_SOURCE[revenueSource(a.revenue_source)];

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/admin/clients"
        className="text-sm text-soft transition hover:text-ink"
      >
        ← All clients
      </Link>

      <div className="mt-4">
        {/* Hlavicka klienta */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-grotesk text-2xl font-bold tracking-tight">
                {a.email}
              </h1>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${TONE_BADGE[status.tone as Tone]}`}
              >
                {status.label}
              </span>
            </div>
            <p className="mt-1 text-sm text-soft">
              Joined {fmt(a.created_at)} · Last active {fmt(a.last_sign_in_at)}
            </p>
          </div>

          {/* Rucna zmena planu */}
          <SetPlanForm accountId={a.id} currentPlan={a.plan} />
        </div>

        {/* Fakty */}
        <section className="mt-6 grid gap-3 sm:grid-cols-4">
          <div className="card p-4">
            <p className="text-xs text-soft">Plan</p>
            <p className="mt-0.5 font-grotesk text-xl font-bold">
              {PLANS[a.plan as keyof typeof PLANS]?.label ?? a.plan}
            </p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-soft">Revenue</p>
            {isPaidPlan ? (
              <p className="mt-1">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-sm font-semibold ${TONE_BADGE[rs.tone]}`}
                >
                  {rs.label}
                </span>
              </p>
            ) : (
              <p className="mt-0.5 font-grotesk text-xl font-bold">—</p>
            )}
            {isPaidPlan && <p className="mt-1.5 text-xs text-faint">{rs.note}</p>}
          </div>
          <div className="card p-4">
            <p className="text-xs text-soft">Views 30d</p>
            <p className="mt-0.5 font-grotesk text-xl font-bold tabular-nums">
              {totalViews}
            </p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-soft">Clicks 30d</p>
            <p className="mt-0.5 font-grotesk text-xl font-bold tabular-nums">
              {totalClicks}
            </p>
          </div>
        </section>

        {(a.subscription_status || a.plan_expires_at) && (
          <p className="mt-3 text-sm text-soft">
            {a.subscription_status && (
              <>Stripe status: {a.subscription_status}</>
            )}
            {a.subscription_status && a.plan_expires_at && " · "}
            {a.plan_expires_at && <>Plan expires {fmt(a.plan_expires_at)}</>}
          </p>
        )}

        {/* Stranky */}
        <section className="mt-8">
          <h2 className="text-sm font-semibold">Pages</h2>
          <div className="card mt-3 divide-y divide-line">
            {detail.profiles.length === 0 && (
              <p className="p-5 text-sm text-soft">No pages yet.</p>
            )}
            {detail.profiles.map((p) => (
              <div
                key={p.username}
                className="flex items-center justify-between gap-3 p-4"
              >
                <div>
                  <a
                    href={`https://${SITE_DOMAIN}/${p.username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium hover:underline"
                  >
                    {SITE_DOMAIN}/{p.username}
                  </a>
                  <p className="text-xs text-faint">
                    {p.is_published ? (
                      <span className="text-ok">live</span>
                    ) : (
                      "hidden"
                    )}
                  </p>
                </div>
                <p className="text-sm text-soft tabular-nums">
                  {p.views_30d} views · {p.clicks_30d} clicks
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Casova os udalosti */}
        <section className="mt-8">
          <h2 className="text-sm font-semibold">Lifecycle timeline</h2>
          <ol className="mt-4 space-y-0">
            {detail.events.map((e, i) => {
              const label = eventLabel(e);
              return (
                <li key={i} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <span
                      className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${TONE_DOT[label.tone as Tone]}`}
                    />
                    {i < detail.events.length - 1 && (
                      <span className="w-px flex-1 bg-line" />
                    )}
                  </div>
                  <div className="pb-6">
                    <p className="text-sm font-medium text-ink">{label.title}</p>
                    <p className="text-xs text-faint">{fmt(e.created_at)}</p>
                  </div>
                </li>
              );
            })}
            {detail.events.length === 0 && (
              <p className="text-sm text-soft">No events recorded yet.</p>
            )}
          </ol>
        </section>
      </div>
    </div>
  );
}
