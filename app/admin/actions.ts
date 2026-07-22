"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Autorizaciu robi databaza: admin_set_plan je SECURITY DEFINER
// a sama overuje linkove.is_admin(). Tu ju len volame.
export type SetPlanState = { error?: string } | undefined;

export async function setPlan(
  targetId: string,
  formData: FormData,
): Promise<SetPlanState> {
  const plan = String(formData.get("plan") ?? "");
  if (!["free", "pro", "business", "admin"].includes(plan)) {
    return { error: "Invalid plan." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_plan", {
    target_id: targetId,
    new_plan: plan,
  });

  // DB odmietne zmenu superadmin uctu alebo grant/odobratie admina od
  // niekoho, kto nie je superadmin — chyba z RPC sa premietne do UI.
  if (error) return { error: error.message };

  revalidatePath("/admin");
  revalidatePath(`/admin/clients/${targetId}`);
}

/** Zmaze promokod / pozvanku. */
export async function deleteInvite(code: string) {
  const supabase = await createClient();
  await supabase.rpc("admin_delete_invite", { p_code: code });
  revalidatePath("/admin");
}

/** Ulozi promo akciu (banner + odpocet). */
export async function savePromo(formData: FormData) {
  const rawEnds = String(formData.get("ends_at") ?? "").trim();
  let endsIso: string | null = null;
  if (rawEnds) {
    const d = new Date(rawEnds);
    if (!Number.isNaN(d.getTime())) endsIso = d.toISOString();
  }

  const supabase = await createClient();
  await supabase.rpc("admin_set_promo", {
    p_active: formData.get("active") === "on",
    p_headline: String(formData.get("headline") ?? "").slice(0, 160),
    p_price: String(formData.get("price") ?? "").slice(0, 20),
    p_ends_at: endsIso,
  });

  revalidatePath("/admin");
  revalidatePath("/");
}

/**
 * Vytvori promokod / pozvanku. Da sa uplatnit ako link (/i/<code>) alebo
 * zadanim kodu v onboardingu. Grant: Pro alebo Business zadarmo na cas.
 */
export async function createInvite(formData: FormData) {
  const plan = String(formData.get("plan") ?? "pro");
  const duration = String(formData.get("duration") ?? "month");
  const months = duration === "month" ? 1 : duration === "year" ? 12 : null;

  const maxRaw = String(formData.get("max_uses") ?? "").trim();
  const maxUses = maxRaw ? Math.max(1, parseInt(maxRaw, 10) || 1) : null;

  const rawExpires = String(formData.get("expires_at") ?? "").trim();
  let expiresIso: string | null = null;
  if (rawExpires) {
    const d = new Date(rawExpires);
    if (!Number.isNaN(d.getTime())) expiresIso = d.toISOString();
  }

  const supabase = await createClient();
  await supabase.rpc("admin_create_invite", {
    p_plan: plan === "business" ? "business" : "pro",
    p_months: months,
    p_max_uses: maxUses,
    p_note: String(formData.get("note") ?? "").slice(0, 120),
    p_expires_at: expiresIso,
  });

  revalidatePath("/admin");
}
