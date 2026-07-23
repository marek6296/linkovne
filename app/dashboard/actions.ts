"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { planOf, allowsBlock, allowsTheme } from "@/lib/plans";
import type { Block, BlockType } from "@/lib/blocks";
import type { Design } from "@/lib/design";
import type { BrandKit } from "@/lib/editor-pro";

export type ActionState = { error?: string } | undefined;

const VALID_TYPES: BlockType[] = [
  "link",
  "headline",
  "text",
  "image",
  "video",
  "socials",
  "faq",
  "countdown",
  "divider",
  "tip",
  "form",
];

const USERNAME_RE = /^[a-z0-9_.]{3,30}$/;

const RESERVED = new Set([
  "login",
  "register",
  "dashboard",
  "onboarding",
  "auth",
  "api",
  "admin",
  "settings",
  "support",
  "linkove",
  "linkovne",
  "www",
]);

/** Prevadzkovatel (admin) smie obsadit aj rezervovane brandove mena. */
async function isAdmin(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<boolean> {
  const { data } = await supabase.rpc("is_admin");
  return data === true;
}

/**
 * Profil uz nie je 1:1 s uctom, takze kazda akcia musi overit, ze dany profil
 * naozaj patri prihlasenemu uctu. RLS to drzi aj na urovni DB, toto je druha
 * vrstva a zaroven zdroj zrozumitelnej chyby.
 */
async function requireProfile(profileId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, owner_id")
    .eq("id", profileId)
    .maybeSingle();

  if (!profile || profile.owner_id !== user.id) redirect("/dashboard");

  const { data: account } = await supabase
    .from("accounts")
    .select("plan")
    .eq("id", user.id)
    .maybeSingle();

  return { supabase, user, plan: planOf(account?.plan) };
}

export type RedeemGrant = {
  plan: "pro" | "business" | "admin";
  months: number | null;
  expiresAt: string | null;
};

export type RedeemState =
  | { error?: string; ok?: string; granted?: RedeemGrant }
  | undefined;

/** Existujuci user zada promokod v nastaveniach → uplatni grant (Pro/Business). */
export async function redeemCode(
  _prev: RedeemState,
  formData: FormData,
): Promise<RedeemState> {
  const code = String(formData.get("code") ?? "").trim().toLowerCase();
  if (!code) return { error: "Enter a code." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: result } = await supabase.rpc("redeem_invite", {
    p_code: code,
  });
  const r = result as {
    status?: string;
    plan?: string;
    months?: number | null;
    expires_at?: string | null;
  } | null;

  const messages: Record<string, string> = {
    invalid: "That code isn't valid.",
    expired: "That code has expired.",
    used: "That code has been used up.",
    already_used: "You've already redeemed this code.",
    noauth: "Please log in and try again.",
  };
  if (r?.status !== "ok") {
    return { error: messages[r?.status ?? ""] ?? "Couldn't apply that code." };
  }

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
  return {
    ok: "Code applied — your plan is unlocked. Enjoy!",
    granted: {
      plan: r.plan as RedeemGrant["plan"],
      months: r.months ?? null,
      expiresAt: r.expires_at ?? null,
    },
  };
}

export async function saveBlocks(
  profileId: string,
  blocks: Block[],
): Promise<ActionState> {
  const { supabase, plan } = await requireProfile(profileId);

  if (plan.maxBlocks !== null && blocks.length > plan.maxBlocks) {
    return { error: `Your plan is limited to ${plan.maxBlocks} blocks.` };
  }

  const blocked = blocks.find((b) => !allowsBlock(plan, b.type));
  if (blocked) {
    return { error: `The ${blocked.type} block needs a paid plan.` };
  }

  const rows = blocks
    .filter((b) => VALID_TYPES.includes(b.type))
    .map((b, i) => {
      let config = b.config ?? {};
      // VIP zamok je platena funkcia — bez planu ho zo zapisu odstranime, nech
      // sa neda obist cez upraveny klientsky request.
      if (!plan.vipLinks && config && "lockCode" in config) {
        const { lockCode: _drop, ...rest } = config;
        config = rest;
      }
      return {
        id: b.id,
        profile_id: profileId,
        type: b.type,
        config,
        position: i,
        is_active: b.is_active,
        starts_at: b.starts_at || null,
        ends_at: b.ends_at || null,
        updated_at: new Date().toISOString(),
      };
    });

  if (rows.length > 0) {
    const { error } = await supabase.from("blocks").upsert(rows);
    if (error) return { error: "Couldn't save your changes." };
  }

  revalidatePath("/dashboard");
  return undefined;
}

export async function deleteBlock(
  profileId: string,
  id: string,
): Promise<ActionState> {
  const { supabase } = await requireProfile(profileId);
  const { error } = await supabase
    .from("blocks")
    .delete()
    .eq("id", id)
    .eq("profile_id", profileId);
  if (error) return { error: "Couldn't delete that block." };
  revalidatePath("/dashboard");
  return undefined;
}

/** Remove only the explicit block IDs that disappeared during Undo/Redo. */
export async function deleteBlocks(
  profileId: string,
  ids: string[],
): Promise<ActionState> {
  const { supabase } = await requireProfile(profileId);
  const uniqueIds = [...new Set(ids)].filter(Boolean);
  if (uniqueIds.length === 0) return undefined;
  const { error } = await supabase
    .from("blocks")
    .delete()
    .eq("profile_id", profileId)
    .in("id", uniqueIds);
  if (error) return { error: "Couldn't synchronize Undo/Redo." };
  revalidatePath("/dashboard");
  return undefined;
}

export async function saveProfile(
  profileId: string,
  patch: {
    display_name?: string;
    bio?: string;
    avatar_url?: string | null;
    theme?: string;
    design?: Design;
    seo_title?: string;
    seo_description?: string;
  },
): Promise<ActionState> {
  const { supabase, plan } = await requireProfile(profileId);

  const clean: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (patch.display_name !== undefined)
    clean.display_name = patch.display_name.slice(0, 60);
  if (patch.bio !== undefined) clean.bio = patch.bio.slice(0, 300);
  if (patch.avatar_url !== undefined) clean.avatar_url = patch.avatar_url;
  if (patch.seo_title !== undefined)
    clean.seo_title = patch.seo_title.slice(0, 70);
  if (patch.seo_description !== undefined)
    clean.seo_description = patch.seo_description.slice(0, 160);

  if (patch.theme !== undefined) {
    if (!allowsTheme(plan, patch.theme)) {
      return { error: "That theme needs a paid plan." };
    }
    clean.theme = patch.theme;
  }

  if (patch.design !== undefined) {
    if (!plan.customDesign) {
      return { error: "Custom design needs a paid plan." };
    }
    clean.design = patch.design;
  }

  const { error } = await supabase
    .from("profiles")
    .update(clean)
    .eq("id", profileId);

  if (error) return { error: "Couldn't save your profile." };

  revalidatePath("/dashboard");
  return undefined;
}

/**
 * Link Shield — prepnutie 18+ gateway ochrany. Plati okamzite (necaka na
 * publish), preto samostatna akcia mimo debounced autosave. Len plateny plan.
 */
export async function setLinkShield(
  profileId: string,
  enabled: boolean,
): Promise<ActionState> {
  const { supabase, plan } = await requireProfile(profileId);

  if (!plan.linkShield) {
    return { error: "Link Shield needs a paid plan." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ link_shield: enabled, updated_at: new Date().toISOString() })
    .eq("id", profileId);

  if (error) return { error: "Couldn't update Link Shield." };

  revalidatePath("/dashboard");
  return undefined;
}

/**
 * Auto-escape z in-app prehliadaca — prepinac. Plati okamzite, len plateny plan.
 */
export async function setEscapeInApp(
  profileId: string,
  enabled: boolean,
): Promise<ActionState> {
  const { supabase, plan } = await requireProfile(profileId);

  if (!plan.escapeInApp) {
    return { error: "This needs a paid plan." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ escape_inapp: enabled, updated_at: new Date().toISOString() })
    .eq("id", profileId);

  if (error) return { error: "Couldn't update the setting." };

  revalidatePath("/dashboard");
  return undefined;
}

/**
 * „Powered by Linkovne" watermark — Pro+ si ho moze vypnut. Free nie (plan
 * gate). Cita sa zo zivého riadku profilu, takze staci ISR revalidate.
 */
export async function setHideBranding(
  profileId: string,
  enabled: boolean,
): Promise<ActionState> {
  const { supabase, plan } = await requireProfile(profileId);

  if (!plan.hideBranding) {
    return { error: "Removing linkovne branding needs a paid plan." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ hide_branding: enabled, updated_at: new Date().toISOString() })
    .eq("id", profileId);

  if (error) return { error: "Couldn't update the setting." };

  revalidatePath("/dashboard/settings");
  revalidatePath("/[username]", "page");
  return undefined;
}

/**
 * Publikovanie ide cez SECURITY DEFINER funkciu, ktora si snapshot postavi
 * sama zo zivych riadkov — z klienta sa teda neda podvrhnut obsah, ktory
 * nepresiel cez limity planu.
 */
export async function publishProfile(profileId: string) {
  const { supabase } = await requireProfile(profileId);
  await supabase.rpc("publish_profile", { p_profile_id: profileId });
  revalidatePath("/dashboard");
  revalidatePath("/[username]", "page");
}

export async function unpublishProfile(profileId: string) {
  const { supabase } = await requireProfile(profileId);
  await supabase.rpc("unpublish_profile", { p_profile_id: profileId });
  revalidatePath("/dashboard");
  revalidatePath("/[username]", "page");
}

export async function saveSeo(
  profileId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase } = await requireProfile(profileId);

  const { error } = await supabase
    .from("profiles")
    .update({
      seo_title: String(formData.get("seo_title") ?? "").slice(0, 70),
      seo_description: String(formData.get("seo_description") ?? "").slice(
        0,
        160,
      ),
      is_indexable: formData.get("is_indexable") === "on",
      age_gate: formData.get("age_gate") === "on",
      updated_at: new Date().toISOString(),
    })
    .eq("id", profileId);

  if (error) return { error: "Couldn't save." };
  revalidatePath("/dashboard/settings");
  return undefined;
}

export async function createProfile(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const username = String(formData.get("username") ?? "")
    .trim()
    .toLowerCase();

  if (!USERNAME_RE.test(username)) {
    return { error: "Use 3–30 characters: lowercase letters, numbers, . or _" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Rezervovane mena (brand, systemove cesty) su chranene pred verejnostou,
  // ale prevadzkovatel si svoje znacky moze obsadit.
  if (RESERVED.has(username) && !(await isAdmin(supabase))) {
    return { error: "That address is reserved. Try another one." };
  }

  const { error } = await supabase
    .from("profiles")
    .insert({ owner_id: user.id, username, display_name: username });

  if (error) {
    if (error.code === "23505") return { error: "That address is taken." };
    // Limit stražia aj DB triggerom, nielen UI
    if (error.message?.includes("profile_limit_reached")) {
      return { error: "You've reached the page limit for your plan." };
    }
    // Nezamaskovat neznamu chybu — nech je vidno v serverovych logoch.
    console.error("createProfile failed:", error);
    return { error: "Couldn't create the page." };
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function deleteProfile(profileId: string) {
  const { supabase } = await requireProfile(profileId);
  await supabase.from("profiles").delete().eq("id", profileId);
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

/** Server-authoritative snapshot. The client never supplies version contents. */
export async function createProfileVersion(profileId: string, reason: string): Promise<ActionState> {
  const { supabase, user, plan } = await requireProfile(profileId);
  if (plan.versionDays <= 0) return { error: "Version history needs Pro." };
  const [{ data: profile }, { data: blocks }] = await Promise.all([
    supabase.from("profiles").select("display_name,bio,avatar_url,theme,design").eq("id", profileId).single(),
    supabase.from("blocks").select("id,type,config,position,is_active,starts_at,ends_at").eq("profile_id", profileId).order("position"),
  ]);
  if (!profile) return { error: "Couldn't create a version." };
  const { error } = await supabase.from("profile_versions").insert({
    profile_id: profileId,
    owner_id: user.id,
    reason: reason.slice(0, 100) || "Manual version",
    snapshot: { profile, blocks: blocks ?? [] },
  });
  if (error) return { error: "Version history is not ready yet." };
  await supabase.from("profile_versions").delete().eq("owner_id", user.id).lt("created_at", new Date(Date.now() - plan.versionDays * 864e5).toISOString());
  revalidatePath("/dashboard");
  return undefined;
}

export async function restoreProfileVersion(profileId: string, versionId: string): Promise<ActionState> {
  const { supabase, plan } = await requireProfile(profileId);
  if (plan.versionDays <= 0) return { error: "Version history needs Pro." };
  const { data, error } = await supabase.rpc("restore_profile_version", { p_profile_id: profileId, p_version_id: versionId });
  if (error || data !== true) return { error: "Couldn't restore that version." };
  revalidatePath("/dashboard");
  revalidatePath("/[username]", "page");
  return undefined;
}

export async function saveCurrentTemplate(profileId: string, name: string, includeBlocks: boolean): Promise<ActionState> {
  const { supabase, user, plan } = await requireProfile(profileId);
  if (plan.savedTemplates <= 0) return { error: "Saved templates need Pro." };
  const { count } = await supabase.from("saved_templates").select("id", { count: "exact", head: true }).eq("owner_id", user.id);
  if ((count ?? 0) >= plan.savedTemplates) return { error: `Your plan includes ${plan.savedTemplates} saved templates.` };
  const [{ data: profile }, { data: blocks }] = await Promise.all([
    supabase.from("profiles").select("theme,design").eq("id", profileId).single(),
    includeBlocks ? supabase.from("blocks").select("id,type,config,position,is_active,starts_at,ends_at").eq("profile_id", profileId).order("position") : Promise.resolve({ data: null }),
  ]);
  if (!profile) return { error: "Couldn't save the template." };
  const { error } = await supabase.from("saved_templates").insert({ owner_id: user.id, name: name.trim().slice(0, 60) || "My template", theme: profile.theme, design: profile.design ?? {}, blocks: includeBlocks ? (blocks ?? []) : null, is_shared: plan.brandKit });
  if (error) return { error: "Saved templates are not ready yet." };
  revalidatePath("/dashboard");
  return undefined;
}

export async function deleteSavedTemplate(profileId: string, templateId: string): Promise<ActionState> {
  const { supabase, user } = await requireProfile(profileId);
  const { error } = await supabase.from("saved_templates").delete().eq("id", templateId).eq("owner_id", user.id);
  if (error) return { error: "Couldn't delete the template." };
  revalidatePath("/dashboard");
  return undefined;
}

export async function saveBrandKit(profileId: string, kit: BrandKit): Promise<ActionState> {
  const { supabase, user, plan } = await requireProfile(profileId);
  if (!plan.brandKit) return { error: "Brand Kit needs Business." };
  const { error } = await supabase.from("brand_kits").upsert({
    owner_id: user.id,
    name: kit.name.trim().slice(0, 60) || "Brand kit",
    logo_url: kit.logo_url,
    colors: kit.colors,
    font: kit.font,
    font_heading: kit.font_heading,
    button: kit.button,
    locked: kit.locked,
    updated_at: new Date().toISOString(),
  });
  if (error) return { error: "Brand Kit is not ready yet." };
  revalidatePath("/dashboard");
  return undefined;
}

export async function applyBrandKitToAllProfiles(profileId: string): Promise<ActionState> {
  const { supabase, user, plan } = await requireProfile(profileId);
  if (!plan.brandKit) return { error: "Brand Kit needs Business." };
  const { data: kit } = await supabase.from("brand_kits").select("colors,font,font_heading,button").eq("owner_id", user.id).maybeSingle();
  if (!kit) return { error: "Save your Brand Kit first." };
  const { data: profiles } = await supabase.from("profiles").select("id,design").eq("owner_id", user.id);
  for (const p of profiles ?? []) {
    await createProfileVersion(p.id, "Before Brand Kit");
    const colors = (kit.colors ?? {}) as BrandKit["colors"];
    await supabase.from("profiles").update({ design: { ...(p.design as Design ?? {}), bgColor: colors.page, textColor: colors.text, btnBg: colors.button, btnText: colors.buttonText, font: kit.font, fontHeading: kit.font_heading, ...(kit.button as Design) }, updated_at: new Date().toISOString() }).eq("id", p.id);
  }
  revalidatePath("/dashboard");
  return undefined;
}
