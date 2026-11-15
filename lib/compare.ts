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
};

export const COMPARE_SLUGS = Object.keys(COMPETITORS);
