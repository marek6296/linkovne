import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe, PLAN_PRICE } from "@/lib/stripe";
import { SITE_URL } from "@/lib/site";

/**
 * Spusti Stripe Checkout pre predplatne (Pro/Business). Kym nie su nastavene
 * kluce a Price ID, vrati 503 — landing/dashboard sa spravaju ako predtym.
 */
export async function POST(request: NextRequest) {
  if (!stripe) {
    return NextResponse.json(
      { error: "Billing isn't switched on yet." },
      { status: 503 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  let body: { plan?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }

  const plan = body.plan === "business" ? "business" : "pro";
  const price = PLAN_PRICE[plan];
  if (!price) {
    return NextResponse.json(
      { error: "That plan isn't available yet." },
      { status: 503 },
    );
  }

  // Ak uz mame Stripe zakaznika, pouzijeme ho (nevytvarame duplikat).
  const { data: account } = await supabase
    .from("accounts")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .maybeSingle();

  const baseParams = {
    mode: "subscription" as const,
    line_items: [{ price, quantity: 1 }],
    client_reference_id: user.id,
    allow_promotion_codes: true,
    success_url: `${SITE_URL}/dashboard?upgraded=1`,
    cancel_url: `${SITE_URL}/#pricing`,
    subscription_data: { metadata: { user_id: user.id, plan } },
    metadata: { user_id: user.id, plan },
  };

  let session;
  try {
    session = await stripe.checkout.sessions.create({
      ...baseParams,
      customer: account?.stripe_customer_id ?? undefined,
      customer_email: account?.stripe_customer_id ? undefined : user.email,
    });
  } catch (e) {
    // Ulozeny stripe_customer_id moze byt neplatny (napr. zakaznik z test modu
    // po prechode na live, alebo zmazany). Skusime este raz bez neho — Stripe
    // vtedy vytvori noveho zakaznika z emailu, aby checkout nikdy nepadol.
    const err = e as { code?: string; param?: string };
    const customerIssue =
      !!account?.stripe_customer_id &&
      (err?.code === "resource_missing" ||
        (err?.param ?? "").includes("customer"));
    if (!customerIssue) {
      console.error("stripe checkout error:", e);
      return NextResponse.json(
        { error: "Couldn't start checkout. Try again." },
        { status: 500 },
      );
    }
    session = await stripe.checkout.sessions.create({
      ...baseParams,
      customer_email: user.email,
    });
  }

  return NextResponse.json({ url: session.url });
}
