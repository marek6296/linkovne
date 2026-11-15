import { CreatorPortrait, CreatorSpotlight, CreatorGallery } from "@/components/landing/creator-experience";
import { AudienceGlobe } from "@/components/landing/audience-globe";
import "@/components/landing/landing.css";
import { LandingNav } from "@/components/landing/landing-interactive";
import { productGraph, jsonLd } from "@/lib/seo";
import { GUIDES } from "@/lib/guides";
import Link from "next/link";
import { Wordmark } from "@/components/wordmark";
import { Pricing } from "@/components/pricing";
import { PromoBar } from "@/components/promo-bar";
import { LandingFaq, FAQ_ITEMS } from "@/components/landing-faq";
import { COMPETITORS, COMPARE_SLUGS } from "@/lib/compare";
import { getPromo } from "@/lib/promo";
import { BRAND_TITLE, SITE_URL } from "@/lib/site";

export const revalidate = 30;

// Canonical len pre landing — NIE v layoute, kde by ho zdedili vsetky stranky.
export const metadata = {
  alternates: { canonical: "/" },
  verification: { other: { "msvalidate.01": "EDC69C2FB8CE5751F512F4EDE6BC13F1" } },
};

/**
 * Strukturovane data pre vyhladavace. FAQPage sa MUSI zhodovat
 * s viditelnym obsahom LandingFaq — preto zdielaju FAQ_ITEMS.
 * Ziadne vymyslene ratingy — Google penalizuje fake review markup.
 */
const JSON_LD = {
  ...productGraph,
  "@graph": [
    ...productGraph["@graph"],
    {
      "@type": "FAQPage",
      "@id": `${SITE_URL}/#faq`,
      mainEntity: FAQ_ITEMS.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  ],
};

export default async function Home() {
  const promo = await getPromo();
  const promoOn = !!(promo?.active && promo.headline);

  return (
    <div className="landing">
      <script
        type="application/ld+json"
        // Staticky objekt z nasho kodu (ziadne user data) — bezpecne.
        dangerouslySetInnerHTML={{ __html: jsonLd(JSON_LD) }}
      />
      {promoOn && <PromoBar headline={promo!.headline!} endsAt={promo!.ends_at} />}
      <div className="landing-hero-surface">
        <LandingNav />
        <section className="landing-hero landing-width">
          <div className="landing-hero-copy">
            <h1>One profile.<br />One link.<br /><span>All your sites.</span></h1>
            <p>Your links, your content, your style.<br className="landing-desktop-break" /> Bring it all together on a page that’s yours.</p>
            <Link href="/register" className="landing-button landing-button-blue">Create your free page <span aria-hidden>↗</span></Link>
          </div>
          <CreatorPortrait />
        </section>
      </div>
      <main>
        <CreatorSpotlight />
        <CreatorGallery />
        <section id="analytics" className="landing-feature landing-width">
          <div><h2>See what<br />gets the clicks.</h2><p>Find out where people discover you and what they open next. Views, clicks and traffic sources, together in one dashboard.</p><Link href="/register" className="landing-button landing-button-blue">Explore Linkovne <span aria-hidden>↗</span></Link></div>
          <AudienceGlobe />
        </section>
        <section id="domains" className="landing-domain-section"><div className="landing-feature landing-width"><div className="landing-domain-scene" aria-label="Example custom domain"><div className="landing-domain-card"><span className="landing-domain-dot" />emma.com<span aria-hidden>↗</span></div><div className="landing-domain-shadow" aria-hidden /></div><div><h2>Your name.<br />Your domain.</h2><p>Give your page its own address. Connect a domain you own with Business, and manage up to ten profiles from one account.</p><a href="#pricing" className="landing-button">Find your plan <span aria-hidden>↗</span></a></div></div></section>

        {/* ---------- Pricing ---------- */}
        <section
          id="pricing"
          className="landing-pricing landing-width"
        >
          <h2 className="landing-section-title">
            Simple pricing
          </h2>
          <p className="mx-auto mt-3 max-w-md text-center text-soft">
            Start with a free page. Choose more when you need it.
          </p>
          <Pricing proPromoPrice={promoOn ? promo!.price : null} />
        </section>

        {/* ---------- FAQ (viditelne odpovede + zhodne strukturovane data) ---------- */}
        <LandingFaq />

        <section className="mx-auto max-w-6xl px-6 py-16" aria-labelledby="guides-title">
          <h2 id="guides-title" className="mt-3 font-grotesk text-3xl font-extrabold">Build a better link-in-bio workflow</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {GUIDES.map((guide) => (
              <Link key={guide.slug} href={`/guides/${guide.slug}`} className="card p-6 transition hover:border-pink-400">
                <h3 className="text-lg font-bold text-ink">{guide.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-soft">{guide.description}</p>
                <span className="mt-5 inline-block text-sm font-medium text-pink-600">Read the guide →</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="landing-final"><h2>Your page starts here.</h2><Link href="/register" className="landing-button">Create your free page <span aria-hidden>↗</span></Link></section>
      </main>

      {/* ---------- Powered by (built-with strip) ---------- */}


      <footer className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-5 gap-y-3 px-6 py-8 text-sm text-faint">
        <Wordmark />
        <nav className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <Link href="/vs" className="transition hover:text-ink">Compare alternatives</Link>
          {COMPARE_SLUGS.map((slug) => (
            <Link
              key={slug}
              href={`/vs/${slug}`}
              className="transition hover:text-ink"
            >
              vs {COMPETITORS[slug].name}
            </Link>
          ))}
          <Link href="/guides" className="transition hover:text-ink">Creator guides</Link>
          <Link href="/about" className="transition hover:text-ink">About</Link>
          <Link href="/privacy" className="transition hover:text-ink">
            Privacy
          </Link>
          <Link href="/terms" className="transition hover:text-ink">
            Terms
          </Link>
          <a
            href="mailto:support@linkovne.com"
            className="transition hover:text-ink"
          >
            Report
          </a>
        </nav>
        <p className="ml-auto">
          © {new Date().getFullYear()} {BRAND_TITLE}
        </p>
      </footer>
    </div>
  );
}
