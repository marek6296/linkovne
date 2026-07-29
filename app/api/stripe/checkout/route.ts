import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  createSubscriptionCheckout,
  findPromotionCode,
} from "@/lib/checkout";

/**
 * Spusti Stripe Checkout pre predplatne (Pro/Business). Kym nie su nastavene
 * kluce a Price ID, vrati 503 — landing/dashboard sa spravaju ako predtym.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  let body: { plan?: string; promo?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }

  const plan = body.plan === "business" ? "business" : "pro";

  const { data: account } = await supabase
    .from("accounts")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .maybeSingle();

  // Promo kod z linku (?promo=KOD) — ak sedi na aktivny promotion code, zlavu
  // predvyplnime. Inak necha zakaznika zadat kod rucne v checkoute.
  const promotionCodeId = body.promo
    ? await findPromotionCode(body.promo)
    : null;

  const result = await createSubscriptionCheckout({
    userId: user.id,
    email: user.email,
    stripeCustomerId: account?.stripe_customer_id,
    plan,
    promotionCodeId,
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json({ url: result.url });
}
