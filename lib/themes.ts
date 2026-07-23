export type ThemeKey =
  | "classic"
  | "noir"
  | "sand"
  | "bloom"
  | "mono"
  | "ocean"
  | "aurora"
  | "clay"
  | "lavender"
  | "midnight";

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
  /** Advanced Pro/Business button controls. */
  btnWeight?: number;
  /** Global link-button motion selected in Design studio. */
  btnAnimation?: "none" | "pulse" | "shake" | "glow";
  avatarBg: string;
  avatarText: string;
  /** Tvar/velkost/prstenec profilovky — doplna resolveTheme z `design`.
   *  V presetoch sa neuvadzaju, render pouziva fallbacky (kruh, 96px, bez ramu). */
  avatarRadius?: string;
  avatarSizePx?: number;
  avatarWidthPx?: number;
  avatarHeightPx?: number;
  avatarRing?: string;
  avatarBorder?: string;
  avatarShadow?: string;
  avatarFit?: "cover" | "contain";
  avatarPosition?: "center" | "top" | "bottom";
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
  ocean: {
    label: "Ocean",
    swatch: "linear-gradient(135deg, #071d2d, #0e7490)",
    page: "linear-gradient(160deg, #061826 0%, #0b3445 52%, #0e7490 100%)",
    text: "#ecfeff",
    muted: "#a5d8df",
    btnBg: "rgba(236,254,255,0.12)",
    btnText: "#ecfeff",
    btnBorder: "1px solid rgba(236,254,255,0.24)",
    btnRadius: "18px",
    btnShadow: "0 12px 32px rgba(0,0,0,0.18)",
    btnBackdrop: "blur(12px)",
    font: SANS,
    avatarBg: "#ecfeff",
    avatarText: "#082f49",
    glow: "radial-gradient(34rem 25rem at 12% -8%, rgba(34,211,238,0.23), transparent 62%), radial-gradient(28rem 22rem at 96% 108%, rgba(45,212,191,0.16), transparent 60%)",
  },
  aurora: {
    label: "Aurora",
    swatch: "linear-gradient(135deg, #312e81, #14b8a6)",
    page: "linear-gradient(145deg, #241f55 0%, #4c1d75 46%, #0f766e 100%)",
    text: "#ffffff",
    muted: "#ddd6fe",
    btnBg: "rgba(255,255,255,0.17)",
    btnText: "#ffffff",
    btnBorder: "1px solid rgba(255,255,255,0.3)",
    btnRadius: "999px",
    btnShadow: "0 14px 34px rgba(15,23,42,0.22)",
    btnBackdrop: "blur(12px)",
    font: DISPLAY,
    avatarBg: "#ffffff",
    avatarText: "#312e81",
    glow: "radial-gradient(30rem 24rem at 8% 4%, rgba(244,114,182,0.26), transparent 58%), radial-gradient(32rem 26rem at 100% 100%, rgba(45,212,191,0.24), transparent 60%)",
  },
  clay: {
    label: "Clay",
    swatch: "linear-gradient(135deg, #f3d5c2, #b4533c)",
    page: "linear-gradient(165deg, #f7e7dc 0%, #e9c6af 100%)",
    text: "#42251f",
    muted: "#775249",
    btnBg: "#fff9f4",
    btnText: "#42251f",
    btnBorder: "1px solid rgba(66,37,31,0.1)",
    btnRadius: "20px",
    btnShadow: "0 10px 26px rgba(101,54,42,0.12)",
    font: SERIF,
    fontHeading: DISPLAY,
    avatarBg: "#9f4937",
    avatarText: "#fff9f4",
    glow: "radial-gradient(34rem 24rem at 50% -5%, rgba(255,255,255,0.5), transparent 62%)",
  },
  lavender: {
    label: "Lavender",
    swatch: "linear-gradient(135deg, #eee7ff, #a78bfa)",
    page: "linear-gradient(155deg, #f5f1ff 0%, #e8e0ff 56%, #d8e7ff 100%)",
    text: "#30244f",
    muted: "#70628f",
    btnBg: "rgba(255,255,255,0.72)",
    btnText: "#30244f",
    btnBorder: "1px solid rgba(83,62,128,0.1)",
    btnRadius: "999px",
    btnShadow: "0 10px 28px rgba(72,52,120,0.1)",
    btnBackdrop: "blur(10px)",
    font: SANS,
    fontHeading: DISPLAY,
    avatarBg: "#5b4a86",
    avatarText: "#f8f5ff",
    glow: "radial-gradient(28rem 22rem at 12% 0%, rgba(255,255,255,0.72), transparent 60%), radial-gradient(30rem 24rem at 98% 105%, rgba(96,165,250,0.18), transparent 62%)",
  },
  midnight: {
    label: "Midnight",
    swatch: "linear-gradient(135deg, #020617, #4f46e5)",
    page: "linear-gradient(165deg, #020617 0%, #111836 55%, #24205b 100%)",
    text: "#f8fafc",
    muted: "#aeb9d1",
    btnBg: "#f8fafc",
    btnText: "#111827",
    btnBorder: "1px solid rgba(255,255,255,0.9)",
    btnRadius: "12px",
    btnShadow: "0 12px 30px rgba(0,0,0,0.3)",
    font: SANS,
    fontHeading: SANS,
    avatarBg: "#f8fafc",
    avatarText: "#111827",
    glow: "radial-gradient(32rem 24rem at 50% -8%, rgba(99,102,241,0.32), transparent 60%), radial-gradient(26rem 20rem at 92% 108%, rgba(14,165,233,0.14), transparent 60%)",
  },
};

export function getTheme(key: string | null | undefined): Theme {
  const preset = THEMES[(key ?? "classic") as ThemeKey] ?? THEMES.classic;
  return { ...preset, size: BTN_SIZES.md };
}

export const THEME_KEYS = Object.keys(THEMES) as ThemeKey[];
