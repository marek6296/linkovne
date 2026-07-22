import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { savePromo, createInvite, deleteInvite } from "@/app/admin/actions";
import { Wordmark } from "@/components/wordmark";
import { ClientsTable, type ClientRow } from "@/components/admin/clients-table";
import { SITE_DOMAIN } from "@/lib/site";

type AdminMetrics = {
  total_accounts: number;
  paying: number;
  free: number;
  signups_30d: number;
  new_paid_30d: number;
  churn_30d: number;
  active_30d: number;
  mrr: number;
};

type PromoRow = {
  active: boolean;
  headline: string | null;
  price: string | null;
  ends_at: string | null;
};

type Invite = {
  code: string;
  plan: string;
  months: number | null;
  max_uses: number | null;
  uses: number;
  note: string | null;
  expires_at: string | null;
  created_at: string;
};

/** ISO → hodnota pre <input type="datetime-local"> v lokálnom čase. */
function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

function durationLabel(months: number | null): string {
  if (months === null) return "Unlimited";
  if (months === 12) return "1 year";
  if (months === 1) return "1 month";
  return `${months} mo`;
}

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (isAdmin !== true) redirect("/dashboard");

  const [{ data }, { data: metricsData }, { data: promoData }, { data: inviteData }] =
    await Promise.all([
      supabase.rpc("admin_list_users"),
      supabase.rpc("admin_metrics"),
      supabase.from("promo").select("active, headline, price, ends_at").eq("id", 1).maybeSingle(),
      supabase.rpc("admin_list_invites"),
    ]);
  const list = (data ?? []) as ClientRow[];
  const m = (metricsData ?? {}) as Partial<AdminMetrics>;
  const promo = (promoData ?? {}) as PromoRow;
  const invites = (inviteData ?? []) as Invite[];

  const total = m.total_accounts ?? 0;
  const conversion = total > 0 ? Math.round(((m.paying ?? 0) / total) * 100) : 0;

  const metrics = [
    { label: "Accounts", value: total },
    { label: "Paying", value: m.paying ?? 0 },
    { label: "MRR", value: `€${Math.round(m.mrr ?? 0)}` },
    { label: "Conversion", value: `${conversion}%` },
    { label: "Signups 30d", value: m.signups_30d ?? 0 },
    { label: "New paid 30d", value: m.new_paid_30d ?? 0 },
    { label: "Churn 30d", value: m.churn_30d ?? 0 },
    { label: "Active 30d", value: m.active_30d ?? 0 },
  ];

  return (
    <div className="min-h-dvh">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <Wordmark className="text-lg" />
            <span className="rounded-full border border-line px-2.5 py-0.5 text-xs font-medium text-soft">
              admin
            </span>
          </div>
          <Link href="/dashboard" className="btn-quiet">
            ← Dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {metrics.map((s) => (
            <div key={s.label} className="card p-5">
              <p className="text-xs text-soft">{s.label}</p>
              <p className="mt-1 font-grotesk font-bold text-3xl tabular-nums">
                {s.value}
              </p>
            </div>
          ))}
        </section>

        {/* Promo banner */}
        <section className="card mt-8 p-6">
          <h2 className="text-sm font-semibold">Promo banner &amp; countdown</h2>
          <p className="mt-1 text-xs text-soft">
            Shows on the landing page with a live countdown and a struck-through
            Pro price. Uncheck &quot;Active&quot; to hide the top bar completely
            — check it again any time to turn it back on.
          </p>
          <form action={savePromo} className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input type="checkbox" name="active" defaultChecked={promo.active} />
              Active
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-xs text-soft">Headline</span>
              <input
                name="headline"
                defaultValue={promo.headline ?? ""}
                placeholder="Launch offer — Pro for just €3.99/mo"
                className="field"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-soft">
                Discounted Pro price
              </span>
              <input
                name="price"
                defaultValue={promo.price ?? ""}
                placeholder="€3.99"
                className="field"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-soft">
                Countdown ends
              </span>
              <input
                type="datetime-local"
                name="ends_at"
                defaultValue={toLocalInput(promo.ends_at)}
                className="field"
              />
            </label>
            <div className="sm:col-span-2">
              <button type="submit" className="btn-ink px-5 py-2.5 text-sm">
                Save promo
              </button>
            </div>
          </form>
        </section>

        {/* Invite links */}
        <section className="card mt-8 p-6">
          <h2 className="text-sm font-semibold">Invite links — grant Pro</h2>
          <p className="mt-1 text-xs text-soft">
            Send someone this link. When they sign up (or log in) through it,
            they get Pro instantly for the chosen time.
          </p>
          <form
            action={createInvite}
            className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
          >
            <label className="block">
              <span className="mb-1 block text-xs text-soft">Free plan</span>
              <select name="plan" className="field" defaultValue="pro">
                <option value="pro">Pro</option>
                <option value="business">Business</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-soft">For</span>
              <select name="duration" className="field" defaultValue="month">
                <option value="month">1 month</option>
                <option value="year">1 year</option>
                <option value="unlimited">Unlimited</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-soft">Max uses</span>
              <input
                name="max_uses"
                type="number"
                min="1"
                placeholder="∞"
                className="field"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-soft">
                Code valid until
              </span>
              <input type="datetime-local" name="expires_at" className="field" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-soft">Note</span>
              <input
                name="note"
                placeholder="e.g. Instagram promo"
                className="field"
              />
            </label>
            <div className="flex items-end">
              <button type="submit" className="btn-ink px-5 py-2.5 text-sm">
                Create code
              </button>
            </div>
          </form>

          {invites.length > 0 && (
            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-line text-xs text-faint uppercase">
                  <tr>
                    <th className="px-3 py-2 font-medium">Code / link</th>
                    <th className="px-3 py-2 font-medium">Grants</th>
                    <th className="px-3 py-2 font-medium">Uses</th>
                    <th className="px-3 py-2 font-medium">Valid until</th>
                    <th className="px-3 py-2 font-medium">Note</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {invites.map((iv) => (
                    <tr key={iv.code} className="border-b border-line/60">
                      <td className="px-3 py-2">
                        <code className="text-sm font-semibold uppercase">
                          {iv.code}
                        </code>
                        <p className="text-xs text-faint">
                          {SITE_DOMAIN}/i/{iv.code}
                        </p>
                      </td>
                      <td className="px-3 py-2">
                        {iv.plan === "business" ? "Business" : "Pro"} ·{" "}
                        {durationLabel(iv.months)}
                      </td>
                      <td className="px-3 py-2 tabular-nums">
                        {iv.uses}
                        {iv.max_uses ? ` / ${iv.max_uses}` : ""}
                      </td>
                      <td className="px-3 py-2 text-soft">
                        {iv.expires_at
                          ? new Date(iv.expires_at).toLocaleDateString("en-GB")
                          : "—"}
                      </td>
                      <td className="px-3 py-2 text-soft">{iv.note ?? "—"}</td>
                      <td className="px-3 py-2 text-right">
                        <form action={deleteInvite.bind(null, iv.code)}>
                          <button
                            type="submit"
                            className="text-xs text-danger transition hover:underline"
                          >
                            Delete
                          </button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <ClientsTable accounts={list} />
      </main>
    </div>
  );
}
