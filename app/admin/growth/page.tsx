import { createClient } from "@/lib/supabase/server";
import { savePromo, createInvite, deleteInvite } from "@/app/admin/actions";
import { fmtDate } from "@/lib/crm";
import { SITE_DOMAIN } from "@/lib/site";

/**
 * Admin → Growth. Marketingove nastroje: promo lista na landingu, invite
 * kody (Pro/Business zadarmo na cas) a prehlad referral programu.
 */

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

type Referral = {
  referrer_email: string;
  referred_email: string;
  status: string;
  reward_months: number | null;
  created_at: string;
  rewarded_at: string | null;
};

/** ISO → hodnota pre <input type="datetime-local"> v lokalnom case. */
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

export default async function AdminGrowthPage() {
  const supabase = await createClient();
  const [{ data: promoData }, { data: inviteData }, { data: platformData }] =
    await Promise.all([
      supabase
        .from("promo")
        .select("active, headline, price, ends_at")
        .eq("id", 1)
        .maybeSingle(),
      supabase.rpc("admin_list_invites"),
      supabase.rpc("admin_platform"),
    ]);
  const promo = (promoData ?? {}) as PromoRow;
  const invites = (inviteData ?? []) as Invite[];
  const referrals = ((platformData as { referrals?: Referral[] } | null)
    ?.referrals ?? []) as Referral[];

  return (
    <div className="space-y-8">
      {/* Promo lista */}
      <section className="card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">Promo banner &amp; countdown</h2>
            <p className="mt-1 text-xs text-soft">
              Top bar on the landing page with a live countdown and a
              struck-through Pro price. The discounted price also shows in
              pricing and onboarding.
            </p>
          </div>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
              promo.active ? "bg-ok/10 text-ok" : "bg-line text-soft"
            }`}
          >
            {promo.active ? "Live" : "Off"}
          </span>
        </div>

        <form action={savePromo} className="mt-5 grid gap-3 sm:grid-cols-2">
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input type="checkbox" name="active" defaultChecked={promo.active} />
            Active — show the bar on the landing page
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
            <span className="mb-1 block text-xs text-soft">Countdown ends</span>
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

      {/* Invite kody */}
      <section className="card p-6">
        <h2 className="text-sm font-semibold">Invite codes — grant Pro free</h2>
        <p className="mt-1 text-xs text-soft">
          Share {SITE_DOMAIN}/i/&lt;code&gt; or let people type the code during
          onboarding. They get the plan instantly for the chosen time — no card.
        </p>

        <form
          action={createInvite}
          className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
        >
          <label className="block">
            <span className="mb-1 block text-xs text-soft">Grants plan</span>
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
            <span className="mb-1 block text-xs text-soft">Code valid until</span>
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
                      {iv.expires_at ? fmtDate(iv.expires_at) : "—"}
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

      {/* Referraly */}
      <section className="card p-6">
        <h2 className="text-sm font-semibold">Referrals</h2>
        <p className="mt-1 text-xs text-soft">
          Invite &amp; earn — who brought whom. The reward lands when the
          referred user makes their first payment.
        </p>

        {referrals.length === 0 ? (
          <p className="mt-4 text-sm text-faint">No referrals yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line text-xs text-faint uppercase">
                <tr>
                  <th className="px-3 py-2 font-medium">Referrer</th>
                  <th className="px-3 py-2 font-medium">Referred</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody>
                {referrals.map((r, i) => (
                  <tr key={i} className="border-b border-line/60">
                    <td className="px-3 py-2 font-medium">{r.referrer_email}</td>
                    <td className="px-3 py-2">{r.referred_email}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          r.status === "rewarded"
                            ? "bg-ok/10 text-ok"
                            : "bg-line text-soft"
                        }`}
                      >
                        {r.status}
                        {r.status === "rewarded" && r.reward_months
                          ? ` · +${r.reward_months}mo`
                          : ""}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-soft">{fmtDate(r.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
