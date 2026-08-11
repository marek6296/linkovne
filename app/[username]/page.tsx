import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createPublicClient } from "@/lib/supabase/public";
import { BlockList, ProfileHeader } from "@/components/blocks/render";
import { StealthContent } from "@/components/blocks/stealth-content";
import { ViewBeacon } from "@/components/view-beacon";
import { AgeGate } from "@/components/blocks/age-gate";
import { InAppBanner } from "@/components/blocks/inapp-banner";
import { InAppEscape } from "@/components/blocks/inapp-escape";
import { ProfileWidgets } from "@/components/blocks/profile-widgets";
import { ProfileDesktopBackdrop } from "@/components/profile/profile-desktop-backdrop";
import { ProfileShell } from "@/components/profile/profile-shell";
import { resolveTheme, type Design } from "@/lib/design";
import { BRAND_TITLE, SITE_URL, SITE_DOMAIN, stripAltPrefix } from "@/lib/site";
import { planOf } from "@/lib/plans";
import { designForPlan } from "@/lib/design-tiers";
import { isSocialCrawler } from "@/lib/crawlers";
import { headers } from "next/headers";
import { isVisibleNow, type Block } from "@/lib/blocks";

export const revalidate = 60;

const USERNAME_RE = /^[a-z0-9_.]{3,30}$/;

type Snapshot = {
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  theme: string | null;
  design: Design | null;
  blocks: Block[];
};

type PublicRow = {
  id: string;
  username: string;
  snapshot: Snapshot | null;
  seo_title: string | null;
  seo_description: string | null;
  is_indexable: boolean;
  age_gate: boolean;
  escape_inapp: boolean;
  hide_branding: boolean;
  creator_mode: boolean;
  plan: string;
};

/**
 * Verejna stranka cita ZVEREJNENY snapshot, nie zive riadky — takze rozrobeny
 * draft sa navstevnikovi nikdy nezobrazi.
 */
/** Bezpecne dekoduje segment adresy (rezervovane znaky ako @ $ + chodia z
 *  Next.js este %-zakodovane). Pri neplatnej sekvencii vrati original. */
function decodeSeg(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

async function getProfile(raw: string): Promise<PublicRow | null> {
  // Zdielaci prefix (@mia, -mia, ~mia …) vedie na to iste meno.
  const username = stripAltPrefix(decodeSeg(raw)).toLowerCase();
  if (!USERNAME_RE.test(username)) return null;

  const supabase = createPublicClient();
  const { data } = await supabase.rpc("public_profile", {
    p_username: username,
  });

  const row = Array.isArray(data) ? data[0] : null;
  return (row as PublicRow) ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const profile = await getProfile(username);
  if (!profile) return { title: { absolute: BRAND_TITLE } };

  const snap = profile.snapshot;
  const name = snap?.display_name ?? profile.username;

  // Stealth (Creator mode): metadata sa ocistia — ziadne bio ani seo texty do
  // preview/title (mohli by obsahovat nazov platformy / adult keywords) a vzdy
  // noindex. Crawler/link-preview tak nevidi nic, co by profil oznacilo.
  const stealth = profile.creator_mode && planOf(profile.plan).creatorMode;

  const title = stealth
    ? name
    : profile.seo_title || `${name} — ${BRAND_TITLE}`;
  const description = stealth
    ? "Links"
    : profile.seo_description || snap?.bio || `Links — ${profile.username}`;

  // Alias adresy (@mia, -mia …) su len zdielacie varianty — kanonicka je vzdy
  // /mia, alias sa neindexuje (nech nevznikne duplicitny obsah), ale odkazy
  // sa nasleduju.
  const decoded = decodeSeg(username);
  const isAlias =
    stripAltPrefix(decoded).toLowerCase() !== decoded.toLowerCase();

  return {
    // absolute — title uz brand obsahuje, layout template by ho zdvojil
    title: { absolute: title },
    description,
    // Jedna kanonicka adresa aj pre pristup cez custom domenu (ziadny
    // duplicitny obsah medzi linkovne.com/user a vlastnou domenou).
    alternates: { canonical: `/${profile.username}` },
    // Stealth aj neindexovatelne aj alias → noindex. Inak default.
    robots:
      stealth || !profile.is_indexable
        ? { index: false, follow: false, nocache: true }
        : isAlias
          ? { index: false, follow: true }
          : undefined,
    // OG obrazok dodava app/[username]/opengraph-image.tsx (brandovana karta).
    openGraph: {
      title,
      description,
      type: "profile",
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const profile = await getProfile(username);
  if (!profile || !profile.snapshot) notFound();

  const snap = profile.snapshot;
  const plan = planOf(profile.plan);

  // Dizajn sa ocisti podla planu — free ma zakladnu customizaciu, premium
  // polia (obrazkove pozadie, animacie, glass buttony, avatar ramy, desktop
  // backdrop) sa po downgrade ignoruju.
  const theme = resolveTheme(snap.theme, designForPlan(snap.design, plan));

  // Naplanovane bloky sa filtruju az pri renderi (ISR 60 s = dost jemne)
  const blockList = (snap.blocks ?? []).filter(isVisibleNow);

  // Creator / Stealth mode — ochranna vrstva pre tvorcov (Pro+): cistá stránka
  // pre crawlery, cloak bia/blokov (client-side) a neutrálne metadata. Escape
  // a Link Shield si riadia vlastné prepínače, Creator mode ich NEvynucuje.
  const stealth = profile.creator_mode === true && plan.creatorMode;

  // Real-time crawler detekcia: ak stealth profil navstivi znamy platform bot
  // / link-preview crawler, servneme mu „compliant" cistu stranku — len meno,
  // ziadna fotka, bio ani linky. Nema co oznacit; realny clovek vidi profil
  // normalne (obsah sa doťahuje client-side).
  if (stealth) {
    const ua = (await headers()).get("user-agent");
    if (isSocialCrawler(ua)) {
      const cleanName = snap.display_name || profile.username;
      return (
        <div className="profile-stage">
          <main
            className="profile-card"
            style={{ background: "#faf9f6", color: "#191813" }}
          >
            <div className="profile-content profile-content--centered">
              <div className="reveal">
                <h1 className="profile-name">{cleanName}</h1>
                <p className="mt-2 text-sm opacity-70">Welcome to my page.</p>
              </div>
            </div>
          </main>
        </div>
      );
    }
  }

  // Externe otvorenie riadi VYLUCNE „Open externally" (escape_inapp) — nezavisle
  // od Creator mode a Link Shield. Ked je vypnute, stranka sa ukaze aj v in-app
  // prehliadaci (napr. Instagram); ked je zapnute, vyskoci do realneho
  // prehliadaca. Creator mode teda escape NEvynucuje.
  const escapeEnabled = profile.escape_inapp === true && plan.escapeInApp;

  // „Powered by Linkovne" + marketing button — free vzdy, Pro+ len ked si
  // branding nevypol (plan.hideBranding = smie skryt, hide_branding = vypnute).
  const brandingVisible = !(plan.hideBranding && profile.hide_branding);
  const displayName = snap.display_name || profile.username;
  const profileLayout = theme.profileLayout ?? "centered";

  return (
    <div className="profile-stage">
      <ProfileDesktopBackdrop theme={theme} />

      {/* Karta profilu. Mobile: cela obrazovka. Desktop: vysoky telefonovy tvar
          — vycentrovany, zaobleny, s tienom. In-app escape gate ide cez
          `leading`, aby bol vzdy uplne prvy v <main> a nevznikol flash. */}
      <ProfileShell
        theme={theme}
        showBranding={brandingVisible}
        brandingHref={SITE_URL}
        leading={escapeEnabled ? <InAppEscape /> : undefined}
      >
      <ViewBeacon profileId={profile.id} />
      {profile.age_gate && (
        <AgeGate username={profile.username} theme={theme} />
      )}

      {/* Plavajuce prvky — share (vpravo) + marketing (vlavo, len ak branding). */}
      <ProfileWidgets
        name={displayName}
        username={profile.username}
        avatarUrl={snap.avatar_url}
        siteUrl={SITE_URL}
        siteDomain={SITE_DOMAIN}
        showPromo={brandingVisible}
        theme={theme}
      />

      {/* Jemny banner (in-app) — LEN ked tvorca escape zapol, ale nema tvrdy
          gate (napr. free plan). Ked je moznost vypnuta, nezobrazi sa NIC. */}
      {profile.escape_inapp === true && !escapeEnabled && (
        <div className="relative z-10 w-full max-w-[26rem]">
          <InAppBanner theme={theme} auto={false} />
        </div>
      )}

      {/* Obsah je v hornej casti (profil „ide od hora"), linky sa pridavaju pod
          neho. „Powered by" ostava dole cez mt-auto na footeri. */}
      <div
        className={`profile-content profile-content--${profileLayout}`}
      >
        <div className="reveal">
          {stealth ? (
            // Bio + bloky nie sú v SSR. Klient potom vykreslí celú hlavičku
            // znovu tým istým komponentom ako editor, takže bio ostane v
            // správnom template layoute namiesto pridania pod hotovú hlavičku.
            <StealthContent
              username={profile.username}
              profileId={profile.id}
              displayName={snap.display_name}
              avatarUrl={snap.avatar_url}
              initialTheme={theme}
            />
          ) : (
            <>
              <ProfileHeader
                displayName={snap.display_name}
                username={profile.username}
                bio={snap.bio}
                avatarUrl={snap.avatar_url}
                theme={theme}
              />
              <div className="profile-links">
                <BlockList
                  blocks={blockList}
                  theme={theme}
                  profileId={profile.id}
                />
              </div>

              {blockList.length === 0 && (
                <p
                  className="mt-9 text-center text-sm"
                  style={{ color: theme.muted }}
                >
                  No links here yet.
                </p>
              )}
            </>
          )}
        </div>
      </div>

      </ProfileShell>
    </div>
  );
}
