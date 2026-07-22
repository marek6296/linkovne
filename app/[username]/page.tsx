import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createPublicClient } from "@/lib/supabase/public";
import { BlockList, ProfileHeader } from "@/components/blocks/render";
import { ViewBeacon } from "@/components/view-beacon";
import { AgeGate } from "@/components/blocks/age-gate";
import { InAppBanner } from "@/components/blocks/inapp-banner";
import { InAppEscape } from "@/components/blocks/inapp-escape";
import { ProfileWidgets } from "@/components/blocks/profile-widgets";
import { LogoMark } from "@/components/logo-mark";
import { resolveTheme, type Design } from "@/lib/design";
import { BRAND_TITLE, SITE_URL, SITE_DOMAIN, stripAltPrefix } from "@/lib/site";
import { planOf } from "@/lib/plans";
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
  const title = profile.seo_title || `${name} — ${BRAND_TITLE}`;
  const description =
    profile.seo_description || snap?.bio || `Links — ${profile.username}`;

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
    // Niektori klienti nechcu byt dohladatelni cez Google; alias vzdy noindex.
    robots:
      !profile.is_indexable
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

  // Vlastny dizajn je platena funkcia — po downgrade sa ignoruje aj tu
  const theme = resolveTheme(
    snap.theme,
    plan.customDesign ? snap.design : {},
  );

  // Naplanovane bloky sa filtruju az pri renderi (ISR 60 s = dost jemne)
  const blockList = (snap.blocks ?? []).filter(isVisibleNow);

  // Tvrdy escape z in-app prehliadaca (Pro+ funkcia). Ked je zapnuty, gate sa
  // renderuje uz na serveri a skryje obsah okamzite (bez bliknutia profilu).
  const escapeEnabled = profile.escape_inapp === true && plan.escapeInApp;

  // „Powered by Linkovne" + marketing button — free vzdy, Pro+ len ked si
  // branding nevypol (plan.hideBranding = smie skryt, hide_branding = vypnute).
  const brandingVisible = !(plan.hideBranding && profile.hide_branding);
  const displayName = snap.display_name || profile.username;

  return (
    <div className="relative min-h-dvh sm:flex sm:items-center sm:justify-center sm:p-8">
      {/* Pozadie za kartou na PC (desktop backdrop). Default „auto" = rozmazany
          glow z pozadia karty; da sa prebit farbou/gradientom/fotkou (Pro).
          Na mobile skryte — karta je cela obrazovka. */}
      <div
        aria-hidden
        className="fixed inset-0 z-0 hidden sm:block"
        style={{
          background: theme.deskBg ?? theme.page,
          ...(theme.deskBlur !== false
            ? { filter: "blur(64px) brightness(0.72)", transform: "scale(1.35)" }
            : null),
        }}
      />

      {/* Karta profilu. Mobile: cela obrazovka. Desktop: vysoky telefonovy tvar
          — vycentrovany, zaobleny, s tienom. */}
      <main
        className="relative z-10 flex min-h-dvh w-full flex-col items-center px-6 py-12 sm:min-h-[calc(100dvh-4rem)] sm:w-[27rem] sm:max-w-[27rem] sm:overflow-hidden sm:rounded-[2.5rem] sm:shadow-[0_30px_90px_-25px_rgba(0,0,0,0.55)] sm:ring-1 sm:ring-black/10"
        style={{
          background: theme.page,
          color: theme.text,
          fontFamily: theme.font,
        }}
      >
        {/* In-app escape gate — MUSI byt prvy v <main>, aby jeho inline skript
            bezal pred vykreslenim obsahu (ziadny flash). */}
        {escapeEnabled && <InAppEscape />}

      {/* Jemne dekorativne pozadie — dava profilu hlbku namiesto plochej farby */}
      {theme.glow && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: theme.glow }}
        />
      )}

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
      <div className="relative z-10 flex w-full max-w-[26rem] flex-col pt-[8vh] sm:pt-[7vh]">
        <div className="reveal">
          <ProfileHeader
            displayName={snap.display_name}
            username={profile.username}
            bio={snap.bio}
            avatarUrl={snap.avatar_url}
            theme={theme}
          />

          <div className="mt-9">
            <BlockList
              blocks={blockList}
              theme={theme}
              hrefFor={(b) => `/r/${b.id}`}
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
        </div>
      </div>

      {brandingVisible && (
        <footer className="relative z-10 mt-auto pt-8 pb-1">
          <a
            href={SITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[11px] tracking-wide opacity-70 transition hover:opacity-100"
            style={{ color: theme.muted }}
          >
            <LogoMark className="h-3.5 w-3.5" />
            <span>
              Powered by{" "}
              <span className="font-semibold" style={{ color: theme.text }}>
                {BRAND_TITLE}
              </span>
            </span>
          </a>
        </footer>
      )}
      </main>
    </div>
  );
}
