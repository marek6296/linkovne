import { redirect } from "next/navigation";
import { PROFILE_ORDER_KEY, orderProfiles } from "@/lib/profile-order";
import { createClient } from "@/lib/supabase/server";
import { Editor } from "@/components/editor/editor";
import { PublishControls } from "@/components/editor/publish-controls";
import { ProfileSwitcher } from "@/components/editor/profile-switcher";
import { UpgradedWelcome } from "@/components/dashboard/upgraded-welcome";
import { planOf } from "@/lib/plans";
import type { Block } from "@/lib/blocks";
import type { Design } from "@/lib/design";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ p?: string; upgraded?: string }>;
}) {
  const { p, upgraded } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Shared auth pool: Linkovne membership = owning at least one profile.
  const { data: profileRows } = await supabase
    .from("profiles")
    .select(
      "id, username, display_name, bio, avatar_url, theme, design, link_shield, escape_inapp, creator_mode, hide_branding, is_published, published_at, updated_at",
    )
    .eq("owner_id", user.id)
    .order("created_at");

  const profiles = orderProfiles(
    profileRows ?? [],
    user.user_metadata?.[PROFILE_ORDER_KEY],
  );
  if (profiles.length === 0) redirect("/onboarding");

  const current = profiles.find((profile) => profile.id === p) ?? profiles[0];
  // Pin the open editor in the URL so changing the default never switches drafts.
  if (p !== current.id) {
    redirect(
      `/dashboard?p=${current.id}${upgraded === "1" ? "&upgraded=1" : ""}`,
    );
  }

  const { data: account } = await supabase
    .from("accounts")
    .select("plan, plan_expires_at")
    .eq("id", user.id)
    .maybeSingle();

  const plan = planOf(account?.plan);

  // ?upgraded=1 prichadza z dvoch miest — invite link (/i/<code>) a uspesny
  // Stripe checkout. Plan uz je v tomto bode ulozeny v DB, staci ho ukazat.
  const justUpgraded =
    upgraded === "1" &&
    (account?.plan === "pro" ||
      account?.plan === "business" ||
      account?.plan === "admin");

  // Rozrobene zmeny = profil sa menil po poslednom zverejneni
  const hasUnpublished =
    current.is_published &&
    (!current.published_at ||
      new Date(current.updated_at as string).getTime() >
        new Date(current.published_at as string).getTime() + 1000);

  const [{ data: blocks }, { data: health }] = await Promise.all([
    supabase
      .from("blocks")
      .select("id, type, config, position, is_active, starts_at, ends_at")
      .eq("profile_id", current.id)
      .order("position"),
    supabase.from("link_health").select("block_id, ok"),
  ]);

  const brokenLinks = (health ?? [])
    .filter((h) => h.ok === false)
    .map((h) => h.block_id as string);

  return (
    <>
      <section
        className="profile-workspace-header"
        aria-label="Profile workspace"
      >
        <ProfileSwitcher
          profiles={profiles.map((x) => ({
            id: x.id,
            username: x.username,
            display_name: x.display_name,
            avatar_url: x.avatar_url,
            is_published: x.is_published,
          }))}
          currentId={current.id}
          canAddMore={profiles.length < plan.profiles}
          limit={plan.profiles}
        />
      </section>

      <div className="mt-1">
        <Editor
          key={current.id}
          isPublished={current.is_published}
          publishControls={
            <PublishControls
              key={current.id}
              profileId={current.id}
              username={current.username}
              initialPublished={current.is_published}
              initialHasUnpublished={hasUnpublished}
            />
          }
          initialProfile={{
            id: current.id,
            username: current.username,
            display_name: current.display_name ?? "",
            bio: current.bio ?? "",
            avatar_url: current.avatar_url,
            theme: current.theme ?? "classic",
            design: (current.design ?? {}) as Design,
            link_shield: current.link_shield === true,
            escape_inapp: current.escape_inapp === true,
            creator_mode: current.creator_mode === true,
            hide_branding: current.hide_branding === true,
          }}
          initialBlocks={(blocks ?? []) as Block[]}
          brokenLinks={brokenLinks}
          plan={plan}
          userId={user.id}
        />
      </div>

      {justUpgraded && (
        <UpgradedWelcome
          granted={{
            plan: account!.plan as "pro" | "business" | "admin",
            months: null,
            expiresAt: account?.plan_expires_at ?? null,
          }}
          cleanUrl={p ? `/dashboard?p=${p}` : "/dashboard"}
        />
      )}
    </>
  );
}
