import { PREMIUM_DESIGN_KEYS, type Design } from "@/lib/design";
import type { PlanFeatures } from "@/lib/plans";

/**
 * Kapability dizajnu podla planu — riadia, ktore polia `Design` smie ucet
 * realne pouzit. Free ma odteraz „strednu" customizaciu (temy, farby, gradient
 * pozadie, tvar/styl buttonov, fonty, tvar+velkost avatara), premium si drzi
 * „wow" prvky (obrazkove pozadie, animacie, glass/gradient buttony, avatar ramy,
 * desktop backdrop). Pouziva sa na TROCH miestach, aby sa to nedalo obist:
 *   1. editor (design-panel) — premium ovladace su zamknute + upsell,
 *   2. saveProfile (server) — premium polia sa pri zapise odstrania,
 *   3. verejna stranka (render) — premium polia sa ignoruju po downgrade.
 */
export type DesignCaps = {
  /** Plna kontrola (pro+). Ked true, `designForPlan` vrati design bez zmeny. */
  full: boolean;
  /** Obrazok ako pozadie karty. */
  bgImage: boolean;
  /** Gradient pozadie karty (free ho MA). */
  bgGradient: boolean;
  /** Glass / gradient styl buttonov (+ gradient farby). */
  btnFancy: boolean;
  /** Automaticke animacie buttonov. */
  btnAnimation: boolean;
  /** Avatar ramy, glow a ring farba. */
  avatarFrames: boolean;
  /** Vlastne pozadie za kartou na PC (desktop backdrop). */
  deskBackdrop: boolean;
};

const FULL: DesignCaps = {
  full: true,
  bgImage: true,
  bgGradient: true,
  btnFancy: true,
  btnAnimation: true,
  avatarFrames: true,
  deskBackdrop: true,
};

const FREE: DesignCaps = {
  full: false,
  bgImage: false,
  bgGradient: true,
  btnFancy: false,
  btnAnimation: false,
  avatarFrames: false,
  deskBackdrop: false,
};

/** Kapability pre dany plan. `customDesign` (pro/business/admin) = plna kontrola. */
export function designCaps(plan: PlanFeatures): DesignCaps {
  return plan.customDesign ? FULL : FREE;
}

/**
 * Ocisti `design` na to, co dany plan smie pouzit. Plne plany vratia design
 * nezmeneny; pre free odstrani/zdegraduje premium polia. Cista funkcia —
 * needituje vstup.
 */
export function designForPlan(
  design: Design | null | undefined,
  plan: PlanFeatures,
): Design {
  if (!design) return {};
  const caps = designCaps(plan);
  if (caps.full) return design;

  const d: Design = { ...design };
  for (const key of PREMIUM_DESIGN_KEYS) delete d[key];
  if (d.profileLayout === "cover" || d.profileLayout === "editorial") delete d.profileLayout;
  delete d.avatarVideo;
  delete d.avatarVideoPoster;
  delete d.bgVideo;
  delete d.bgVideoPoster;

  // ---- Pozadie ----
  if (!caps.bgImage) {
    delete d.bgImage;
    if (d.bg === "image") d.bg = d.bgColor ? "solid" : "theme";
  }
  if (!caps.bgGradient && d.bg === "gradient") {
    d.bg = d.bgColor ? "solid" : "theme";
  }

  // ---- Buttony ----
  if (!caps.btnFancy) {
    if (d.btnStyle === "glass" || d.btnStyle === "gradient") d.btnStyle = "fill";
    delete d.btnGradientColor;
    delete d.btnGradientColor2;
  }
  if (!caps.btnAnimation && d.btnAnimation !== "none") delete d.btnAnimation;

  // ---- Avatar ----
  if (!caps.avatarFrames) {
    if (d.avatarFrame !== "none") delete d.avatarFrame;
    delete d.avatarRing;
    delete d.avatarRingColor;
  }

  // ---- Desktop backdrop ----
  if (!caps.deskBackdrop) {
    delete d.deskBg;
    delete d.deskBgColor;
    delete d.deskBgColor2;
    delete d.deskBgImage;
  }

  return d;
}

/**
 * Human-readable Pro features currently present in the local design draft.
 * The editor may preview these on Free, but publishing stays blocked until the
 * user removes them or upgrades.
 */
export function lockedDesignFeatures(
  design: Design | null | undefined,
  plan: PlanFeatures,
  existingDesign?: Design | null,
): string[] {
  if (!design) return [];
  const caps = designCaps(plan);
  if (caps.full) return [];

  const locked: string[] = [];
  if (design.profileLayout === "hero" && existingDesign?.profileLayout !== "hero") locked.push("Spotlight layout");
  if (PREMIUM_DESIGN_KEYS.some(key => design[key] && !["default", "none", "stack"].includes(String(design[key]))) || design.profileLayout === "cover" || design.profileLayout === "editorial") locked.push("Premium profile composition");
  if (design.avatarVideo || (design.bg === "image" && design.bgVideo)) locked.push("Profile video");
  if (!caps.bgImage && design.bg === "image") {
    locked.push("Image background");
  }
  if (
    !caps.btnFancy &&
    (design.btnStyle === "glass" || design.btnStyle === "gradient")
  ) {
    locked.push(
      design.btnStyle === "glass"
        ? "Glass button style"
        : "Gradient button style",
    );
  }
  if (!caps.btnAnimation && design.btnAnimation && design.btnAnimation !== "none") {
    locked.push("Button animation");
  }
  if (
    !caps.avatarFrames &&
    ((design.avatarFrame && design.avatarFrame !== "none") ||
      (!design.avatarFrame && design.avatarRing))
  ) {
    locked.push("Avatar frame or glow");
  }
  if (!caps.deskBackdrop && design.deskBg && design.deskBg !== "auto") {
    locked.push("Custom desktop background");
  }

  return [...new Set(locked)];
}

/** Existing per-link motion survives on Free; adding or changing it requires Pro. */
export function hasNewButtonAnimation(
  blocks: { id: string; config?: { anim?: string } | null }[],
  existing: { id: string; config?: { anim?: string } | null }[],
): boolean {
  const animations = new Map(existing.map(b => [b.id, b.config?.anim]));
  return blocks.some(b => !!b.config?.anim && b.config.anim !== "none" && animations.get(b.id) !== b.config.anim);
}

/** New social presentations are paid; classic blocks and existing Free content stay intact. */
export function hasPremiumSocials(blocks: {config: {socialPresentation?: string; items?: {platform: string}[]}}[]): boolean {
  return blocks.some(b => (!!b.config.socialPresentation && b.config.socialPresentation !== "classic") || !!b.config.items?.some(item => item.platform === "custom"));
}


/** Saved Spotlight profiles keep working; only selecting a new paid layout is gated. */
export function hasNewPremiumLayout(design: Design, existing?: Design | null): boolean {
  return ["hero", "cover", "editorial"].includes(design.profileLayout ?? "") && design.profileLayout !== existing?.profileLayout;
}

/** Reject newly requested paid values while retaining untouched saved designs. */
export function hasNewPaidDesign(design: Design, plan: PlanFeatures, existing?: Design | null): boolean {
  if (plan.customDesign) return false;
  if (hasNewPremiumLayout(design, existing)) return true;
  const clean = designForPlan(design, plan);
  return (Object.keys(design) as (keyof Design)[]).some(key =>
    JSON.stringify(design[key]) !== JSON.stringify(clean[key]) &&
    JSON.stringify(design[key]) !== JSON.stringify(existing?.[key])
  );
}

/** Per-link paid styles need the same server checks as page-wide styles. */
export function hasNewPaidButtonStyle(blocks: {id: string; config?: Record<string, unknown> | null}[], existing: {id:string; config?: Record<string, unknown> | null}[]): boolean {
  const saved = new Map(existing.map(block => [block.id, block.config]));
  return blocks.some(block => {
    const style = block.config?.buttonStyle;
    return (style === "glass" || style === "gradient") && saved.get(block.id)?.buttonStyle !== style;
  });
}
