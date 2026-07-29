import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  createSubscriptionCheckout,
  findPromotionCode,
} from "@/lib/checkout";
import { BRAND_TITLE } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `Claim your offer — ${BRAND_TITLE}`,
  robots: { index: false, follow: false },
};

const CODE_RE = /^[A-Z0-9]{3,40}$/;

/**
 * Promo link — /redeem/<CODE>. Prihlásený používateľ ide rovno na Stripe
 * Checkout s predvyplnenou zľavou (100% = zadarmo). Neprihlásený sa najprv
 * prihlási/zaregistruje a hneď po tom sa vráti sem a kód sa aktivuje.
 */
export default async function RedeemPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code: raw } = await params;
  const code = decodeURIComponent(raw).trim().toUpperCase();

  const invalid = !CODE_RE.test(code);
  const promotionCodeId = invalid ? null : await findPromotionCode(code);

  // Neplatný / expirovaný / vyčerpaný kód.
  if (!promotionCodeId) {
    return (
      <Shell title="This code isn’t available">
        <p className="mt-2 text-sm leading-relaxed text-soft">
          <code className="font-semibold">{code}</code> is invalid, expired, or
          fully used. Ask for a fresh link or code.
        </p>
        <Link href="/dashboard" className="btn-ink mt-6 inline-block px-5 py-2.5 text-sm">
          Go to dashboard
        </Link>
      </Shell>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Neprihlásený → prihlásenie/registrácia, s návratom späť sem.
  if (!user) {
    const next = `/redeem/${encodeURIComponent(code)}`;
    return (
      <Shell title="Claim your offer">
        <p className="mt-2 text-sm leading-relaxed text-soft">
          You&apos;ve got a valid code (
          <code className="font-semibold">{code}</code>). Log in or create a free
          account to activate it — it takes a moment.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={`/register?next=${encodeURIComponent(next)}`}
            className="btn-ink px-5 py-2.5 text-sm"
          >
            Create account &amp; claim
          </Link>
          <Link
            href={`/login?next=${encodeURIComponent(next)}`}
            className="rounded-full border border-line px-5 py-2.5 text-sm font-medium transition hover:border-ink"
          >
            Log in
          </Link>
        </div>
      </Shell>
    );
  }

  // Prihlásený → rovno Stripe Checkout s predvyplnenou zľavou.
  const { data: account } = await supabase
    .from("accounts")
    .select("stripe_customer_id, plan")
    .eq("id", user.id)
    .maybeSingle();

  // Uz plateny plan → nevytvarame druhe predplatne.
  if (account?.plan === "pro" || account?.plan === "business") {
    return (
      <Shell title="You’re already on a paid plan">
        <p className="mt-2 text-sm leading-relaxed text-soft">
          This code can&apos;t stack on an active subscription. Manage your plan
          in Billing.
        </p>
        <Link href="/dashboard/settings" className="btn-ink mt-6 inline-block px-5 py-2.5 text-sm">
          Go to Billing
        </Link>
      </Shell>
    );
  }

  const result = await createSubscriptionCheckout({
    userId: user.id,
    email: user.email,
    stripeCustomerId: account?.stripe_customer_id,
    plan: "pro",
    promotionCodeId,
    requirePromo: true,
  });

  if ("url" in result) redirect(result.url);

  return (
    <Shell title="Couldn’t start checkout">
      <p className="mt-2 text-sm leading-relaxed text-soft">{result.error}</p>
      <Link href="/dashboard" className="btn-ink mt-6 inline-block px-5 py-2.5 text-sm">
        Go to dashboard
      </Link>
    </Shell>
  );
}

function Shell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-16">
      <div className="rounded-2xl border border-line bg-surface p-7">
        <p className="text-xs font-semibold tracking-widest text-faint uppercase">
          {BRAND_TITLE}
        </p>
        <h1 className="mt-2 font-grotesk text-2xl font-bold tracking-tight">
          {title}
        </h1>
        {children}
      </div>
    </main>
  );
}
