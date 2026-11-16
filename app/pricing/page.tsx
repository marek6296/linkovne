import Link from "next/link";
import { LandingNav } from "@/components/landing/landing-interactive";
import { Pricing } from "@/components/pricing";
import { LandingFaq } from "@/components/landing-faq";
import { marketingMetadata, productGraph, jsonLd } from "@/lib/seo";
import { getPromo } from "@/lib/promo";
import "@/components/landing/landing.css";

export const revalidate = 30;
export const metadata = marketingMetadata("/pricing", "Pricing — Free, Pro & Business", "Compare Linkovne plans: start free, choose Pro at €4.99/month for 4 profiles, or Business at €14.99/month for 10 profiles and custom domains.");

export default async function PricingPage() {
  const promo = await getPromo();
  const promoOn = !!(promo?.active && promo.headline);
  return <div className="landing min-h-dvh pt-6">
    <LandingNav onLanding={false} />
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(productGraph) }} />
      <section className="landing-pricing landing-width">
        <h1 className="landing-section-title" style={{ fontSize: "clamp(40px,4.8vw,68px)", fontWeight: 750, letterSpacing: "-.045em", lineHeight: 1.04 }}>Simple pricing</h1>
        <p className="mx-auto mt-3 max-w-md text-center text-soft">Start with a free page. Choose more when you need it.</p>
        <Pricing proPromoPrice={promoOn ? promo!.price : null} />
        <p className="mx-auto mt-8 max-w-2xl text-center text-sm leading-7 text-soft">Prices are in EUR per month. Business includes custom domains; domain registration and renewal are separate. Profile limits refer to pages under one login, not separate team seats.</p>
      </section>
      <LandingFaq />
      <nav aria-label="Explore Linkovne" className="mx-auto flex max-w-5xl flex-wrap justify-center gap-6 px-6 py-12 text-sm underline"><Link href="/features">Explore features</Link><Link href="/guides">Creator guides</Link><Link href="/about">About Linkovne</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></nav>
    </main>
  </div>;
}
