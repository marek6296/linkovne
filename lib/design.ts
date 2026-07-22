import { BTN_SIZES, getTheme, type BtnSize, type Theme } from "@/lib/themes";

export type BgMode = "theme" | "solid" | "gradient" | "image";
export type BtnStyle = "fill" | "outline" | "soft" | "glass";
export type BtnShape = "pill" | "rounded" | "square";
export type FontKey =
  | "sans"
  | "serif"
  | "display"
  | "grotesk"
  | "classic"
  | "mono";

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
  /** Font textu a buttonov */
  font?: FontKey;
  /** Font mena v hlavicke profilu */
  fontHeading?: FontKey;
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
};

export const FONT_KEYS = Object.keys(FONTS) as FontKey[];

export const BTN_SHAPES: Record<BtnShape, { label: string; radius: string }> = {
  pill: { label: "Pill", radius: "999px" },
  rounded: { label: "Rounded", radius: "14px" },
  square: { label: "Square", radius: "2px" },
};

export const BTN_STYLES: Record<BtnStyle, string> = {
  fill: "Filled",
  outline: "Outline",
  soft: "Soft",
  glass: "Glass",
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
  if (design.btnShape) t.btnRadius = BTN_SHAPES[design.btnShape].radius;

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
    default:
      // Ziadny styl nevybrany — farby sa daju prepisat aj samostatne
      if (safeColor(design.btnBg)) t.btnBg = bg;
      if (safeColor(design.btnText)) t.btnText = fg;
  }

  if (design.font) t.font = FONTS[design.font].css;
  if (design.fontHeading) t.fontHeading = FONTS[design.fontHeading].css;
  if (design.btnSize) t.size = BTN_SIZES[design.btnSize];

  return t;
}
