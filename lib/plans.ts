import type { BlockType } from "@/lib/blocks";
import type { ThemeKey } from "@/lib/themes";

/** `admin` nie je predajna uroven — je to interny stav prevadzkovatela. */
export type Plan = "free" | "pro" | "business" | "admin";

export type PlanFeatures = {
  label: string;
  price: string;
  tagline: string;
  /** Kolko profilov smie ucet mat. Vynucuje aj DB trigger. */
  profiles: number;
  /** null = bez limitu */
  maxBlocks: number | null;
  hideBranding: boolean;
  customDesign: boolean;
  /** null = vsetky */
  themes: ThemeKey[] | null;
  /** null = vsetky */
  blockTypes: BlockType[] | null;
  leads: boolean;
  analyticsDays: number;
  /** Vlastne domeny */
  customDomains: boolean;
  /** AI navrh stranky */
  ai: boolean;
  /** Kolko AI generovani denne */
  aiPerDay: number;
  /**
   * Link Shield — 18+ gateway pred odchodom na externu stranku. Znizuje
   * riziko automatickeho flagovania adult linkov (Fanvue/OnlyFans). Nie je to
   * garancia — je to ochranna vrstva. Free ju nema.
   */
  linkShield: boolean;
  /**
   * Auto-escape z in-app prehliadaca — profil sa pri otvoreni z IG/TikToku
   * pokusi rovno vyskocit do systemoveho prehliadaca (spolahlivo Android,
   * best-effort iOS). Free ju nema.
   */
  escapeInApp: boolean;
  /**
   * VIP zamknute linky — odkaz sa da chranit kodom; navstevnik ho odomkne az
   * po zadani spravneho kodu (server-side, kod ani cielova URL neunikaju do
   * HTML). Free ju nema.
   */
  vipLinks: boolean;
  /** Premium editor workspace. */
  sections: boolean;
  savedTemplates: number;
  versionDays: number;
  brandKit: boolean;
};

export const PLANS: Record<Plan, PlanFeatures> = {
  free: {
    label: "Free",
    price: "€0",
    tagline: "To get started",
    profiles: 1,
    maxBlocks: 8,
    hideBranding: false,
    customDesign: false,
    themes: ["classic", "noir"],
    blockTypes: ["link", "headline", "text", "socials"],
    leads: false,
    analyticsDays: 7,
    customDomains: false,
    ai: false,
    aiPerDay: 0,
    linkShield: false,
    escapeInApp: false,
    vipLinks: false,
    sections: false,
    savedTemplates: 0,
    versionDays: 0,
    brandKit: false,
  },
  pro: {
    label: "Pro",
    price: "€4.99/mo",
    tagline: "For creators",
    profiles: 4,
    maxBlocks: null,
    hideBranding: true,
    customDesign: true,
    themes: null,
    blockTypes: null,
    leads: true,
    analyticsDays: 30,
    customDomains: false,
    ai: true,
    aiPerDay: 20,
    linkShield: true,
    escapeInApp: true,
    vipLinks: true,
    sections: true,
    savedTemplates: 10,
    versionDays: 7,
    brandKit: false,
  },
  business: {
    label: "Business",
    price: "€14.99/mo",
    tagline: "For agencies",
    profiles: 10,
    maxBlocks: null,
    hideBranding: true,
    customDesign: true,
    themes: null,
    blockTypes: null,
    leads: true,
    analyticsDays: 30,
    customDomains: true,
    ai: true,
    aiPerDay: 60,
    linkShield: true,
    escapeInApp: true,
    vipLinks: true,
    sections: true,
    savedTemplates: 50,
    versionDays: 30,
    brandKit: true,
  },
  admin: {
    label: "Admin",
    price: "—",
    tagline: "Operator account",
    profiles: 100,
    maxBlocks: null,
    hideBranding: true,
    customDesign: true,
    themes: null,
    blockTypes: null,
    leads: true,
    analyticsDays: 30,
    customDomains: true,
    ai: true,
    aiPerDay: 200,
    linkShield: true,
    escapeInApp: true,
    vipLinks: true,
    sections: true,
    savedTemplates: 100,
    versionDays: 30,
    brandKit: true,
  },
};

export const PLAN_KEYS = Object.keys(PLANS) as Plan[];

/** Urovne, ktore sa daju predat — admin medzi ne nepatri. */
export const BILLABLE_PLAN_KEYS: Plan[] = ["free", "pro", "business"];

export function planOf(raw: string | null | undefined): PlanFeatures {
  return PLANS[(raw ?? "free") as Plan] ?? PLANS.free;
}

export function allowsTheme(plan: PlanFeatures, theme: string): boolean {
  return plan.themes === null || plan.themes.includes(theme as ThemeKey);
}

export function allowsBlock(plan: PlanFeatures, type: BlockType): boolean {
  return plan.blockTypes === null || plan.blockTypes.includes(type);
}

/** Co presne dostane zakaznik navyse — pouziva sa na landing page. */
export const PLAN_BULLETS: Record<Plan, string[]> = {
  free: ["1 page", "8 blocks", "2 themes", "Basic analytics"],
  pro: [
    "Up to 4 pages",
    "Unlimited blocks",
    "All 9 block types",
    "Full design control",
    "No linkovne branding",
    "Contact forms & leads",
    "AI page builder",
    "Link gate — a confirmation step before external links",
    "Opens links in the real browser, not the in-app one",
    "VIP links locked behind a code",
  ],
  business: [
    "Everything in Pro",
    "Up to 10 pages",
    "One login for every client",
    "Priority support",
  ],
  admin: ["Everything unlocked"],
};
