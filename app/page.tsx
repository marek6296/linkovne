import { productGraph, jsonLd } from "@/lib/seo";
import { GUIDES } from "@/lib/guides";
import { HeroShowcase } from "@/components/hero-showcase";
import Link from "next/link";
import { Wordmark } from "@/components/wordmark";
import { Logo } from "@/components/logo";
import { Pricing } from "@/components/pricing";
import { SquishyBg } from "@/components/squishy";
import { PromoBar } from "@/components/promo-bar";
import { TechStrip } from "@/components/tech-strip";
import { LandingFaq, FAQ_ITEMS } from "@/components/landing-faq";
import { COMPETITORS, COMPARE_SLUGS } from "@/lib/compare";
import { getPromo } from "@/lib/promo";
import { BRAND_TITLE, SITE_DOMAIN, SITE_URL } from "@/lib/site";

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
    <div className="min-h-dvh bg-[#f8f5f7]">
      <script
        type="application/ld+json"
        // Staticky objekt z nasho kodu (ziadne user data) — bezpecne.
        dangerouslySetInnerHTML={{ __html: jsonLd(JSON_LD) }}
      />
      {/* First screen — promo + header + hero vyplnia presne jeden viewport */}
      <div className="flex min-h-svh flex-col">
      {/* Announcement / promo bar — vypina/zapina sa v /admin (Promo banner → Active) */}
      {promoOn && <PromoBar headline={promo!.headline!} endsAt={promo!.ends_at} />}

      {/* Nav */}
      <header className="mx-auto grid w-full max-w-6xl grid-cols-2 items-center px-6 py-5 sm:grid-cols-3">
        <nav className="hidden items-center gap-6 text-sm sm:flex">
          <a href="#features" className="text-soft transition hover:text-ink">
            Features
          </a>
          <a href="#pricing" className="text-soft transition hover:text-ink">
            Pricing
          </a>
        </nav>
        <Link href="/" aria-label="linkovne — home" className="sm:text-center sm:justify-self-center">
          <Logo className="h-7 w-auto" />
        </Link>
        <nav className="flex items-center justify-end gap-1">
          <Link href="/login" className="btn-quiet">
            Log in
          </Link>
          <Link
            href="/register"
            className="gradient-button gradient-button--pink hidden items-center justify-center px-5 py-2.5 text-sm sm:inline-flex"
          >
            Create your page
          </Link>
        </nav>
      </header>

      {/* ---------- Hero ---------- */}
      <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center gap-4 px-6 py-4 sm:gap-8 sm:py-8 lg:grid lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:gap-12">
        <div className="order-2 lg:order-1 lg:-mt-4">
            <h1
              className="reveal font-grotesk text-[clamp(1.95rem,6vw,4.8rem)] leading-[1.02] font-extrabold tracking-tight"
              style={{ animationDelay: "60ms" }}
            >
              Your link in bio,
              <br />
              <span className="text-pink-500">fully yours.</span>
            </h1>

            {/* Popis ucelu appky — ZAMERNE bez `reveal` (fade), nech je vzdy
                plne viditelny aj pre Google OAuth verifikacny crawler, ktory
                moze robit screenshot pred dobehnutim animacie. */}
            <p className="mt-3 max-w-md text-[15px] leading-snug text-soft text-pretty sm:mt-4 sm:text-lg sm:leading-relaxed">
              linkovne is a link-in-bio page builder for models and creator
              agencies. Put your links on one page, track your traffic sources,
              and connect your own domain on Business.
            </p>

            <div
              className="reveal mt-5 flex flex-wrap items-center gap-x-5 gap-y-3 sm:mt-8"
              style={{ animationDelay: "220ms" }}
            >
              <Link
                href="/register"
                className="gradient-button gradient-button--dark gradient-button--blue inline-flex items-center gap-2 px-7 py-3.5 text-base"
              >
                Start here
              </Link>
            </div>
          </div>

        {/* Interactive profile showcase */}
        <div className="reveal order-1 lg:order-2" style={{ animationDelay: "160ms" }}>
          <HeroShowcase />
        </div>
      </section>
      </div>

      <main>
        {/* ---------- Features (bento) ---------- */}
        <section
          id="features"
          className="mx-auto flex min-h-svh max-w-6xl flex-col justify-center px-6 py-16"
        >
          <p className="text-center font-mono text-sm font-bold tracking-wide text-pink-500 uppercase">
            Why linkovne
          </p>
          <h2 className="mt-3 text-center font-grotesk text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">
            Built on what others fix too late
          </h2>

          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {/* Domain — wide dark */}
            <div className="sq-card group relative flex min-h-[15rem] flex-col justify-between overflow-hidden rounded-2xl bg-neutral-900 p-7 text-white shadow-lg lg:col-span-2">
              <div className="relative z-10">
                <span className="font-mono text-xs font-bold tracking-wide text-white/70 uppercase">
                  Domains
                </span>
                <h3 className="mt-3 max-w-md font-grotesk text-2xl font-bold">
                  An address that&apos;s truly yours
                </h3>
                <p className="mt-2 max-w-md text-[15px] leading-relaxed text-white/80">
                  Put your page on your own custom domain instead of a link you
                  share with thousands of strangers — more professional, and
                  yours to keep.
                </p>
              </div>
              <div className="relative z-10 mt-6 w-fit rounded-lg bg-white/10 px-4 py-2 font-mono text-sm text-white ring-1 ring-white/15">
                {SITE_DOMAIN}/<span className="text-pink-400">you</span>
              </div>
              <SquishyBg id={1} />
            </div>

            {/* Link Shield — indigo */}
            <div className="sq-card group relative flex min-h-[15rem] flex-col justify-between overflow-hidden rounded-2xl bg-indigo-500 p-7 text-white shadow-lg">
              <div className="relative z-10">
                <span className="font-mono text-xs font-bold tracking-wide text-white/70 uppercase">
                  Protection
                </span>
                <h3 className="mt-3 font-grotesk text-2xl font-bold">
                  Private links, gated
                </h3>
                <p className="mt-2 text-[15px] leading-relaxed text-white/85">
                  Add a quick confirmation step before your sensitive links —
                  they stay off your public page until a visitor chooses to
                  continue.
                </p>
              </div>
              <span className="relative z-10 mt-6 text-3xl">🔒</span>
              <SquishyBg id={2} />
            </div>

            {/* Escape — pink */}
            <div className="sq-card group relative flex min-h-[15rem] flex-col justify-between overflow-hidden rounded-2xl bg-pink-500 p-7 text-white shadow-lg">
              <div className="relative z-10">
                <span className="font-mono text-xs font-bold tracking-wide text-white/70 uppercase">
                  Delivery
                </span>
                <h3 className="mt-3 font-grotesk text-2xl font-bold">
                  Out of the app browser
                </h3>
                <p className="mt-2 text-[15px] leading-relaxed text-white/85">
                  Help visitors continue in Safari or Chrome when an in-app
                  browser gets in the way. Availability depends on their device
                  and app settings.
                </p>
              </div>
              <span className="relative z-10 mt-6 text-3xl">↗</span>
              <SquishyBg id={3} />
            </div>

            {/* Analytics — white */}
            <div className="card flex min-h-[15rem] flex-col justify-between p-7">
              <div>
                <span className="font-mono text-xs font-bold tracking-wide text-indigo-500 uppercase">
                  Insights
                </span>
                <h3 className="mt-3 font-grotesk text-2xl font-bold text-ink">
                  Analytics, no spying
                </h3>
                <p className="mt-2 text-[15px] leading-relaxed text-soft">
                  Clicks and countries counted on our own servers. No cookies,
                  no Meta pixels.
                </p>
              </div>
              <div className="mt-6 flex h-14 items-end gap-1.5">
                {[40, 70, 55, 90, 65, 100, 80].map((h, i) => (
                  <span
                    key={i}
                    className="flex-1 rounded-t bg-ink/85"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
            </div>

            {/* AI — white */}
            <div className="card flex min-h-[15rem] flex-col justify-between p-7">
              <div>
                <span className="font-mono text-xs font-bold tracking-wide text-pink-500 uppercase">
                  Speed
                </span>
                <h3 className="mt-3 font-grotesk text-2xl font-bold text-ink">
                  Describe it. Get a page.
                </h3>
                <p className="mt-2 text-[15px] leading-relaxed text-soft">
                  The AI builder writes your bio, picks a look and lays out your
                  links in seconds.
                </p>
              </div>
              <div className="mt-6 flex flex-wrap gap-2 font-mono text-xs">
                {["AI builder", "Import", "VIP links", "QR"].map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-line px-3 py-1 text-soft"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ---------- Pricing ---------- */}
        <section
          id="pricing"
          className="mx-auto flex min-h-svh max-w-6xl flex-col justify-center px-6 py-16"
        >
          <h2 className="text-center font-mono text-3xl font-bold tracking-tight uppercase sm:text-4xl">
            Simple pricing
          </h2>
          <p className="mx-auto mt-3 max-w-md text-center text-soft">
            Start free. Pay when it starts paying you.
          </p>
          <Pricing proPromoPrice={promoOn ? promo!.price : null} />
        </section>

        {/* ---------- FAQ (viditelne odpovede + zhodne strukturovane data) ---------- */}
        <LandingFaq />

        <section className="mx-auto max-w-6xl px-6 py-16" aria-labelledby="guides-title">
          <p className="font-mono text-sm font-bold tracking-wide text-pink-500 uppercase">For creators &amp; agencies</p>
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

        {/* ---------- CTA ---------- */}
        <section className="mx-auto flex min-h-svh max-w-6xl items-center px-6 py-16">
          <div className="relative w-full overflow-hidden rounded-[2rem] bg-pink-500 px-6 py-20 text-center text-white">
            <div className="relative z-10">
              <p className="font-mono text-sm font-bold tracking-wide text-white/80 uppercase">
                Two minutes from now
              </p>
              <h2 className="mx-auto mt-4 max-w-xl font-grotesk text-4xl font-extrabold tracking-tight text-balance sm:text-5xl">
                Your name might still be available.
              </h2>
              <Link
                href="/register"
                className="mt-8 inline-flex rounded-full bg-white px-8 py-3.5 font-mono font-black text-neutral-900 uppercase transition hover:bg-white/90"
              >
                Claim your name
              </Link>
            </div>
            <div className="pointer-events-none absolute -right-20 -bottom-24 h-72 w-72 rounded-full bg-white/10" />
            <div className="pointer-events-none absolute -top-24 -left-16 h-64 w-64 rounded-full bg-white/10" />
          </div>
        </section>
      </main>

      {/* ---------- Powered by (built-with strip) ---------- */}
      <TechStrip />

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
