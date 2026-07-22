import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ResetForm } from "@/components/reset-form";
import { DomainsPanel } from "@/components/settings/domains-panel";
import { SeoPanel } from "@/components/settings/seo-panel";
import { RedeemForm } from "@/components/settings/redeem-form";
import { BrandingPanel } from "@/components/settings/branding-panel";
import { BillingPanel } from "@/components/settings/billing-panel";
import { DangerZone } from "@/components/settings/danger-zone";
import { planOf } from "@/lib/plans";

export default async function SettingsPage({
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
    .select(
      "id, username, seo_title, seo_description, is_indexable, age_gate, hide_branding",
    )
    .eq("owner_id", user.id)
    .order("created_at");

  if (!profiles || profiles.length === 0) redirect("/onboarding");

  const current = profiles.find((x) => x.id === p) ?? profiles[0];

  const [{ data: account }, { data: domains }] = await Promise.all([
    supabase
      .from("accounts")
      .select("plan, subscription_status, plan_expires_at, stripe_customer_id")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("domains")
      .select(
        "id, host, status, verification, error, checked_at, priority, is_healthy, last_ok_at",
      )
      .order("priority")
      .eq("profile_id", current.id),
  ]);

  const plan = planOf(account?.plan);

  return (
    <div className="space-y-10">
        {profiles.length > 1 && (
          <div className="flex flex-wrap gap-2">
            {profiles.map((x) => (
              <Link
                key={x.id}
                href={`/dashboard/settings?p=${x.id}`}
                className={`rounded-full border px-3.5 py-1.5 text-sm transition ${
                  x.id === current.id
                    ? "border-ink bg-ink text-paper"
                    : "border-line hover:border-soft"
                }`}
              >
                {x.username}
              </Link>
            ))}
          </div>
        )}

        <section>
          <h2 className="font-grotesk font-bold text-2xl tracking-tight">Billing</h2>
          <p className="mt-1 text-sm text-soft">
            Your plan, payments and invoices.
          </p>
          <div className="mt-4">
            <BillingPanel
              plan={account?.plan ?? "free"}
              status={account?.subscription_status ?? null}
              expiresAt={account?.plan_expires_at ?? null}
              hasStripeCustomer={!!account?.stripe_customer_id}
            />
          </div>
        </section>

        <section>
          <h2 className="font-grotesk font-bold text-2xl tracking-tight">Promo code</h2>
          <p className="mt-1 text-sm text-soft">
            Got a code? Redeem it to unlock Pro or Business.
          </p>
          <div className="card mt-4 max-w-md p-5">
            <RedeemForm />
          </div>
        </section>

        <section>
          <h2 className="font-grotesk font-bold text-2xl tracking-tight">Branding</h2>
          <p className="mt-1 text-sm text-soft">
            The small “Powered by linkovne” badge on your public page.
          </p>
          <div className="mt-4">
            <BrandingPanel
              profileId={current.id}
              hidden={current.hide_branding === true}
              canHide={plan.hideBranding}
            />
          </div>
        </section>

        <section>
          <h2 className="font-grotesk font-bold text-2xl tracking-tight">Search &amp; sharing</h2>
          <p className="mt-1 text-sm text-soft">
            How <span className="font-medium">{current.username}</span> looks in
            Google and when shared.
          </p>
          <div className="mt-4">
            <SeoPanel
              profileId={current.id}
              seoTitle={current.seo_title ?? ""}
              seoDescription={current.seo_description ?? ""}
              isIndexable={current.is_indexable !== false}
              ageGate={current.age_gate === true}
            />
          </div>
        </section>

        <section>
          <h2 className="font-grotesk font-bold text-2xl tracking-tight">Custom domain</h2>
          <p className="mt-1 max-w-xl text-sm text-soft">
            Your own domain is the whole point — a page nobody else shares can&apos;t
            be taken down by someone else&apos;s behaviour.
          </p>
          <div className="mt-4">
            <DomainsPanel
              profileId={current.id}
              enabled={plan.customDomains}
              domains={domains ?? []}
            />
          </div>
        </section>

        <section>
          <h2 className="font-grotesk font-bold text-2xl tracking-tight">Password</h2>
          <p className="mt-1 text-sm text-soft">
            Signed in as {user.email}
          </p>
          <div className="card mt-4 max-w-sm p-5">
            <ResetForm redirectTo="/dashboard/settings" />
          </div>
        </section>

        <section>
          <h2 className="font-grotesk font-bold text-2xl tracking-tight text-danger">
            Danger zone
          </h2>
          <div className="mt-4">
            <DangerZone
              profileId={current.id}
              username={current.username}
              profileCount={profiles.length}
            />
          </div>
        </section>
    </div>
  );
}
