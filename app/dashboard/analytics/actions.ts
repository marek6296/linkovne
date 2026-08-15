"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Vymaze VSETKY analytiky jedneho profilu (navstevy + kliky na jeho bloky).
 * Ownership overuje RPC `clear_analytics` na serveri (SECURITY DEFINER), takze
 * cudzí profil sa premazať nedá ani podvrhnutým profileId.
 */
export async function clearAnalytics(formData: FormData) {
  const profileId = String(formData.get("profileId") ?? "");
  if (!UUID_RE.test(profileId)) redirect("/dashboard/analytics");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.rpc("clear_analytics", {
    p_profile_id: profileId,
  });

  revalidatePath("/dashboard/analytics");
  redirect(
    `/dashboard/analytics?p=${profileId}&cleared=${error ? "err" : "1"}`,
  );
}
