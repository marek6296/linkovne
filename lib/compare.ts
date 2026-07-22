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
};

export const COMPETITORS: Record<string, Competitor> = {
  linktree: {
    slug: "linktree",
    name: "Linktree",
    blurb:
      "Linktree pioneered the link-in-bio category and its free plan is a solid start. The tradeoffs show up once you outgrow it: no custom domain option at any price, and paid plans add Meta Pixel and Google Analytics tracking to your visitors.",
    sourceUrl: "https://linktr.ee/pricing",
    sourceLabel: "Linktree's official pricing page and help center",
    verifiedOn: "22 Jul 2026",
    rows: [
      {
        feature: "Custom domain (e.g. yourname.com)",
        ours: true,
        theirs: false,
      },
      {
        feature: "Automatic domain failover if one domain is blocked",
        ours: true,
        theirs: false,
      },
      {
        feature: "Cookie-free analytics (no tracking pixels)",
        ours: true,
        theirs: "Adds Meta Pixel & Google Analytics on paid plans",
      },
      {
        feature: "Link gate before visiting a sensitive link",
        ours: true,
        theirs: "Yes (per-link Age Lock)",
      },
      {
        feature: "Escapes Instagram/TikTok's in-app browser automatically",
        ours: true,
        theirs: "Not found in their docs",
        unconfirmed: true,
      },
      {
        feature: "AI builds your whole page from one prompt",
        ours: true,
        theirs: "Image, thumbnail & design-tip AI only",
      },
      {
        feature: "Link scheduling (show/hide on a date)",
        ours: true,
        theirs: true,
      },
      {
        feature: "Multiple pages under one login",
        ours: true,
        theirs: true,
      },
      {
        feature: "Cheapest paid plan",
        ours: "€4.99/mo",
        theirs: "$6/mo (billed annually)",
      },
    ],
  },
  beacons: {
    slug: "beacons",
    name: "Beacons",
    blurb:
      "Beacons leans hard into commerce and AI, and its Creator plan does include a custom domain. It also tracks visitors with pixels and cookies by default, and a few of its finer details — exact free-tier analytics, team limits, its AI builder — aren't fully documented publicly, so we've marked those as unconfirmed rather than guessed.",
    sourceUrl: "https://help.beacons.ai/en/articles/4695681",
    sourceLabel: "Beacons' official help center (pricing plans)",
    verifiedOn: "22 Jul 2026",
    rows: [
      {
        feature: "Custom domain (e.g. yourname.com)",
        ours: true,
        theirs: "Yes, from $10/mo (Creator plan)",
      },
      {
        feature: "Automatic domain failover if one domain is blocked",
        ours: true,
        theirs: "Not stated",
        unconfirmed: true,
      },
      {
        feature: "Cookie-free analytics (no tracking pixels)",
        ours: true,
        theirs: "Supports custom tracking pixels",
      },
      {
        feature: "Link gate before visiting a sensitive link",
        ours: true,
        theirs: "Not confirmed",
        unconfirmed: true,
      },
      {
        feature: "Escapes Instagram/TikTok's in-app browser automatically",
        ours: true,
        theirs: "Not found in their docs",
        unconfirmed: true,
      },
      {
        feature: "AI builds your whole page from one prompt",
        ours: true,
        theirs: 'Reportedly yes ("Beam" AI)',
        unconfirmed: true,
      },
      {
        feature: "Link scheduling (show/hide on a date)",
        ours: true,
        theirs: "Not confirmed",
        unconfirmed: true,
      },
      {
        feature: "Multiple pages under one login",
        ours: true,
        theirs: "Reportedly limited — no confirmed multi-user roles",
        unconfirmed: true,
      },
      {
        feature: "Cheapest paid plan",
        ours: "€4.99/mo",
        theirs: "$10/mo (Creator)",
      },
    ],
  },
};

export const COMPARE_SLUGS = Object.keys(COMPETITORS);
