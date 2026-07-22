import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { setPlan } from "@/app/admin/actions";
import { Wordmark } from "@/components/wordmark";
import { PLAN_KEYS, PLANS } from "@/lib/plans";
import { SITE_DOMAIN } from "@/lib/site";
import {
  eventLabel,
  lifecycleStatus,
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
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (isAdmin !== true) redirect("/dashboard");

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

  return (
    <div className="min-h-dvh">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <Wordmark className="text-lg" />
            <span className="rounded-full border border-line px-2.5 py-0.5 text-xs font-medium text-soft">
              admin
            </span>
          </div>
          <Link href="/admin" className="btn-quiet">
            ← All clients
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-10">
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
          <form
            action={setPlan.bind(null, a.id)}
            className="flex items-center gap-2"
          >
            <select
              name="plan"
              defaultValue={a.plan}
              className="rounded-lg border border-line bg-surface px-2 py-1.5 text-sm"
            >
              {PLAN_KEYS.map((key) => (
                <option key={key} value={key}>
                  {PLANS[key].label}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded-full border border-line px-3 py-1.5 text-sm text-soft transition hover:border-ink hover:text-ink"
            >
              Set plan
            </button>
          </form>
        </div>

        {/* Fakty */}
        <section className="mt-6 grid gap-3 sm:grid-cols-4">
          {[
            { label: "Plan", value: PLANS[a.plan as keyof typeof PLANS]?.label ?? a.plan },
            {
              label: "Sub. status",
              value: a.subscription_status ?? "—",
            },
            { label: "Views 30d", value: totalViews },
            { label: "Clicks 30d", value: totalClicks },
          ].map((s) => (
            <div key={s.label} className="card p-4">
              <p className="text-xs text-soft">{s.label}</p>
              <p className="mt-0.5 font-grotesk text-xl font-bold tabular-nums">
                {s.value}
              </p>
            </div>
          ))}
        </section>

        {a.plan_expires_at && (
          <p className="mt-3 text-sm text-soft">
            Plan expires {fmt(a.plan_expires_at)}
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
      </main>
    </div>
  );
}
