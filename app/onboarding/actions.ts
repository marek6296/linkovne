"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { templateByKey, templateBlocks } from "@/lib/templates";
import { socialHref, type SocialPlatform } from "@/lib/blocks";
import type { RedeemGrant } from "@/app/dashboard/actions";

export type OnboardingResult = { error?: string; ok?: boolean };

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
  if (RESERVED.has(username)) {
    return { error: "That address is reserved. Try another one." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Ucet musi existovat skor ako profil
  const { error: accErr } = await supabase
    .from("accounts")
    .upsert({ id: user.id }, { onConflict: "id", ignoreDuplicates: true });
  if (accErr) return { error: "Couldn't set up your account." };

  const tpl = templateByKey(payload.template);

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
  if (code) {
    await supabase.rpc("redeem_invite", { p_code: code });
    if (fromCookie) cookieStore.delete("invite");
  }

  // Referral pozvanka (/i/<referral_code>) — naviaz pozvanku. Odmena pre toho,
  // kto pozval, padne az ked tento user zaplati (Stripe webhook).
  const ref = cookieStore.get("ref")?.value;
  if (ref) {
    await supabase.rpc("attach_referral", { p_code: ref });
    cookieStore.delete("ref");
  }

  revalidatePath("/", "layout");
  return { ok: true };
}
