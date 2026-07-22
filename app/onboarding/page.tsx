import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { Wizard } from "@/components/onboarding/wizard";
import { getPromo } from "@/lib/promo";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Uz ma aspon jeden profil → rovno do dashboardu
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("owner_id", user.id)
    .limit(1);

  if (existing && existing.length > 0) redirect("/dashboard");

  const suggested =
    (user.user_metadata?.full_name as string | undefined) ?? "";

  // Aktivna promo akcia → znizena cena Pro v kroku 2 (marketing).
  const promo = await getPromo();
  const promoPrice = promo?.active ? promo.price : null;

  // Iba precitanie (Server Component cookies() nedokaze mazat) — samotne
  // uplatnenie robi Server Action claimPendingInvite z Wizardu, aby sme uz
  // vedeli hned pri prvom renderi preskocit krok 2 (Pro ponuka) pre niekoho,
  // kto Pro/Business uz dostane zadarmo z invite linku.
  const cookieStore = await cookies();
  const hasPendingInvite = !!cookieStore.get("invite")?.value;

  return (
    <Wizard
      suggestedName={suggested}
      promoPrice={promoPrice}
      hasPendingInvite={hasPendingInvite}
    />
  );
}
