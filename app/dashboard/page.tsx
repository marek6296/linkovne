import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { publishProfile, unpublishProfile } from "@/app/dashboard/actions";
import { Editor } from "@/components/editor/editor";
import { ProfileSwitcher } from "@/components/editor/profile-switcher";
import { ShareCard } from "@/components/editor/share-card";
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
  const { data: profiles } = await supabase
    .from("profiles")
    .select(
      "id, username, display_name, bio, avatar_url, theme, design, link_shield, escape_inapp, is_published, published_at, updated_at",
    )
    .eq("owner_id", user.id)
    .order("created_at");

  if (!profiles || profiles.length === 0) redirect("/onboarding");

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
  const current = profiles.find((x) => x.id === p) ?? profiles[0];

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
      {/* Toolbar: prepinac stranok + publikovanie.
          Mobil: dva ciste riadky (Models hore, publish dole cez celu sirku —
          Unpublish vlavo, hlavne tlacidlo vpravo). Desktop: jeden riadok.
          ⚠️ Tlacidla su vzdy dokovane vpravo cez `sm:ml-auto` na ich vlastnom
          wrapperi — NIE cez `justify-between` na rodicovi. ProfileSwitcher
          sa pri jedinom profile (bezny Free ucet) nevykresli vobec (vracia
          null), takze pri justify-between by ostal jediny flex-child a
          prehodil by sa na zaciatok riadku namiesto na koniec. */}
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:gap-3">
        <ProfileSwitcher
          profiles={profiles.map((x) => ({
            id: x.id,
            username: x.username,
            is_published: x.is_published,
          }))}
          currentId={current.id}
          canAddMore={profiles.length < plan.profiles}
          limit={plan.profiles}
        />

        <div className="flex w-full items-center gap-2 sm:ml-auto sm:w-auto">
          {current.is_published && (
            <form
              action={unpublishProfile.bind(null, current.id)}
              className="mr-auto sm:mr-0"
            >
              <button type="submit" className="btn-quiet">
                Unpublish
              </button>
            </form>
          )}
          <form
            action={publishProfile.bind(null, current.id)}
            className="ml-auto sm:ml-0"
          >
            <button
              type="submit"
              className={
                hasUnpublished
                  ? "btn-ink px-5 py-2.5 text-sm"
                  : "btn-line px-5 py-2.5 text-sm"
              }
            >
              {!current.is_published
                ? "Publish"
                : hasUnpublished
                  ? "Publish changes"
                  : "Published"}
            </button>
          </form>
        </div>
      </div>

      <div className="mt-6">
        <ShareCard
          username={current.username}
          isPublished={current.is_published}
        />
      </div>

      <div className="mt-8">
        <Editor
          key={current.id}
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
