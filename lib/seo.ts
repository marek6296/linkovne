import type { Metadata } from "next";
import { BRAND_TITLE, SITE_URL } from "@/lib/site";
import { PLANS } from "@/lib/plans";

export const productFacts = {
  freeProfiles: PLANS.free.profiles,
  proProfiles: PLANS.pro.profiles,
  businessProfiles: PLANS.business.profiles,
  freeBlocks: PLANS.free.maxBlocks,
  proPrice: PLANS.pro.price,
  businessPrice: PLANS.business.price,
  domainPlan: PLANS.business.label,
};

/** Each marketing page owns its canonical, social title and social URL. */
export function marketingMetadata(path: string, title: string, description: string): Metadata {
  const fullTitle = `${title} · ${BRAND_TITLE}`;
  return {
    title: { absolute: fullTitle },
    description,
    alternates: { canonical: path },
    openGraph: { type: "website", title: fullTitle, description, url: `${SITE_URL}${path}`, siteName: BRAND_TITLE },
    twitter: { card: "summary_large_image", title: fullTitle, description },
  };
}

export const productGraph = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: BRAND_TITLE,
      url: SITE_URL,
      logo: `${SITE_URL}/lk-mark.jpg`,
      email: "support@linkovne.com",
      sameAs: ["https://www.instagram.com/linkovne/"],
      contactPoint: { "@type": "ContactPoint", contactType: "customer support", email: "support@linkovne.com", availableLanguage: "English" },
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: BRAND_TITLE,
      inLanguage: "en",
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${SITE_URL}/#app`,
      name: BRAND_TITLE,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url: SITE_URL,
      description: "A link-in-bio page builder for creators and agencies with multiple profiles, cookie-free analytics, gated links and custom domains on the Business plan.",
      publisher: { "@id": `${SITE_URL}/#organization` },
      offers: (["free", "pro", "business"] as const).map((key) => {
        const plan = PLANS[key];
        const price = plan.price.replace(/[^0-9.]/g, "");
        return {
          "@type": "Offer",
          name: plan.label,
          price,
          priceCurrency: "EUR",
          url: `${SITE_URL}/#pricing`,
          ...(key !== "free" ? { priceSpecification: { "@type": "UnitPriceSpecification", price, priceCurrency: "EUR", billingDuration: "P1M", unitText: "month" } } : {}),
        };
      }),
    },
  ],
};

/** Escape text before embedding JSON-LD in HTML, including future content edits. */
export function jsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
