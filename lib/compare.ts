/**
 * Data pre /vs/[slug] porovnavacie stranky. Kazde tvrdenie o konkurencii MUSI
 * byt overitelne (source URL) a datovane — ceny a funkcie sa menia, takze
 * stranka nesmie tvrdit nic, co sme si neoverili k danemu datumu.
 *
 * `theirs` hodnota: true/false = ma/nema, string = ma s vynimkou/detailom.
 * `unconfirmed: true` na riadku znamena, ze sme si tuto konkretnu bunku
 * neoverili — radsej priznat nez tvrdit nieco nespravne na verejnej stranke.
 */

export type CompareRow = {
  feature: string;
  ours: boolean | string;
  theirs: boolean | string;
  unconfirmed?: boolean;
};

export type Competitor = {
  slug: string;
  name: string;
  /** Kratky, vecny opis — ziadne znevazovanie, len fakt. */
  blurb: string;
  searchName?: string;
  chooseUs: string;
  chooseThem: string;
  rows: CompareRow[];
  /** Zdroj cien/funkcii pre pripadnu kontrolu citatelom. */
  sourceUrl: string;
  sourceLabel: string;
  /** Kedy sme fakty overili — nech je jasne, ze sa mozu zmenit. */
  verifiedOn: string;
  additionalSources?: { url: string; label: string }[];
};

export const COMPETITORS: Record<string, Competitor> = {
  linktree: {
    slug: "linktree",
    chooseUs: "Choose Linkovne for a focused creator-page workflow: four pages on Pro, ten profiles and custom domains on Business, source analytics and gated links. Domain registration is separate.",
    chooseThem: "Choose Linktree if its wider creator toolkit or agency Workspaces with staff roles matches your needs. Our multi-profile account does not replace a role-based agency workspace.",
    name: "Linktree",
    blurb: "Linktree offers a broad creator toolkit and agency workspaces with team roles. Linkovne focuses on creator pages, source analytics and gated links, with custom domains on Business. Linktree's help centre says its linktr.ee address cannot be replaced by a custom domain. Choose based on the workflow you actually need.",
    sourceUrl: "https://linktr.ee/help/articles/6571689-about-custom-domains",
    sourceLabel: "Linktree's official custom-domain documentation",
    additionalSources: [{ url: "https://linktr.ee/s/pricing", label: "Linktree pricing and agency plan features" }],
    verifiedOn: "15 Nov 2026",
    rows: [
      { feature: "Free link-in-bio page", ours: "1 page, up to 8 blocks", theirs: "Free plan with unlimited basic links" },
      { feature: "Custom domain replacing the platform URL", ours: "Business (€14.99/mo)", theirs: false },
      { feature: "Multiple creator pages", ours: "Pro: 4; Business: 10", theirs: "Agency Workspaces; Growth lists 9 Linktrees" },
      { feature: "Separate team roles and permissions", ours: "Multiple profiles under one login; no separate roles", theirs: "Available in agency Workspaces" },
      { feature: "Domain failover when a domain is unreachable", ours: "Business; not social-platform block detection", theirs: "Not confirmed in reviewed sources", unconfirmed: true },
      { feature: "Help opening links outside in-app browsers", ours: "Pro & Business; device-dependent", theirs: "Not confirmed in reviewed sources", unconfirmed: true },
      { feature: "Cheapest paid plan", ours: "€4.99/mo (Pro)", theirs: "Check official pricing; current numeric price not verified", unconfirmed: true },
    ],
  },
  beacons: {
    slug: "beacons",
    chooseUs: "Choose Linkovne when your main job is managing creator pages, understanding traffic sources and controlling access to selected links. Pro and Business provide four and ten profiles respectively.",
    chooseThem: "Choose Beacons when a built-in store, email marketing and media-kit tools matter more than a focused link-page workflow. Compare seller fees and domain inclusions in its current plans.",
    name: "Beacons",
    blurb: "Beacons combines link-in-bio pages with a store, email marketing and other creator tools. Its official plans page lists a custom domain from Creator at $10/month. Linkovne is focused on creator-page workflows, source analytics and gated links; its custom-domain option is on Business at €14.99/month. Currency and included features differ.",
    sourceUrl: "https://help.beacons.ai/en/articles/4695681",
    sourceLabel: "Beacons' official pricing-plan documentation",
    verifiedOn: "15 Nov 2026",
    rows: [
      { feature: "Free link-in-bio page", ours: "1 page, up to 8 blocks", theirs: "Free plan with unlimited links" },
      { feature: "Custom domain", ours: "Business (€14.99/mo); registration separate", theirs: "Creator: $10/mo; first year included per plan documentation" },
      { feature: "Several pages", ours: "Pro: 4; Business: 10 profiles", theirs: "Free plan lists 5 link-in-bio pages; not equivalent to agency profiles" },
      { feature: "Separate client permission roles", ours: "Multiple profiles under one login; no separate roles", theirs: "Not confirmed in reviewed source", unconfirmed: true },
      { feature: "Domain failover when a domain is unreachable", ours: "Business; not social-platform block detection", theirs: "Not confirmed in reviewed source", unconfirmed: true },
      { feature: "Help opening links outside in-app browsers", ours: "Pro & Business; device-dependent", theirs: "Not confirmed in reviewed source", unconfirmed: true },
      { feature: "Cheapest paid plan, billed monthly", ours: "€4.99/mo (Pro)", theirs: "$10/mo (Creator)" },
    ],
  },
  linkme: {
    slug: "linkme",
    name: "Linkme",
    searchName: "Link.me",
    blurb: "Linkme (link.me) combines a profile page with social publishing, messaging automations and selling tools. Linkovne focuses on hosted creator pages, gated links and source analytics. The choice depends on whether you need that broader social toolkit or several branded pages under one login.",
    chooseUs: "Consider Linkovne for a focused page-and-links workflow. Pro includes four pages at €4.99/month; Business includes ten profiles and custom domains at €14.99/month. You can distinguish traffic from different social accounts without treating link clicks as confirmed sales.",
    chooseThem: "Consider Linkme when you also need social post publishing or DM automations. Its official documentation describes Post to All and plan-dependent messaging tools. Those capabilities are outside Linkovne's current page-builder offer.",
    sourceUrl: "https://link.me/pricing",
    sourceLabel: "Linkme's official plan comparison",
    additionalSources: [{ url: "https://link.me/faq", label: "Linkme product and agency FAQ" }],
    verifiedOn: "15 Nov 2026",
    rows: [
      { feature: "Starter link page", ours: "Free: 1 page, up to 8 blocks", theirs: "Free profile with unlimited links" },
      { feature: "Page views and link clicks", ours: "Included; history depends on plan", theirs: "Basic on Free; deeper analytics on paid plans" },
      { feature: "Several creator profiles", ours: "Pro: 4; Business: 10 under one login", theirs: "Agency workflow documented; confirm profile limits" },
      { feature: "Social post publishing and DM automations", ours: "Not included in the page builder", theirs: "Available, with plan-specific limits" },
      { feature: "Opening links outside in-app browsers", ours: "Pro & Business; device-dependent", theirs: "Deeplink feature listed on Pro" },
      { feature: "Custom domain for the hosted profile", ours: "Business (€14.99/mo); registration separate", theirs: "Not confirmed in reviewed sources", unconfirmed: true },
      { feature: "Paid subscription price", ours: "Pro €4.99/mo; Business €14.99/mo", theirs: "Check current checkout; numeric price not verified", unconfirmed: true },
    ],
  },
  allmylinks: {
    slug: "allmylinks",
    name: "AllMyLinks",
    blurb: "AllMyLinks documents custom domains, visitor statistics and a way to manage separate accounts using email aliases. Linkovne provides several profiles under one login on its paid plans. Both can host a creator's links; compare the actual account workflow and domain requirements before switching.",
    chooseUs: "Consider Linkovne if you want up to four pages on Pro or ten profiles on Business inside one account, plus lead forms, an AI page builder and code-protected VIP links. Custom domains require Business, and registration is separate.",
    chooseThem: "Consider staying with AllMyLinks if its existing profile, custom-domain setup and visitor statistics cover your needs. Its help centre describes separate-account management using email aliases; assess whether that workflow is sufficient before moving an established page.",
    sourceUrl: "https://support.allmylinks.com/hc/en-us/articles/360040193751-Set-up-a-Custom-Domain-for-your-profile",
    sourceLabel: "AllMyLinks' official custom-domain setup",
    additionalSources: [
      { url: "https://support.allmylinks.com/hc/en-us/articles/4405774784148-Pro-tip-Managing-multiple-accounts-with-one-email-address", label: "AllMyLinks multiple-account guidance" },
      { url: "https://support.allmylinks.com/hc/en-us/articles/360035583091-Can-I-see-how-many-people-viewed-my-AllMyLinks-profile", label: "AllMyLinks visitor statistics documentation" },
    ],
    verifiedOn: "15 Nov 2026",
    rows: [
      { feature: "Hosted creator link page", ours: true, theirs: true },
      { feature: "Connect your own domain", ours: "Business (€14.99/mo); registration separate", theirs: "Supported, with DNS and profile settings" },
      { feature: "Visitor and link statistics", ours: "Views, clicks and traffic sources", theirs: "Visitor and trending-link statistics documented" },
      { feature: "Managing several creators", ours: "Pro: 4; Business: 10 profiles under one login", theirs: "Help article describes separate accounts with email aliases" },
      { feature: "Current plan pricing", ours: "Free; Pro €4.99/mo; Business €14.99/mo", theirs: "Current pricing not reverified; confirm with provider", unconfirmed: true },
    ],
  },
  hoobe: {
    slug: "hoobe",
    name: "hoo.be",
    blurb: "hoo.be combines creator pages with commerce and offers a separate agency workflow. Its public creator plans list custom domains on Premium. Linkovne offers custom domains and ten profiles on Business, while Pro is a smaller four-page option. Creator plans and agency offers are different scopes, so compare the right tier.",
    chooseUs: "Consider Linkovne for a smaller, focused creator-page setup: Pro has four pages at €4.99/month, and Business has ten profiles plus custom domains at €14.99/month. Gated and code-protected links are included on both paid plans.",
    chooseThem: "Consider hoo.be when its commerce features or separate agency access model is central to your workflow. Its agency page describes creator claim links and staff roles; those are different from multiple pages managed under one Linkovne login.",
    sourceUrl: "https://hoo.be/pricing",
    sourceLabel: "hoo.be's official creator-plan pricing",
    additionalSources: [{ url: "https://hoo.be/for-agencies", label: "hoo.be's separate agency workflow" }],
    verifiedOn: "15 Nov 2026",
    rows: [
      { feature: "Free starter page", ours: "1 page, up to 8 blocks", theirs: "1 profile with unlimited links" },
      { feature: "Entry paid creator plan, billed monthly", ours: "Pro: €4.99/mo, 4 pages", theirs: "Pro: $9.99/mo, 1 profile" },
      { feature: "Several profiles on public creator plans", ours: "Business: up to 10 profiles", theirs: "Premium: up to 5; agency offer is separate" },
      { feature: "Own domain on public creator plans", ours: "Business: €14.99/mo", theirs: "Premium: $29.99/mo" },
      { feature: "Separate creator logins and staff roles", ours: "Not included; one account manages its profiles", theirs: "Described in the separate agency offer" },
      { feature: "Sell directly from the page", ours: "Link to external destinations; no native storefront", theirs: "Shop features and plan-dependent seller fees" },
    ],
  },

};

export const COMPARE_SLUGS = Object.keys(COMPETITORS);

/** Route segments are untrusted: inherited Object keys are not competitors. */
export function getCompetitor(slug: string): Competitor | undefined {
  return Object.hasOwn(COMPETITORS, slug) ? COMPETITORS[slug] : undefined;
}
