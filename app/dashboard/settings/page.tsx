import "@/components/dashboard/workspace.css";
import { SettingsWorkspace } from "@/components/dashboard/settings-workspace";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PROFILE_ORDER_KEY, orderProfiles } from "@/lib/profile-order";
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

  const { data: profileRows } = await supabase
    .from("profiles")
    .select(
      "id, username, seo_title, seo_description, is_indexable, age_gate, hide_branding",
    )
    .eq("owner_id", user.id)
    .order("created_at");

  const profiles = orderProfiles(
    profileRows ?? [],
    user.user_metadata?.[PROFILE_ORDER_KEY],
  );
  if (profiles.length === 0) redirect("/onboarding");

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
    <div className="account-page settings-page">
      <header className="account-heading">
        <div>
          <h1>Settings</h1>
          <p>Manage your account and the details of your page.</p>
        </div>
        <span className="account-profile-label">{current.username}</span>
      </header>
      {profiles.length > 1 && (
        <nav className="account-profile-switcher" aria-label="Choose a profile">
          {profiles.map((x) => (
            <Link
              key={x.id}
              href={`/dashboard/settings?p=${x.id}`}
              aria-current={x.id === current.id ? "page" : undefined}
            >
              {x.username}
            </Link>
          ))}
        </nav>
      )}
      <SettingsWorkspace
        sections={[
          {
            id: "billing",
            title: "Plan & billing",
            description: "Your subscription, payment details and invoices.",
            content: (
              <BillingPanel
                plan={account?.plan ?? "free"}
                status={account?.subscription_status ?? null}
                expiresAt={account?.plan_expires_at ?? null}
                hasStripeCustomer={!!account?.stripe_customer_id}
              />
            ),
          },
          {
            id: "branding",
            title: "Page branding",
            description:
              "Choose whether the Linkovne badge appears on your public page.",
            content: (
              <BrandingPanel
                key={current.id}
                profileId={current.id}
                hidden={current.hide_branding === true}
                canHide={plan.hideBranding}
              />
            ),
          },
          {
            id: "search",
            title: "Search & sharing",
            description: `Control how ${current.username} appears in search results and shared links.`,
            content: (
              <SeoPanel
                key={current.id}
                profileId={current.id}
                seoTitle={current.seo_title ?? ""}
                seoDescription={current.seo_description ?? ""}
                isIndexable={current.is_indexable !== false}
                ageGate={current.age_gate === true}
              />
            ),
          },
          {
            id: "domains",
            title: "Custom domains",
            description:
              "Connect your own domain and check its connection status.",
            content: (
              <DomainsPanel
                key={current.id}
                profileId={current.id}
                enabled={plan.customDomains}
                domains={domains ?? []}
              />
            ),
          },
          {
            id: "promo",
            title: "Redeem a code",
            description: "Apply a promotional code to your account.",
            content: (
              <div className="card p-6">
                <RedeemForm />
              </div>
            ),
          },
          {
            id: "security",
            title: "Password & security",
            description: `Signed in as ${user.email}`,
            content: (
              <div className="card p-6">
                <ResetForm redirectTo="/dashboard/settings" />
              </div>
            ),
          },
          {
            id: "advanced",
            title: "Delete profile",
            description:
              "Manage permanent deletion of this profile. Review these actions carefully.",
            content: (
              <DangerZone
                key={current.id}
                profileId={current.id}
                username={current.username}
                profileCount={profiles.length}
              />
            ),
          },
        ]}
      />
    </div>
  );
}
