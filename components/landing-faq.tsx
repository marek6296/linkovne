import { BRAND_TITLE, SITE_DOMAIN } from "@/lib/site";

/**
 * FAQ na landingu — SEO obsah cieliaci na frazy "link in bio",
 * "Linktree alternative", "custom domain" atd. Cisto serverove, natívne
 * <details>/<summary> (ziadny JS). Rovnake otazky exportuje FAQ_ITEMS
 * pre JSON-LD FAQPage v app/page.tsx — text sa NESMIE rozist s tym,
 * co je viditelne na stranke (Google to penalizuje).
 */

export const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: "What is a link in bio page?",
    a: `A link in bio page puts everything you share — links, socials, products, contact forms — on one simple page with a single URL. You paste that one link into your Instagram, TikTok or X bio, and visitors find all of you in one place. ${BRAND_TITLE} lets you build one in about two minutes, free.`,
  },
  {
    q: `Is ${BRAND_TITLE} a good Linktree alternative?`,
    a: `Yes — ${BRAND_TITLE} covers what you'd expect from Linktree (links, themes, analytics, QR codes) and adds what creators usually upgrade for: your own custom domain, link protection for sensitive links, escaping the in-app browser, and privacy-friendly analytics with no cookies or tracking pixels.`,
  },
  {
    q: "Can I use my own domain?",
    a: `Yes. Instead of sharing ${SITE_DOMAIN}/you, you can connect a domain you own — like yourname.com — so your page is truly yours. If a shared platform domain ever gets blocked somewhere, your own domain isn't affected. Multiple backup domains with automatic failover are supported too.`,
  },
  {
    q: `Is ${BRAND_TITLE} free?`,
    a: "The Free plan gives you a page with up to 8 blocks, themes and 7-day analytics — no card required. Pro (€4.99/mo) unlocks unlimited blocks, every block type, custom design, lead forms and the AI builder. Business (€14.99/mo) adds up to 10 profiles under one login for agencies.",
  },
  {
    q: "Do you track my visitors?",
    a: "No. Clicks and views are counted on our own servers — no cookies, no Meta pixel, no fingerprinting, nothing sold to ad networks. You still see what matters: views, clicks, sources and countries.",
  },
  {
    q: "Why do my links open in Safari or Chrome instead of the Instagram browser?",
    a: "In-app browsers break logins and payments, so visitors give up. When someone taps your link inside Instagram or TikTok, we move them to their real browser where everything works — which means fewer lost visitors for you.",
  },
];

export function LandingFaq() {
  return (
    <section
      id="faq"
      className="mx-auto w-full max-w-3xl px-6 py-16 sm:py-24"
    >
      <p className="text-center font-mono text-sm font-bold tracking-wide text-indigo-500 uppercase">
        FAQ
      </p>
      <h2 className="mt-3 text-center font-grotesk text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">
        Questions, answered
      </h2>

      <div className="mt-10 space-y-3">
        {FAQ_ITEMS.map((item) => (
          <details
            key={item.q}
            className="card group px-6 py-4 open:pb-5 transition"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-ink [&::-webkit-details-marker]:hidden">
              {item.q}
              <span
                aria-hidden
                className="text-xl text-faint transition-transform duration-200 group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <p className="mt-3 text-[15px] leading-relaxed text-soft">
              {item.a}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
