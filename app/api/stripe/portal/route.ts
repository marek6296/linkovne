import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";
import { SITE_URL } from "@/lib/site";

/**
 * Stripe Customer Portal — sprava predplatneho (zrusenie, zmena karty,
 * faktury). Vyzaduje existujuceho Stripe zakaznika (t.j. aspon jeden nakup).
 * Pozn.: portal treba jednorazovo zapnut v Stripe Dashboarde
 * (Settings → Billing → Customer portal), inak API vrati chybu.
 */
export async function POST() {
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

  const { data: account } = await supabase
    .from("accounts")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!account?.stripe_customer_id) {
    return NextResponse.json(
      { error: "No billing account yet." },
      { status: 400 },
    );
  }

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: account.stripe_customer_id,
      return_url: `${SITE_URL}/dashboard/settings`,
    });
    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("[stripe/portal]", e);
    return NextResponse.json(
      { error: "Couldn't open billing. Try again." },
      { status: 500 },
    );
  }
}
