"use server";

import { createHash } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { templateByKey, templateBlocks } from "@/lib/templates";
import { socialHref, type SocialPlatform } from "@/lib/blocks";
import type { RedeemGrant } from "@/app/dashboard/actions";
import { findPromotion } from "@/lib/checkout";

export type OnboardingResult = {
  error?: string;
  ok?: boolean;
  conversionId?: string;
  /** Zadany kod je Stripe promo kod (napr. PRO2) → /redeem/<kod> = Checkout. */
  checkoutPath?: string;
};

/**
 * Uplatni invite kod z cookie (nastavenej v /i/<code> pred registraciou) HNED
 * na zaciatku onboardingu — nech krok 2 (Pro ponuka) uz nevidi clovek, ktory
 * Pro/Business dostane zadarmo. Cookie je jednorazova, mazeme ju vzdy, aj ked
 * redeem zlyha (neplatny/expirovany kod nema zmysel skusat znova).
 */
export async function claimPendingInvite(): Promise<RedeemGrant | null> {
  const cookieStore = await cookies();
  const code = cookieStore.get("invite")?.value;
  if (!code) return null;
  cookieStore.delete("invite");

  const supabase = await createClient();
  const { data: result } = await supabase.rpc("redeem_invite", {
    p_code: code,
  });
  const r = result as {
    status?: string;
    plan?: string;
    months?: number | null;
    expires_at?: string | null;
  } | null;
  if (r?.status !== "ok") return null;

  return {
    plan: r.plan as RedeemGrant["plan"],
    months: r.months ?? null,
    expiresAt: r.expires_at ?? null,
  };
}

const USERNAME_RE = /^[a-z0-9_.]{3,30}$/;

const RESERVED = new Set([
  "pricing", "features", "guides", "about", "robots.txt", "sitemap.xml", "llms.txt",
  "login", "register", "dashboard", "onboarding", "auth", "api",
  "admin", "settings", "support", "linkove", "linkovne", "www",
  "forgot", "reset",
]);

type Payload = {
  username: string;
  template: string;
  displayName?: string;
  bio?: string;
  // Odkazy, ktore user zadal vo wizarde: nazov + url
  links?: { title: string; url: string }[];
  socials?: { platform: SocialPlatform; url: string }[];
  // Promokod zadany v onboardingu (nepovinny)
  promoCode?: string;
};

/** Zvaliduje URL — do bloku nikdy nepustime nezmysel. */
function cleanUrl(raw: string): string {
  const v = (raw ?? "").trim();
  if (!v) return "";
  if (/^https?:\/\//i.test(v)) return v;
  if (/^[\w-]+\.\w/.test(v)) return `https://${v}`;
  return "";
}

export async function completeOnboarding(
  payload: Payload,
): Promise<OnboardingResult> {
  const username = String(payload.username ?? "").trim().toLowerCase();

  if (!USERNAME_RE.test(username)) {
    return { error: "Use 3–30 characters: lowercase letters, numbers, . or _" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Rezervovane brandove/systemove mena su chranene pred verejnostou, ale
  // prevadzkovatel (admin) si svoje znacky moze obsadit.
  if (RESERVED.has(username)) {
    const { data: admin } = await supabase.rpc("is_admin");
    if (admin !== true) {
      return { error: "That address is reserved. Try another one." };
    }
  }
  if (!user) redirect("/login");

  // A stale wizard must not turn each additional profile into a signup.
  const { count: existingProfiles, error: countError } = await supabase
    .from("profiles").select("id", { count: "exact", head: true }).eq("owner_id", user.id);
  const firstProfile = !countError && existingProfiles === 0;
  // Existing users predate acquisition measurement. Never label their recreated page a signup.
  const eligibleForSignup = firstProfile && !user.user_metadata?.linkovne_ads_onboarded
    && Date.parse(user.created_at) >= Date.parse("2026-11-15T23:00:00Z");

  // Ucet musi existovat skor ako profil
  const { error: accErr } = await supabase
    .from("accounts")
    .upsert({ id: user.id }, { onConflict: "id", ignoreDuplicates: true });
  if (accErr) return { error: "Couldn't set up your account." };

  // Onboarding is always the free starting point. Premium templates are
  // intentionally applied only from the dashboard, where customDesign is
  // checked against the active Pro/Business plan on both client and server.
  const requestedTpl = templateByKey(payload.template);
  const tpl =
    requestedTpl?.key === "paper" ? requestedTpl : templateByKey("paper");

  const { data: profile, error: profErr } = await supabase
    .from("profiles")
    .insert({
      owner_id: user.id,
      username,
      display_name:
        (payload.displayName ?? "").slice(0, 60) ||
        (user.user_metadata?.full_name as string | undefined) ||
        username,
      bio: (payload.bio ?? "").slice(0, 300),
      avatar_url: (user.user_metadata?.avatar_url as string | undefined) ?? null,
      theme: tpl?.theme ?? "classic",
      design: tpl?.design ?? {},
    })
    .select("id")
    .single();

  if (profErr || !profile) {
    if (profErr?.code === "23505")
      return { error: "This address is already taken." };
    console.error("completeOnboarding profile insert failed:", profErr);
    return { error: "Couldn't create your page. Try again." };
  }

  // Poskladame bloky: startovacie zo sablony, do ktorych vlozime zadane odkazy
  const userLinks = (payload.links ?? [])
    .map((l) => ({ title: (l.title ?? "").trim().slice(0, 80), url: cleanUrl(l.url) }))
    .filter((l) => l.title && l.url);

  const socialItems = (payload.socials ?? [])
    .filter((s) => (s.url ?? "").trim())
    .map((s) => ({ platform: s.platform, url: socialHref(s.platform, s.url) }));

  const rows: {
    profile_id: string;
    type: string;
    config: unknown;
    position: number;
    is_active: boolean;
  }[] = [];
  let pos = 0;

  for (const l of userLinks) {
    rows.push({
      profile_id: profile.id,
      type: "link",
      config: { title: l.title, url: l.url, featured: pos === 0 },
      position: pos++,
      is_active: true,
    });
  }

  // Ak user nezadal odkazy, dame aspon prazdne bloky zo sablony na inspiraciu
  if (userLinks.length === 0 && tpl) {
    for (const b of templateBlocks(tpl)) {
      rows.push({
        profile_id: profile.id,
        type: b.type,
        config: b.config,
        position: pos++,
        is_active: true,
      });
    }
  }

  if (socialItems.length > 0) {
    rows.push({
      profile_id: profile.id,
      type: "socials",
      config: { items: socialItems },
      position: pos++,
      is_active: true,
    });
  }

  if (rows.length > 0) {
    await supabase.from("blocks").insert(rows);
  }

  // Rovno zverejnime — user je "hotovy za 2 minuty"
  await supabase.rpc("publish_profile", { p_profile_id: profile.id });

  // Uplatni promokod: prednost ma zadany kod, inak kod z linku (/i/<code>).
  const cookieStore = await cookies();
  const typed = (payload.promoCode ?? "").trim().toLowerCase();
  const fromCookie = cookieStore.get("invite")?.value;
  const code = typed || fromCookie;
  let checkoutPath: string | undefined;
  if (code) {
    const { data: redeemed } = await supabase.rpc("redeem_invite", { p_code: code });
    if (fromCookie) cookieStore.delete("invite");
    // Nie je to nas invite kod → moze to byt Stripe promo kod z reklamy (PRO2).
    // Ten sa uplatni az v Stripe Checkoute (s kartou a pripadnym trialom).
    const invited = (redeemed as { status?: string } | null)?.status === "ok";
    if (!invited && typed) {
      const promo = await findPromotion(typed);
      if (promo) checkoutPath = `/redeem/${encodeURIComponent(promo.code)}`;
    }
  }

  // Referral pozvanka (/i/<referral_code>) — naviaz pozvanku. Odmena pre toho,
  // kto pozval, padne az ked tento user zaplati (Stripe webhook).
  const ref = cookieStore.get("ref")?.value;
  if (ref) {
    await supabase.rpc("attach_referral", { p_code: ref });
    cookieStore.delete("ref");
  }

  // Durable namespaced marker survives profile deletion. Failure must not block onboarding
  // or emit an unverifiable acquisition event; the stable transaction ID also covers races.
  let conversionId: string | undefined;
  if (eligibleForSignup) {
    const { error: markerError } = await supabase.auth.updateUser({
      data: { linkovne_ads_onboarded: true },
    });
    if (!markerError) conversionId = createHash("sha256").update(`linkovne:onboarding:${user.id}`).digest("hex");
  }
  revalidatePath("/", "layout");
  return { ok: true, conversionId, checkoutPath };
}
