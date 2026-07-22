import { BTN_SIZES, getTheme, type BtnSize, type Theme } from "@/lib/themes";

export type BgMode = "theme" | "solid" | "gradient" | "image";
/** Rezim pozadia za kartou na PC. „auto" = rozmazany glow z pozadia karty. */
export type DeskBgMode = "auto" | "solid" | "gradient" | "image";
export type BtnStyle = "fill" | "outline" | "soft" | "glass" | "gradient";
export type BtnShape = "pill" | "soft" | "rounded" | "square";
export type BtnShadow = "none" | "subtle" | "floating" | "hard";
export type BtnBorder = "none" | "thin" | "bold";
export type BtnSpacing = "compact" | "normal" | "relaxed";
export type BtnWeight = "regular" | "medium" | "bold";
export type AvatarShape = "circle" | "rounded" | "square" | "organic";
export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";
export type AvatarAspect = "square" | "portrait" | "landscape" | "wide";
export type AvatarFrame = "none" | "line" | "double" | "glow" | "shadow";
export type AvatarFit = "cover" | "contain";
export type AvatarPosition = "center" | "top" | "bottom";
export type FontKey =
  | "sans"
  | "serif"
  | "display"
  | "grotesk"
  | "classic"
  | "mono"
  | "manrope"
  | "montserrat"
  | "raleway"
  | "lora"
  | "cormorant"
  | "syne";

export type Design = {
  bg?: BgMode;
  bgColor?: string;
  bgColor2?: string;
  bgImage?: string;
  textColor?: string;
  btnBg?: string;
  btnText?: string;
  btnStyle?: BtnStyle;
  btnShape?: BtnShape;
  btnSize?: BtnSize;
  btnShadow?: BtnShadow;
  btnBorder?: BtnBorder;
  btnSpacing?: BtnSpacing;
  btnWeight?: BtnWeight;
  btnGradientColor?: string;
  btnGradientColor2?: string;
  /** Font textu a buttonov */
  font?: FontKey;
  /** Font mena v hlavicke profilu */
  fontHeading?: FontKey;
  /** Profilovka: tvar, velkost a jemny prstenec okolo nej */
  avatarShape?: AvatarShape;
  avatarSize?: AvatarSize;
  avatarAspect?: AvatarAspect;
  avatarFrame?: AvatarFrame;
  avatarFit?: AvatarFit;
  avatarPosition?: AvatarPosition;
  avatarRing?: boolean;
  avatarRingColor?: string;
  /** Pozadie za kartou na PC (desktop backdrop) */
  deskBg?: DeskBgMode;
  deskBgColor?: string;
  deskBgColor2?: string;
  deskBgImage?: string;
};

export const FONTS: Record<FontKey, { label: string; css: string }> = {
  sans: {
    label: "Modern",
    css: "var(--font-instrument-sans), system-ui, sans-serif",
  },
  serif: {
    label: "Editorial",
    css: "var(--font-instrument-serif), Georgia, serif",
  },
  display: { label: "Soft", css: "var(--font-fraunces), Georgia, serif" },
  grotesk: {
    label: "Bold",
    css: "var(--font-bricolage), system-ui, sans-serif",
  },
  classic: {
    label: "Classic",
    css: "var(--font-playfair), Georgia, serif",
  },
  mono: { label: "Mono", css: "var(--font-space-mono), ui-monospace, monospace" },
  manrope: { label: "Manrope", css: "var(--font-manrope), system-ui, sans-serif" },
  montserrat: { label: "Montserrat", css: "var(--font-montserrat), system-ui, sans-serif" },
  raleway: { label: "Raleway", css: "var(--font-raleway), system-ui, sans-serif" },
  lora: { label: "Lora", css: "var(--font-lora), Georgia, serif" },
  cormorant: { label: "Cormorant", css: "var(--font-cormorant), Georgia, serif" },
  syne: { label: "Syne", css: "var(--font-syne), system-ui, sans-serif" },
};

export const FONT_KEYS = Object.keys(FONTS) as FontKey[];

export const BTN_SHAPES: Record<BtnShape, { label: string; radius: string }> = {
  pill: { label: "Pill", radius: "999px" },
  soft: { label: "Soft", radius: "24px" },
  rounded: { label: "Rounded", radius: "14px" },
  square: { label: "Square", radius: "2px" },
};

export const BTN_STYLES: Record<BtnStyle, string> = {
  fill: "Filled",
  outline: "Outline",
  soft: "Soft",
  glass: "Glass",
  gradient: "Gradient",
};

export const BTN_SHADOWS: Record<BtnShadow, { label: string; css: string }> = {
  none: { label: "None", css: "none" },
  subtle: { label: "Subtle", css: "0 4px 14px rgba(0,0,0,0.09)" },
  floating: { label: "Floating", css: "0 12px 30px rgba(0,0,0,0.18)" },
  hard: { label: "Hard", css: "5px 5px 0 rgba(0,0,0,0.28)" },
};

export const BTN_BORDERS: Record<BtnBorder, { label: string; width: string }> = {
  none: { label: "None", width: "0px" },
  thin: { label: "Thin", width: "1px" },
  bold: { label: "Bold", width: "2px" },
};

export const BTN_SPACING: Record<BtnSpacing, { label: string; gap: string }> = {
  compact: { label: "Compact", gap: "0.5rem" },
  normal: { label: "Balanced", gap: "0.75rem" },
  relaxed: { label: "Airy", gap: "1.125rem" },
};

export const BTN_WEIGHTS: Record<BtnWeight, { label: string; value: number }> = {
  regular: { label: "Regular", value: 400 },
  medium: { label: "Medium", value: 500 },
  bold: { label: "Bold", value: 700 },
};

export const AVATAR_SHAPES: Record<
  AvatarShape,
  { label: string; radius: string }
> = {
  circle: { label: "Circle", radius: "999px" },
  rounded: { label: "Rounded", radius: "26px" },
  square: { label: "Square", radius: "8px" },
  organic: { label: "Organic", radius: "38% 62% 55% 45% / 48% 40% 60% 52%" },
};

export const AVATAR_SIZES: Record<AvatarSize, { label: string; px: number }> = {
  xs: { label: "Tiny", px: 64 },
  sm: { label: "Small", px: 80 },
  md: { label: "Medium", px: 96 },
  lg: { label: "Large", px: 120 },
  xl: { label: "XL", px: 152 },
};

export const AVATAR_ASPECTS: Record<
  AvatarAspect,
  { label: string; ratio: number }
> = {
  square: { label: "1:1", ratio: 1 },
  portrait: { label: "4:5", ratio: 4 / 5 },
  landscape: { label: "4:3", ratio: 4 / 3 },
  wide: { label: "16:9", ratio: 16 / 9 },
};

export const AVATAR_FRAMES: Record<AvatarFrame, string> = {
  none: "None",
  line: "Line",
  double: "Double",
  glow: "Glow",
  shadow: "Shadow",
};

/**
 * Do CSS ide len to, co prejde tymto filtrom. Design objekt sice zapisuje
 * iba majitel profilu (RLS), ale hodnota konci v `style` atribute na verejnej
 * stranke — bez kontroly by sa dal cez API podstrcit kus cudzieho CSS.
 */
function safeUrl(raw: string | undefined): string | null {
  if (!raw) return null;
  if (!/^https:\/\//i.test(raw)) return null;
  if (/["'()\\<>\s]/.test(raw)) return null;
  return raw;
}

export function safeColor(raw: string | undefined): string | null {
  if (!raw) return null;
  return /^#[0-9a-f]{3,8}$/i.test(raw) ? raw : null;
}

/**
 * Cierny alebo biely text podla jasu pozadia — zaruci citatelnost na
 * AKEJKOLVEK farbe. Pouziva sa na featured tlacidlo, ktoreho pozadie sa
 * odvodi z farby textu temy a mohlo by inak splynut s textom.
 */
export function readableText(bg: string): string {
  let hex = bg.trim().replace(/^#/, "");
  if (hex.length === 3) hex = hex.replace(/(.)/g, "$1$1");
  if (!/^[0-9a-f]{6}/i.test(hex)) return "#ffffff";
  const n = parseInt(hex.slice(0, 6), 16);
  const srgb = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const x = c / 255;
    return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  });
  const L = 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
  return L > 0.52 ? "#0b0b0b" : "#ffffff";
}

export { safeUrl };

/** Tema je zaklad, `design` su uzivatelske prepisy nad nou. */
export function resolveTheme(
  themeKey: string | null | undefined,
  design: Design | null | undefined,
): Theme {
  const base = getTheme(themeKey);
  if (!design || Object.keys(design).length === 0) return base;

  const t: Theme = { ...base };

  // ---- Pozadie ----
  const c1 = safeColor(design.bgColor);
  const c2 = safeColor(design.bgColor2);
  const img = safeUrl(design.bgImage);

  if (design.bg === "solid" && c1) {
    t.page = c1;
  } else if (design.bg === "gradient" && c1 && c2) {
    t.page = `linear-gradient(165deg, ${c1} 0%, ${c2} 100%)`;
  } else if (design.bg === "image" && img) {
    t.page = `url("${img}") center / cover no-repeat`;
  }

  // ---- Text ----
  const text = safeColor(design.textColor);
  if (text) {
    t.text = text;
    t.muted = `color-mix(in oklab, ${text} 62%, transparent)`;
    t.avatarBg = text;
  }

  // ---- Buttony ----
  if (design.btnShape && design.btnShape in BTN_SHAPES) {
    t.btnRadius = BTN_SHAPES[design.btnShape].radius;
  }

  const bg = safeColor(design.btnBg) ?? base.btnBg;
  const fg = safeColor(design.btnText) ?? base.btnText;

  switch (design.btnStyle) {
    case "fill":
      t.btnBg = bg;
      t.btnText = fg;
      t.btnBorder = `1px solid ${bg}`;
      break;
    case "outline":
      t.btnBg = "transparent";
      t.btnText = fg;
      t.btnBorder = `1.5px solid ${fg}`;
      t.btnShadow = "none";
      break;
    case "soft":
      t.btnBg = `color-mix(in oklab, ${bg} 22%, transparent)`;
      t.btnText = fg;
      t.btnBorder = "1px solid transparent";
      t.btnShadow = "none";
      break;
    case "glass":
      t.btnBg = "rgba(255,255,255,0.16)";
      t.btnText = fg;
      t.btnBorder = "1px solid rgba(255,255,255,0.38)";
      t.btnShadow = "0 8px 26px rgba(0,0,0,0.14)";
      t.btnBackdrop = "blur(10px)";
      break;
    case "gradient": {
      const gradientFrom = safeColor(design.btnGradientColor) ?? bg;
      const gradientTo = safeColor(design.btnGradientColor2) ?? t.text;
      t.btnBg = `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})`;
      t.btnText = fg;
      t.btnBorder = "1px solid transparent";
      t.btnShadow = "0 10px 26px rgba(0,0,0,0.16)";
      break;
    }
    default:
      // Ziadny styl nevybrany — farby sa daju prepisat aj samostatne
      if (safeColor(design.btnBg)) t.btnBg = bg;
      if (safeColor(design.btnText)) t.btnText = fg;
  }

  if (design.btnBorder && design.btnBorder in BTN_BORDERS) {
    const width = BTN_BORDERS[design.btnBorder].width;
    const borderColor = design.btnStyle === "outline" ? fg : bg;
    t.btnBorder = width === "0px" ? "0 solid transparent" : `${width} solid ${borderColor}`;
  }
  if (design.btnShadow && design.btnShadow in BTN_SHADOWS) {
    t.btnShadow = BTN_SHADOWS[design.btnShadow].css;
  }
  if (design.btnSpacing && design.btnSpacing in BTN_SPACING) {
    t.btnGap = BTN_SPACING[design.btnSpacing].gap;
  }
  if (design.btnWeight && design.btnWeight in BTN_WEIGHTS) {
    t.btnWeight = BTN_WEIGHTS[design.btnWeight].value;
  }

  if (design.font && design.font in FONTS) t.font = FONTS[design.font].css;
  if (design.fontHeading && design.fontHeading in FONTS) {
    t.fontHeading = FONTS[design.fontHeading].css;
  }
  if (design.btnSize && design.btnSize in BTN_SIZES) {
    t.size = BTN_SIZES[design.btnSize];
  }

  // ---- Profilovka (tvar / pomer / velkost / ram) ----
  if (design.avatarShape && design.avatarShape in AVATAR_SHAPES) {
    t.avatarRadius = AVATAR_SHAPES[design.avatarShape].radius;
  }
  const avatarBase =
    design.avatarSize && design.avatarSize in AVATAR_SIZES
      ? AVATAR_SIZES[design.avatarSize].px
      : 96;
  const avatarAspect =
    design.avatarAspect && design.avatarAspect in AVATAR_ASPECTS
      ? design.avatarAspect
      : "square";
  const ratio = AVATAR_ASPECTS[avatarAspect].ratio;
  const widthMultiplier =
    avatarAspect === "wide" ? 1.45 : avatarAspect === "landscape" ? 1.25 : 1;
  t.avatarSizePx = avatarBase;
  t.avatarWidthPx = Math.round(avatarBase * widthMultiplier);
  t.avatarHeightPx = Math.round(t.avatarWidthPx / ratio);

  if (design.avatarFit === "cover" || design.avatarFit === "contain") {
    t.avatarFit = design.avatarFit;
  }
  if (
    design.avatarPosition === "center" ||
    design.avatarPosition === "top" ||
    design.avatarPosition === "bottom"
  ) {
    t.avatarPosition = design.avatarPosition;
  }

  const frameColor = safeColor(design.avatarRingColor) ?? t.text;
  if (design.avatarFrame && design.avatarFrame in AVATAR_FRAMES) {
    t.avatarRing = undefined;
    t.avatarBorder = "none";
    switch (design.avatarFrame) {
      case "none":
        t.avatarShadow = "none";
        break;
      case "line":
        t.avatarBorder = `3px solid ${frameColor}`;
        t.avatarShadow = "0 12px 28px -12px rgba(0,0,0,0.4)";
        break;
      case "double":
        t.avatarBorder = `6px double ${frameColor}`;
        t.avatarShadow = "0 12px 28px -12px rgba(0,0,0,0.4)";
        break;
      case "glow":
        t.avatarShadow = `0 0 0 3px ${frameColor}, 0 0 26px ${frameColor}`;
        break;
      case "shadow":
        t.avatarShadow = "0 18px 38px -10px rgba(0,0,0,0.5)";
        break;
    }
  } else if (design.avatarRing) {
    // Backwards compatibility with profiles saved before frame presets existed.
    t.avatarRing = `0 0 0 4px ${frameColor}`;
  }

  // ---- Pozadie za kartou na PC (desktop backdrop) ----
  const kc1 = safeColor(design.deskBgColor);
  const kc2 = safeColor(design.deskBgColor2);
  const kimg = safeUrl(design.deskBgImage);
  if (design.deskBg === "solid" && kc1) {
    t.deskBg = kc1;
    t.deskBlur = false;
  } else if (design.deskBg === "gradient" && kc1 && kc2) {
    t.deskBg = `linear-gradient(165deg, ${kc1} 0%, ${kc2} 100%)`;
    t.deskBlur = false;
  } else if (design.deskBg === "image" && kimg) {
    t.deskBg = `url("${kimg}") center / cover no-repeat`;
    t.deskBlur = false;
  } else {
    // auto — rozmazany glow z pozadia karty (povodne spravanie)
    t.deskBg = t.page;
    t.deskBlur = true;
  }

  return t;
}
