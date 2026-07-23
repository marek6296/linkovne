import type { Design } from "@/lib/design";
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
  if (!caps.btnAnimation) delete d.btnAnimation;

  // ---- Avatar ----
  if (!caps.avatarFrames) {
    delete d.avatarFrame;
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
