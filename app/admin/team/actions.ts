"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Sprava admin tímu. Stránku síce chráni admin layout, ale server action sa dá
 * zavolať aj priamo — preto si TU overíme is_admin (obrana do hĺbky), a navyše
 * to isté kontroluje aj samotná RPC.
 */
export type TeamState = { error?: string; ok?: boolean } | undefined;

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const };
  const { data: isAdmin } = await supabase.rpc("is_admin");
  return { ok: isAdmin === true };
}

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export async function addAdmin(formData: FormData): Promise<TeamState> {
  const { ok } = await requireAdmin();
  if (!ok) return { error: "Not allowed." };

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  if (!EMAIL_RE.test(email)) {
    return { error: "Enter a valid email address." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_add_admin", { p_email: email });
  if (error) return { error: error.message };

  revalidatePath("/admin/team");
  return { ok: true };
}

export async function removeAdmin(email: string): Promise<TeamState> {
  const { ok } = await requireAdmin();
  if (!ok) return { error: "Not allowed." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_remove_admin", { p_email: email });
  if (error) {
    // RPC hlási ľudsky čitateľné dôvody (cannot remove yourself / last admin).
    return { error: error.message.replace(/^.*?:\s*/, "") || "Couldn't remove." };
  }

  revalidatePath("/admin/team");
  return { ok: true };
}
