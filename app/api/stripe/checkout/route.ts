import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  createSubscriptionCheckout,
  findPromotion,
} from "@/lib/checkout";
import { stripeConfigured } from "@/lib/stripe";

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
  if (!stripeConfigured) {
    return NextResponse.json(
      { error: "Billing isn't switched on yet." },
      { status: 503 },
    );
  }

  const { data: account } = await supabase
    .from("accounts")
    .select("stripe_customer_id, plan")
    .eq("id", user.id)
    .maybeSingle();

  // Promo kod z pola „Have a promo code?" alebo z linku (?promo=KOD). Kody sa
  // zadavaju len u nas (v Stripe checkoute pole nie je), takze neplatny kod
  // musime ohlasit — inak by zakaznik nevedomky zaplatil plnu cenu.
  const promoRaw = typeof body.promo === "string" ? body.promo.trim() : "";
  const promo = promoRaw ? await findPromotion(promoRaw) : null;
  if (promoRaw && !promo) {
    return NextResponse.json(
      { error: "That code isn't valid or has expired." },
      { status: 400 },
    );
  }
  // Uz plateny plan → promo nesmie zalozit druhe predplatne.
  if (promo && (account?.plan === "pro" || account?.plan === "business")) {
    return NextResponse.json(
      { error: "You're already on a paid plan. Manage it in Settings → Billing." },
      { status: 400 },
    );
  }

  const result = await createSubscriptionCheckout({
    userId: user.id,
    email: user.email,
    stripeCustomerId: account?.stripe_customer_id,
    plan,
    promotionCodeId: promo?.id ?? null,
    trialDays: promo?.trialDays ?? null,
    firstTimeOnly: promo?.firstTimeOnly ?? false,
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json({ url: result.url });
}
