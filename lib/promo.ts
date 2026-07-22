import { createPublicClient } from "@/lib/supabase/public";

export type Promo = {
  active: boolean;
  headline: string | null;
  price: string | null;
  ends_at: string | null;
};

/**
 * Aktualna promo akcia (jeden riadok). Ked je ends_at v minulosti, povazujeme
 * ju za neaktivnu — nech odpocet neskonci v zapornych cislach.
 */
export async function getPromo(): Promise<Promo | null> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("promo")
    .select("active, headline, price, ends_at")
    .eq("id", 1)
    .maybeSingle();

  if (!data) return null;
  const p = data as Promo;
  if (p.ends_at && new Date(p.ends_at).getTime() < Date.now()) {
    return { ...p, active: false };
  }
  return p;
}
