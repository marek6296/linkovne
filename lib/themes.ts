export type ThemeKey = "classic" | "noir" | "sand" | "bloom" | "mono";

export type BtnSize = "sm" | "md" | "lg";

export type Sizing = {
  padY: string;
  padX: string;
  font: string;
  thumb: string;
  coverH: string;
};

export const BTN_SIZES: Record<BtnSize, Sizing> = {
  sm: {
    padY: "0.65rem",
    padX: "1.1rem",
    font: "0.875rem",
    thumb: "2.25rem",
    coverH: "5.5rem",
  },
  md: {
    padY: "1rem",
    padX: "1.5rem",
    font: "1rem",
    thumb: "2.75rem",
    coverH: "7rem",
  },
  lg: {
    padY: "1.35rem",
    padX: "1.75rem",
    font: "1.125rem",
    thumb: "3.25rem",
    coverH: "9rem",
  },
};

export const BTN_SIZE_LABELS: Record<BtnSize, string> = {
  sm: "Small",
  md: "Medium",
  lg: "Large",
};

export type Theme = {
  label: string;
  /** Preview swatch for the theme picker */
  swatch: string;
  page: string;
  text: string;
  muted: string;
  btnBg: string;
  btnText: string;
  btnBorder: string;
  btnRadius: string;
  btnShadow: string;
  /** Nastavene len pri glass style */
  btnBackdrop?: string;
  font: string;
  /** Font mena v hlavicke — ak nie je, pouzije sa `font` */
  fontHeading?: string;
  avatarBg: string;
  avatarText: string;
  /** Tvar/velkost/prstenec profilovky — doplna resolveTheme z `design`.
   *  V presetoch sa neuvadzaju, render pouziva fallbacky (kruh, 96px, bez ramu). */
  avatarRadius?: string;
  avatarSizePx?: number;
  avatarRing?: string;
  /** Pozadie za kartou na PC (desktop backdrop). `deskBg` je CSS background,
   *  `deskBlur` hovori ci sa ma pouzit rozmazany „glow" efekt (auto rezim). */
  deskBg?: string;
  deskBlur?: boolean;
  /** Jemne dekorativne pozadie (radial bloby) za obsahom — dava profilu hlbku
   *  namiesto plochej farby. Nizka priehladnost, ladi s paletou temy. */
  glow?: string;
  /** Doplna getTheme / resolveTheme — v presetoch sa neuvadza */
  size?: Sizing;
};

const SANS = "var(--font-instrument-sans), system-ui, sans-serif";
const SERIF = "var(--font-instrument-serif), Georgia, serif";
const DISPLAY = "var(--font-fraunces), Georgia, serif";

export const THEMES: Record<ThemeKey, Theme> = {
  classic: {
    label: "Classic",
    swatch: "#faf9f6",
    page: "#faf9f6",
    text: "#191813",
    muted: "#5c5a52",
    btnBg: "#ffffff",
    btnText: "#191813",
    btnBorder: "1px solid #e8e6df",
    btnRadius: "999px",
    btnShadow: "0 1px 2px rgba(25,24,19,0.04)",
    font: SANS,
    avatarBg: "#191813",
    avatarText: "#faf9f6",
    glow: "radial-gradient(36rem 24rem at 50% -10%, rgba(255,178,120,0.16), transparent 62%), radial-gradient(30rem 22rem at 88% 112%, rgba(120,150,255,0.10), transparent 60%)",
  },
  noir: {
    label: "Noir",
    swatch: "#0e0e10",
    page: "#0e0e10",
    text: "#f4f4f5",
    muted: "#a1a1aa",
    btnBg: "rgba(255,255,255,0.05)",
    btnText: "#f4f4f5",
    btnBorder: "1px solid rgba(255,255,255,0.14)",
    btnRadius: "999px",
    btnShadow: "none",
    font: SANS,
    avatarBg: "#f4f4f5",
    avatarText: "#0e0e10",
    glow: "radial-gradient(38rem 28rem at 50% -8%, rgba(129,110,255,0.20), transparent 60%), radial-gradient(32rem 24rem at 88% 110%, rgba(60,120,255,0.12), transparent 62%)",
  },
  sand: {
    label: "Sand",
    swatch: "#e9e0d1",
    page: "linear-gradient(180deg, #f3ece1 0%, #e3d7c3 100%)",
    text: "#3d3226",
    muted: "#7a6a55",
    btnBg: "#fffdf9",
    btnText: "#3d3226",
    btnBorder: "1px solid rgba(61,50,38,0.10)",
    btnRadius: "14px",
    btnShadow: "0 2px 10px rgba(61,50,38,0.08)",
    font: SERIF,
    avatarBg: "#3d3226",
    avatarText: "#f3ece1",
    glow: "radial-gradient(34rem 24rem at 50% -6%, rgba(255,224,170,0.30), transparent 60%)",
  },
  bloom: {
    label: "Bloom",
    swatch: "#f7d9e3",
    page: "linear-gradient(165deg, #fde8ef 0%, #f6e4f8 55%, #e6e9fb 100%)",
    text: "#2f2336",
    muted: "#6c5b76",
    btnBg: "rgba(255,255,255,0.72)",
    btnText: "#2f2336",
    btnBorder: "1px solid rgba(255,255,255,0.9)",
    btnRadius: "999px",
    btnShadow: "0 6px 20px rgba(47,35,54,0.10)",
    font: DISPLAY,
    avatarBg: "#2f2336",
    avatarText: "#fde8ef",
    glow: "radial-gradient(30rem 22rem at 22% 2%, rgba(255,255,255,0.55), transparent 55%), radial-gradient(30rem 24rem at 90% 108%, rgba(150,160,255,0.20), transparent 60%)",
  },
  mono: {
    label: "Mono",
    swatch: "#ffffff",
    page: "#ffffff",
    text: "#000000",
    muted: "#666666",
    btnBg: "#000000",
    btnText: "#ffffff",
    btnBorder: "1px solid #000000",
    btnRadius: "2px",
    btnShadow: "none",
    font: SANS,
    avatarBg: "#000000",
    avatarText: "#ffffff",
  },
};

export function getTheme(key: string | null | undefined): Theme {
  const preset = THEMES[(key ?? "classic") as ThemeKey] ?? THEMES.classic;
  return { ...preset, size: BTN_SIZES.md };
}

export const THEME_KEYS = Object.keys(THEMES) as ThemeKey[];
