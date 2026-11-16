"use client";
import { CoverPhotoPicker } from "./cover-photo-picker";
import { PremiumProfileControls } from "./premium-profile-controls";
import { ProfileVideoUpload } from "@/components/editor/profile-video-upload";

import { useRef, useState } from "react";
import {
  AVATAR_ASPECTS,
  AVATAR_FRAMES,
  AVATAR_SHAPES,
  AVATAR_SIZES,
  BTN_ANIMATIONS,
  BTN_BORDERS,
  BTN_SHAPES,
  BTN_SHADOWS,
  BTN_SPACING,
  BTN_STYLES,
  BTN_WEIGHTS,
  CONTENT_WIDTHS,
  FONT_KEYS,
  FONTS,
  PROFILE_LAYOUTS,
  PROFILE_TEXT_SIZES,
  type ProfileTextSize,
  resolveTheme,
  readableText,
  safeColor,
  type AvatarAspect,
  type AvatarFit,
  type AvatarFrame,
  type AvatarPosition,
  type AvatarShape,
  type AvatarSize,
  type BgMode,
  type BtnAnimation,
  type BtnShape,
  type BtnBorder,
  type BtnShadow,
  type BtnSpacing,
  type BtnStyle,
  type BtnWeight,
  type ContentWidth,
  type Design,
  type DeskBgMode,
  type ProfileLayout,
} from "@/lib/design";
import { BTN_SIZE_LABELS, getTheme, type BtnSize } from "@/lib/themes";
import { uploadImage } from "@/lib/upload";
import {
  LINK_LAYOUT_KEYS,
  LINK_LAYOUTS,
  LINK_TEXT_SIZES,
  type Block,
  type BlockConfig,
  type LinkLayout,
  type LinkTextSize,
} from "@/lib/blocks";
import { Icon, ICON_KEYS } from "@/components/blocks/icon";
import type { DesignCaps } from "@/lib/design-tiers";

/**
 * Customizacia dizajnu — 4 taby (Background · Photo · Buttons · Font) namiesto
 * jednej dlhej steny nastaveni. Volby tvaru/stylu su VIZUALNE (mini nahlad
 * tvaru priamo v chipe), farby maju vedla seba hex kod. Jednotny vzhlad:
 * skupinovy label hore, chipy pod nim, farebne riadky dole.
 */

const BG_MODES: { key: BgMode; label: string }[] = [
  { key: "theme", label: "Theme" },
  { key: "solid", label: "Colour" },
  { key: "gradient", label: "Gradient" },
  { key: "image", label: "Photo / video" },
];

const DESK_BG_MODES: { key: DeskBgMode; label: string }[] = [
  { key: "auto", label: "Auto glow" },
  { key: "solid", label: "Colour" },
  { key: "gradient", label: "Gradient" },
  { key: "image", label: "Photo" },
];

/** Hotove gradienty na jeden klik — nastavia obe farby aj farbu textu. */
const GRADIENT_PRESETS: { from: string; to: string; text: string }[] = [
  { from: "#ff8a5c", to: "#d64d7a", text: "#ffffff" }, // sunset
  { from: "#1e3a8a", to: "#0ea5b7", text: "#ffffff" }, // ocean
  { from: "#2dd4bf", to: "#7c3aed", text: "#ffffff" }, // aurora
  { from: "#ffd3a5", to: "#fd6585", text: "#3a1f2b" }, // peach
  { from: "#a18cd1", to: "#fbc2eb", text: "#2e2545" }, // lavender
  { from: "#4c1d95", to: "#7c3aed", text: "#f5f3ff" }, // grape
  { from: "#fde8ef", to: "#e9d5f2", text: "#2f2336" }, // blush
  { from: "#0f2027", to: "#2c5364", text: "#ffffff" }, // steel
  { from: "#f7971e", to: "#ffd200", text: "#3a2a00" }, // gold
  { from: "#141e30", to: "#243b55", text: "#eaf0ff" }, // navy night
];

export type DesignTab =
  "layout" | "theme" | "bg" | "avatar" | "buttons" | "font";

const TABS: { key: DesignTab; label: string }[] = [
  { key: "layout", label: "Layout" },
  { key: "theme", label: "Theme" },
  { key: "bg", label: "Background" },
  { key: "avatar", label: "Photo" },
  { key: "buttons", label: "Buttons" },
  { key: "font", label: "Text" },
];

export type ThemeOption = {
  key: string;
  label: string;
  swatch: string;
  page: string;
  text: string;
  button: string;
  locked: boolean;
};

/** Ikonka tabu — jemny vizualny kluc, aby tab bar posobil premiovejsie. */
function TabIcon({ tab }: { tab: DesignTab }) {
  const cn = "h-4 w-4";
  const p = { fill: "none", stroke: "currentColor", strokeWidth: 1.7 } as const;
  switch (tab) {
    case "layout":
      return (
        <svg viewBox="0 0 24 24" className={cn} {...p} aria-hidden>
          <rect x="4" y="3.5" width="16" height="17" rx="3" />
          <circle cx="9" cy="9" r="2" />
          <path d="M7 14h10M7 17h10" />
        </svg>
      );
    case "theme":
      return (
        <svg viewBox="0 0 24 24" className={cn} {...p} aria-hidden>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 3.5v17M3.5 12h17" strokeOpacity="0.5" />
        </svg>
      );
    case "bg":
      return (
        <svg viewBox="0 0 24 24" className={cn} {...p} aria-hidden>
          <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
          <path d="M3.5 15l4-4 4 4 4-5 5 5" />
        </svg>
      );
    case "avatar":
      return (
        <svg viewBox="0 0 24 24" className={cn} {...p} aria-hidden>
          <circle cx="12" cy="9" r="3.5" />
          <path d="M5 19c1.4-3.2 4-4.6 7-4.6s5.6 1.4 7 4.6" />
        </svg>
      );
    case "buttons":
      return (
        <svg viewBox="0 0 24 24" className={cn} {...p} aria-hidden>
          <rect x="3.5" y="8" width="17" height="8" rx="4" />
        </svg>
      );
    case "font":
      return (
        <svg viewBox="0 0 24 24" className={cn} {...p} aria-hidden>
          <path d="M6 19l5-14 5 14M8 13.5h6" />
        </svg>
      );
  }
}

/** Maly zamok pre uzamknute (platene) temy. */
function LockGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-3.5 w-3.5 opacity-70"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

/** Skupinovy nadpis vnutri tabu — rovnaky styl ako labely v editore. */
function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold tracking-wide text-faint uppercase">
      {children}
    </p>
  );
}

/** Maly „Pro" odznak pri premium skupine. */
function ProPill() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-ink px-2 py-0.5 text-[9px] font-bold tracking-widest text-paper uppercase">
      <LockGlyph />
      Pro
    </span>
  );
}

/**
 * Obal pre premium ovladac. Ked je `locked`, ukaze obsah stlmene a preklikom
 * spusti upsell (namiesto samotnej zmeny). Free tak VIDI, co by odomkol.
 */
function Locked({
  locked,
  onUpsell,
  children,
}: {
  locked: boolean;
  onUpsell: () => void;
  children: React.ReactNode;
}) {
  if (!locked) return <>{children}</>;
  return (
    <div className="relative">
      <div inert className="pointer-events-none select-none opacity-45">
        {children}
      </div>
      <button
        type="button"
        onClick={onUpsell}
        aria-label="Upgrade to unlock"
        className="absolute inset-0 flex items-center justify-center rounded-xl bg-paper/5 transition hover:bg-paper/15"
      >
        <ProPill />
      </button>
    </div>
  );
}

/**
 * Krokovy slider nad diskretnymi hodnotami (napr. velkost). Tahaci ovladac
 * s live labelom a bodkami krokov — plynulejsi a premiovejsi ako rad chipov.
 */
function StepSlider<T extends string>({
  label,
  keys,
  value,
  labelOf,
  onChange,
}: {
  label: string;
  keys: readonly T[];
  value: T;
  labelOf: (k: T) => string;
  onChange: (v: T) => void;
}) {
  const idx = Math.max(0, keys.indexOf(value));
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <GroupLabel>{label}</GroupLabel>
        <span className="rounded-full bg-ink/[0.06] px-2 py-0.5 text-[11px] font-semibold text-ink">
          {labelOf(keys[idx])}
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={keys.length - 1}
        step={1}
        value={idx}
        onChange={(e) => onChange(keys[Number(e.target.value)])}
        aria-label={label}
        aria-valuetext={labelOf(keys[idx])}
        className="mt-2.5 w-full cursor-pointer accent-ink"
      />
      <div className="mt-1 flex justify-between px-1">
        {keys.map((k) => (
          <span
            key={k}
            className={`h-1 w-1 rounded-full transition ${
              k === value ? "bg-ink" : "bg-line"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

/** Chip s vizualnym nahladom (tvar/styl) + textom. */
function VisualChip({
  active,
  onClick,
  glyph,
  label,
  locked = false,
}: {
  active: boolean;
  onClick: () => void;
  glyph: React.ReactNode;
  label: string;
  locked?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition ${
        active
          ? "border-ink bg-ink/[0.04] font-medium"
          : "border-line hover:border-soft"
      } ${locked ? "opacity-60" : ""}`}
    >
      {glyph}
      {label}
      {locked && <LockGlyph />}
    </button>
  );
}

function FontGrid({
  value,
  onPick,
}: {
  value: string | undefined;
  onPick: (font: (typeof FONT_KEYS)[number]) => void;
}) {
  return (
    <div className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
      {FONT_KEYS.map((k) => (
        <button
          key={k}
          type="button"
          onClick={() => onPick(k)}
          aria-pressed={value === k}
          className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left transition ${
            value === k
              ? "border-ink bg-ink/[0.04] ring-1 ring-ink"
              : "border-line hover:border-soft"
          }`}
        >
          <span
            className="w-8 shrink-0 text-center text-xl leading-none"
            style={{ fontFamily: FONTS[k].css }}
          >
            Aa
          </span>
          <span className="min-w-0 truncate text-xs font-medium">
            {FONTS[k].label}
          </span>
        </button>
      ))}
    </div>
  );
}

/** Farebny riadok — label vlavo, vyber farby + hex kod vpravo. */
function ColorRow({
  label,
  value,
  fallback,
  onChange,
}: {
  label: string;
  value: string | undefined;
  fallback: string;
  onChange: (v: string) => void;
}) {
  const current = value ?? fallback;
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <span className="text-sm text-soft">{label}</span>
      <label className="group flex cursor-pointer items-center gap-2.5 rounded-full border border-line bg-paper/50 py-1 pr-1 pl-3 transition hover:border-ink/40">
        <code className="text-xs font-medium tracking-wide text-faint uppercase transition group-hover:text-ink">
          {current}
        </code>
        <span
          className="relative h-7 w-7 overflow-hidden rounded-full border border-black/10 shadow-[inset_0_1px_2px_rgba(0,0,0,0.15)] ring-1 ring-black/5"
          style={{ background: current }}
        >
          <input
            type="color"
            aria-label={label}
            value={current}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </span>
      </label>
    </div>
  );
}

export function DesignPanel({
  design,
  caps,
  userId,
  themes,
  activeTheme,
  onPickTheme,
  onChange,
  onReset,
  onUpsell,
  tab,
  onTabChange,
  linkBlocks,
  buttonTarget,
  onButtonTargetChange,
  onLinkChange,
  onAllButtonAnimation,
}: {
  design: Design;
  caps: DesignCaps;
  userId: string;
  themes: ThemeOption[];
  activeTheme: string;
  onPickTheme: (key: string) => void;
  onChange: (patch: Design) => void;
  onReset: () => void;
  onUpsell: () => void;
  tab: DesignTab;
  onTabChange: (tab: DesignTab) => void;
  linkBlocks: Block[];
  buttonTarget: string;
  onButtonTargetChange: (target: string) => void;
  onLinkChange: (id: string, patch: Partial<BlockConfig>) => void;
  onAllButtonAnimation: (animation: BtnAnimation) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const deskFileRef = useRef<HTMLInputElement>(null);
  const buttonFileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [deskBusy, setDeskBusy] = useState(false);
  const [buttonBusy, setButtonBusy] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [buttonError, setButtonError] = useState<string | null>(null);
  const resolved = resolveTheme(activeTheme, design);
  const isEditorial = resolved.profileLayout === "editorial";
  const isSpotlight = resolved.profileLayout === "hero";
  const photoShape = isSpotlight
    ? design.avatarShape === "square" ? "square" : "rounded"
    : design.avatarShape ?? "circle";
  const bg = design.bg ?? "theme";
  const deskBg = design.deskBg ?? "auto";
  const selectedButton = linkBlocks.find((block) => block.id === buttonTarget);
  const selectedConfig = selectedButton?.config;
  const activeButtonTarget = selectedButton?.id ?? "all";
  const patchSelected = (patch: Partial<BlockConfig>) => {
    if (selectedButton) onLinkChange(selectedButton.id, patch);
  };

  function chooseButtonStyle(style: BtnStyle) {
    const theme = resolveTheme(activeTheme, design);
    const colour =
      safeColor(selectedConfig?.color ?? design.btnBg) ??
      safeColor(getTheme(activeTheme).btnBg) ??
      safeColor(theme.text) ??
      "#252525";
    const text = ["outline", "soft", "glass"].includes(style)
      ? theme.text
      : readableText(
          style === "gradient"
            ? (selectedConfig?.buttonGradientColor ??
                design.btnGradientColor ??
                colour)
            : colour,
        );
    if (selectedButton)
      patchSelected({
        buttonStyle: style,
        buttonBorder: undefined,
        color: colour,
        textColor: text,
      });
    else
      onChange({
        btnStyle: style,
        btnBorder: undefined,
        btnBg: colour,
        btnText: text,
      });
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_12px_35px_rgba(25,24,19,0.05)]">
      <div className="flex items-start justify-between gap-4 border-b border-line bg-paper/70 px-5 py-4">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold">Design studio</p>
            {caps.full ? (
              <span className="rounded-full bg-ink px-2 py-0.5 text-[9px] font-bold tracking-widest text-paper uppercase">
                Premium
              </span>
            ) : (
              <button
                type="button"
                onClick={onUpsell}
                className="inline-flex items-center gap-1 rounded-full border border-ink/20 px-2 py-0.5 text-[9px] font-bold tracking-widest text-ink uppercase transition hover:bg-ink hover:text-paper"
              >
                <LockGlyph />
                Unlock Pro
              </button>
            )}
          </div>
          <p className="mt-1 text-xs text-soft">
            {caps.full
              ? "Changes appear in your draft preview. Publish when you are ready."
              : "Style your page freely — a few extras unlock with Pro."}
          </p>
        </div>
      </div>
      {/* Taby — vzdy vidno len jednu skupinu nastaveni */}
      <div className="border-b border-line p-2.5">
        <div className="grid grid-cols-3 gap-1 sm:grid-cols-6">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              aria-pressed={tab === t.key}
              onClick={() => onTabChange(t.key)}
              className={`flex min-w-[76px] flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-medium transition ${
                tab === t.key
                  ? "bg-ink text-paper shadow-[0_4px_14px_rgba(25,24,19,0.18)]"
                  : "text-soft hover:bg-black/[0.04] hover:text-ink"
              }`}
            >
              <TabIcon tab={t.key} />
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {uploadError && (
        <p role="alert" className="mx-5 mt-4 text-sm text-danger">
          {uploadError}
        </p>
      )}
      <div className="min-h-[230px] p-5" key={tab}>
        {/* ---------- Layout ---------- */}
        {tab === "layout" && (
          <div className="space-y-5">
            <div>
              <GroupLabel>Profile composition</GroupLabel>
              <p className="mt-1 text-xs leading-relaxed text-soft">
                Change the whole first impression without touching your content.
              </p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {(Object.keys(PROFILE_LAYOUTS) as ProfileLayout[]).map(
                  (key) => {
                    const active = (design.profileLayout ?? "centered") === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        aria-pressed={active}
                        onClick={() => !caps.full && ["cover", "editorial", "hero"].includes(key) ? onUpsell() : onChange({ profileLayout: key })}
                        className={`rounded-2xl border p-2.5 text-left transition ${
                          active
                            ? "border-ink bg-ink/[0.035] ring-1 ring-ink"
                            : "border-line hover:border-soft"
                        }`}
                      >
                        <span className="block h-24 overflow-hidden rounded-xl border border-line bg-paper p-2">
                          {key === "hero" ? (
                            <>
                              <span className="relative block h-14 rounded-lg bg-gradient-to-br from-neutral-300 to-neutral-500">
                                <span className="absolute bottom-1.5 left-2 h-1.5 w-10 rounded-full bg-white" />
                                <span className="absolute bottom-1.5 right-2 h-1.5 w-4 rounded-full bg-white/60" />
                              </span>
                              <span className="mt-2 block h-2.5 rounded-full bg-ink/80" />
                            </>
                          ) : key === "compact" ? (
                            <>
                              <span className="flex items-center gap-2 py-1">
                                <span className="h-8 w-8 rounded-lg bg-ink/20" />
                                <span className="flex-1 space-y-1">
                                  <span className="block h-2 rounded-full bg-ink/80" />
                                  <span className="block h-1.5 w-3/4 rounded-full bg-ink/20" />
                                </span>
                              </span>
                              <span className="mt-2 block h-2.5 rounded-full bg-ink/80" />
                              <span className="mt-1.5 block h-2.5 rounded-full bg-ink/20" />
                            </>
                          ) : (
                            <>
                              <span className="mx-auto block h-8 w-8 rounded-full bg-ink/20" />
                              <span className="mx-auto mt-1.5 block h-2 w-12 rounded-full bg-ink/80" />
                              <span className="mt-2 block h-2.5 rounded-full bg-ink/80" />
                              <span className="mt-1.5 block h-2.5 rounded-full bg-ink/20" />
                            </>
                          )}
                        </span>
                        <span className="mt-2 block text-xs font-semibold">
                          {PROFILE_LAYOUTS[key].label}{["cover", "editorial", "hero"].includes(key) && " · Pro"}
                        </span>
                        <span className="mt-0.5 hidden text-[11px] leading-snug text-soft sm:block">
                          {PROFILE_LAYOUTS[key].hint}
                        </span>
                      </button>
                    );
                  },
                )}
              </div>
            </div>

            <div className="grid gap-5 border-t border-line pt-4 sm:grid-cols-2">
              <div>
                <GroupLabel>Page width</GroupLabel>
                <div className="mt-2 flex rounded-xl bg-black/[0.035] p-1">
                  {(Object.keys(CONTENT_WIDTHS) as ContentWidth[]).map(
                    (key) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => onChange({ contentWidth: key })}
                        className={`flex-1 rounded-lg px-2 py-2 text-xs transition ${
                          (design.contentWidth ?? "balanced") === key
                            ? "bg-paper font-medium shadow-sm"
                            : "text-soft"
                        }`}
                      >
                        {CONTENT_WIDTHS[key].label}
                      </button>
                    ),
                  )}
                </div>
              </div>

              <div>
                <GroupLabel>Vertical rhythm</GroupLabel>
                <div className="mt-2 flex rounded-xl bg-black/[0.035] p-1">
                  {(Object.keys(BTN_SPACING) as BtnSpacing[]).map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => onChange({ btnSpacing: key })}
                      className={`flex-1 rounded-lg px-2 py-2 text-xs transition ${
                        (design.btnSpacing ?? "normal") === key
                          ? "bg-paper font-medium shadow-sm"
                          : "text-soft"
                      }`}
                    >
                      {BTN_SPACING[key].label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <PremiumProfileControls design={design} allowed={caps.full} userId={userId} onChange={onChange} onUpsell={onUpsell} />
          </div>
        )}

        {/* ---------- Theme ---------- */}
        {tab === "theme" && (
          <div className="space-y-4">
            <div>
              <GroupLabel>Theme collection</GroupLabel>
              <p className="mt-1 text-xs leading-relaxed text-soft">
                Start with a curated look, then fine-tune every detail in the
                other tabs.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {themes.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => onPickTheme(t.key)}
                  aria-pressed={activeTheme === t.key}
                  className={`group overflow-hidden rounded-xl border text-left transition ${
                    activeTheme === t.key
                      ? "border-ink ring-1 ring-ink"
                      : "border-line hover:border-soft"
                  }`}
                >
                  <span
                    className="block h-16 p-2.5"
                    style={{ background: t.page, color: t.text }}
                  >
                    <span className="mx-auto block h-2 w-7 rounded-full bg-current opacity-70" />
                    <span
                      className="mx-auto mt-2 block h-3.5 w-full max-w-20 rounded-full border border-black/5"
                      style={{ background: t.button }}
                    />
                    <span
                      className="mx-auto mt-1.5 block h-3.5 w-full max-w-20 rounded-full border border-black/5"
                      style={{ background: t.button }}
                    />
                  </span>
                  <span className="flex items-center justify-between gap-2 px-2.5 py-2 text-xs font-medium">
                    {t.label}
                    {t.locked && <LockGlyph />}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ---------- Background ---------- */}
        {tab === "bg" && (
          <div className="space-y-4">
            <div>
              <GroupLabel>Style</GroupLabel>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {BG_MODES.map((o) => {
                  const locked = o.key === "image" && !caps.bgImage;
                  return (
                    <button
                      key={o.key}
                      type="button"
                      onClick={() =>
                        locked ? onUpsell() : onChange({ bg: o.key })
                      }
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm transition ${
                        bg === o.key
                          ? "border-ink bg-ink text-paper"
                          : "border-line hover:border-soft"
                      } ${locked ? "opacity-60" : ""}`}
                    >
                      {o.label}
                      {locked && <LockGlyph />}
                    </button>
                  );
                })}
              </div>
              {bg === "theme" && (
                <p className="mt-3 text-xs text-soft">
                  Uses your theme&apos;s own background. Pick Colour, Gradient
                  or Photo to override it.
                </p>
              )}
            </div>

            {bg === "solid" && (
              <div className="border-t border-line pt-3">
                <ColorRow
                  label="Background colour"
                  value={design.bgColor}
                  fallback="#faf9f6"
                  onChange={(bgColor) => onChange({ bgColor })}
                />
              </div>
            )}

            {bg === "gradient" && (
              <div className="border-t border-line pt-4">
                <GroupLabel>Presets</GroupLabel>
                <div className="mt-2 flex flex-wrap gap-2">
                  {GRADIENT_PRESETS.map((g) => {
                    const active =
                      design.bgColor === g.from && design.bgColor2 === g.to;
                    return (
                      <button
                        key={`${g.from}-${g.to}`}
                        type="button"
                        aria-label="Gradient preset"
                        onClick={() =>
                          onChange({
                            bgColor: g.from,
                            bgColor2: g.to,
                            textColor: g.text,
                          })
                        }
                        className={`h-9 w-9 rounded-full border-2 transition hover:scale-105 ${
                          active ? "border-ink" : "border-line"
                        }`}
                        style={{
                          background: `linear-gradient(150deg, ${g.from}, ${g.to})`,
                        }}
                      />
                    );
                  })}
                </div>
                <div className="mt-2 divide-y divide-line/60">
                  <ColorRow
                    label="From"
                    value={design.bgColor}
                    fallback="#fde8ef"
                    onChange={(bgColor) => onChange({ bgColor })}
                  />
                  <ColorRow
                    label="To"
                    value={design.bgColor2}
                    fallback="#e6e9fb"
                    onChange={(bgColor2) => onChange({ bgColor2 })}
                  />
                </div>
              </div>
            )}

            {bg === "image" && (
              <div className="flex items-center gap-3 border-t border-line pt-4">
                {design.bgImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={design.bgImage}
                    alt=""
                    className="h-14 w-14 rounded-lg border border-line object-cover"
                  />
                ) : (
                  <div className="h-14 w-14 rounded-lg border border-dashed border-line" />
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setBusy(true);
                    setUploadError(null);
                    try {
                      onChange({ bgImage: await uploadImage(file, userId), bgVideo: undefined, bgVideoPoster: undefined });
                    } catch (error) {
                      setUploadError(
                        error instanceof Error
                          ? error.message
                          : "Could not upload the image. Try again.",
                      );
                    } finally {
                      setBusy(false);
                      e.target.value = "";
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={busy}
                  className="rounded-full border border-line px-4 py-2 text-sm transition hover:border-ink disabled:opacity-50"
                >
                  {busy
                    ? "Uploading…"
                    : design.bgImage
                      ? "Replace photo"
                      : "Upload photo"}
                </button>
              </div>
            )}

            {bg === "image" && <ProfileVideoUpload allowed={caps.full} userId={userId} value={design.bgVideo} onUpsell={onUpsell}
              onChange={(bgVideo, bgVideoPoster) => onChange({ bgVideo, bgVideoPoster })} />}
            {bg !== "theme" && (
              <div className="border-t border-line pt-1">
                <ColorRow
                  label="Text colour"
                  value={design.textColor}
                  fallback="#191813"
                  onChange={(textColor) => onChange({ textColor })}
                />
              </div>
            )}

            {/* ---- Desktop backdrop (pozadie za kartou, len PC) ---- */}
            <div className="border-t border-line pt-4">
              <div className="flex items-center gap-2">
                <GroupLabel>Behind the card · desktop</GroupLabel>
                {!caps.deskBackdrop && <ProPill />}
              </div>
              <p className="mt-1 text-xs text-soft">
                The area around your card on wide screens. On phones the card
                fills the screen, so this only shows on desktop.
              </p>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {DESK_BG_MODES.map((o) => {
                  const locked = o.key !== "auto" && !caps.deskBackdrop;
                  return (
                    <button
                      key={o.key}
                      type="button"
                      onClick={() =>
                        locked ? onUpsell() : onChange({ deskBg: o.key })
                      }
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm transition ${
                        deskBg === o.key
                          ? "border-ink bg-ink text-paper"
                          : "border-line hover:border-soft"
                      } ${locked ? "opacity-60" : ""}`}
                    >
                      {o.label}
                      {locked && <LockGlyph />}
                    </button>
                  );
                })}
              </div>
              {deskBg === "auto" && (
                <p className="mt-2 text-xs text-soft">
                  A soft blurred glow of your card&apos;s background.
                </p>
              )}

              {deskBg === "solid" && (
                <div className="mt-1">
                  <ColorRow
                    label="Backdrop colour"
                    value={design.deskBgColor}
                    fallback="#e9e7e2"
                    onChange={(deskBgColor) => onChange({ deskBgColor })}
                  />
                </div>
              )}

              {deskBg === "gradient" && (
                <>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {GRADIENT_PRESETS.map((g) => {
                      const active =
                        design.deskBgColor === g.from &&
                        design.deskBgColor2 === g.to;
                      return (
                        <button
                          key={`${g.from}-${g.to}`}
                          type="button"
                          aria-label="Gradient preset"
                          onClick={() =>
                            onChange({
                              deskBgColor: g.from,
                              deskBgColor2: g.to,
                            })
                          }
                          className={`h-9 w-9 rounded-full border-2 transition hover:scale-105 ${
                            active ? "border-ink" : "border-line"
                          }`}
                          style={{
                            background: `linear-gradient(150deg, ${g.from}, ${g.to})`,
                          }}
                        />
                      );
                    })}
                  </div>
                  <div className="mt-2 divide-y divide-line/60">
                    <ColorRow
                      label="From"
                      value={design.deskBgColor}
                      fallback="#0f2027"
                      onChange={(deskBgColor) => onChange({ deskBgColor })}
                    />
                    <ColorRow
                      label="To"
                      value={design.deskBgColor2}
                      fallback="#2c5364"
                      onChange={(deskBgColor2) => onChange({ deskBgColor2 })}
                    />
                  </div>
                </>
              )}

              {deskBg === "image" && (
                <div className="mt-3 flex items-center gap-3">
                  {design.deskBgImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={design.deskBgImage}
                      alt=""
                      className="h-14 w-14 rounded-lg border border-line object-cover"
                    />
                  ) : (
                    <div className="h-14 w-14 rounded-lg border border-dashed border-line" />
                  )}
                  <input
                    ref={deskFileRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setDeskBusy(true);
                      setUploadError(null);
                      try {
                        onChange({
                          deskBgImage: await uploadImage(file, userId),
                        });
                      } catch (error) {
                        setUploadError(
                          error instanceof Error
                            ? error.message
                            : "Could not upload the image. Try again.",
                        );
                      } finally {
                        setDeskBusy(false);
                        e.target.value = "";
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => deskFileRef.current?.click()}
                    disabled={deskBusy}
                    className="rounded-full border border-line px-4 py-2 text-sm transition hover:border-ink disabled:opacity-50"
                  >
                    {deskBusy
                      ? "Uploading…"
                      : design.deskBgImage
                        ? "Replace photo"
                        : "Upload photo"}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ---------- Profile photo ---------- */}
        {tab === "avatar" && (
          <div className="space-y-5">
            {resolved.profileLayout === "cover" && <CoverPhotoPicker value={design.coverImage} userId={userId} allowed={caps.full} onChange={coverImage => onChange({coverImage})} onUpsell={onUpsell} />}
            <ProfileVideoUpload allowed={caps.full} userId={userId} value={design.avatarVideo} onUpsell={onUpsell}
              onChange={(avatarVideo, avatarVideoPoster) => onChange({ avatarVideo, avatarVideoPoster })} />
            <div>
              <GroupLabel>{isSpotlight ? "Cover proportions" : "Format"}</GroupLabel>
              <p className="mt-1 text-xs text-soft">
                {isSpotlight
                  ? "Choose your cover proportions, then adjust its height below. The cover grows with your text."
                  : "Choose a square, portrait or landscape crop for your profile image."}
              </p>
              <div className="mt-2 grid grid-cols-4 gap-1.5">
                {(Object.keys(AVATAR_ASPECTS) as AvatarAspect[]).map((k) => {
                  const ratio = AVATAR_ASPECTS[k].ratio;
                  return (
                    <button
                      key={k}
                      type="button"
                      aria-pressed={(design.avatarAspect ?? "square") === k}
                      onClick={() => onChange({ avatarAspect: k })}
                      className={`flex min-h-16 flex-col items-center justify-center gap-1.5 rounded-xl border px-2 py-2 text-xs transition ${
                        (design.avatarAspect ?? "square") === k
                          ? "border-ink bg-ink/[0.04] font-medium"
                          : "border-line hover:border-soft"
                      }`}
                    >
                      <span
                        className="block max-h-7 border-[1.5px] border-current opacity-75"
                        style={{
                          width: ratio > 1 ? 28 : 22 * ratio,
                          height: ratio > 1 ? 28 / ratio : 28,
                          borderRadius: 5,
                        }}
                      />
                      {isSpotlight ? ({ square: "Classic", portrait: "Tall", landscape: "Wide", wide: "Panoramic" })[k] : AVATAR_ASPECTS[k].label}
                    </button>
                  );
                })}
              </div>
            </div>

            {!isEditorial && <div>
              <GroupLabel>{isSpotlight ? "Cover corners" : "Shape"}</GroupLabel>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {(isSpotlight ? ["rounded", "square"] as AvatarShape[] : Object.keys(AVATAR_SHAPES) as AvatarShape[]).map((k) => (
                  <VisualChip
                    key={k}
                    active={photoShape === k}
                    onClick={() => onChange({ avatarShape: k })}
                    label={AVATAR_SHAPES[k].label}
                    glyph={
                      <span
                        className="h-5 w-5 shrink-0 border-[1.5px] border-current opacity-80"
                        style={{
                          borderRadius:
                            k === "circle"
                              ? "999px"
                              : k === "rounded"
                                ? "7px"
                                : k === "organic"
                                  ? AVATAR_SHAPES.organic.radius
                                  : "2px",
                        }}
                      />
                    }
                  />
                ))}
              </div>
            </div>}
            {isEditorial && <p className="text-xs text-soft">Editorial uses an arched portrait. Adjust its height, crop and focal point below.</p>}
            <StepSlider
              label={isSpotlight || isEditorial ? "Cover height" : "Size"}
              keys={Object.keys(AVATAR_SIZES) as AvatarSize[]}
              value={design.avatarSize ?? "md"}
              labelOf={(k) => AVATAR_SIZES[k].label}
              onChange={(avatarSize) => onChange({ avatarSize })}
            />

            <div className="border-t border-line pt-4">
              <div className="flex items-center gap-2">
                <GroupLabel>Frame</GroupLabel>
                {!caps.avatarFrames && <ProPill />}
              </div>
              <div className="mt-2 grid grid-cols-3 gap-1.5 sm:grid-cols-5">
                {(Object.keys(AVATAR_FRAMES) as AvatarFrame[]).map((k) => {
                  const locked = k !== "none" && !caps.avatarFrames;
                  return (
                    <button
                      key={k}
                      type="button"
                      onClick={() =>
                        locked
                          ? onUpsell()
                          : onChange({ avatarFrame: k, avatarRing: false })
                      }
                      className={`inline-flex items-center justify-center gap-1 rounded-xl border px-2 py-2 text-xs transition ${
                        (design.avatarFrame ??
                          (design.avatarRing ? "line" : "shadow")) === k
                          ? "border-ink bg-ink/[0.04] font-medium"
                          : "border-line hover:border-soft"
                      } ${locked ? "opacity-60" : ""}`}
                    >
                      {AVATAR_FRAMES[k]}
                      {locked && <LockGlyph />}
                    </button>
                  );
                })}
              </div>
              {design.avatarFrame &&
                design.avatarFrame !== "none" &&
                design.avatarFrame !== "shadow" && (
                  <ColorRow
                    label="Frame colour"
                    value={design.avatarRingColor}
                    fallback="#ffffff"
                    onChange={(avatarRingColor) =>
                      onChange({ avatarRingColor })
                    }
                  />
                )}
            </div>

            <div className="grid gap-4 border-t border-line pt-4 sm:grid-cols-2">
              <div>
                <GroupLabel>Image fit</GroupLabel>
                <div className="mt-2 flex rounded-xl bg-black/[0.035] p-1">
                  {(["cover", "contain"] as AvatarFit[]).map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => onChange({ avatarFit: k })}
                      className={`flex-1 rounded-lg px-2 py-1.5 text-xs capitalize transition ${
                        (design.avatarFit ?? "cover") === k
                          ? "bg-paper font-medium shadow-sm"
                          : "text-soft"
                      }`}
                    >
                      {k}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <GroupLabel>Focal point</GroupLabel>
                <div className="mt-2 flex rounded-xl bg-black/[0.035] p-1">
                  {(["top", "center", "bottom"] as AvatarPosition[]).map(
                    (k) => (
                      <button
                        key={k}
                        type="button"
                        onClick={() => onChange({ avatarPosition: k })}
                        className={`flex-1 rounded-lg px-2 py-1.5 text-xs capitalize transition ${
                          (design.avatarPosition ?? "center") === k
                            ? "bg-paper font-medium shadow-sm"
                            : "text-soft"
                        }`}
                      >
                        {k}
                      </button>
                    ),
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ---------- Buttons ---------- */}
        {tab === "buttons" && (
          <div className="space-y-4">
            <div className="rounded-xl border border-line bg-paper p-4">
              <label
                className="block text-xs font-semibold"
                htmlFor="button-style-target"
              >
                Editing
              </label>
              <select
                id="button-style-target"
                className="field mt-2 py-2.5"
                value={activeButtonTarget}
                onChange={(e) => onButtonTargetChange(e.target.value)}
              >
                <option value="all">Page default · all buttons</option>
                {linkBlocks.map((block, index) => (
                  <option key={block.id} value={block.id}>
                    {index + 1}. {block.config.title || "Untitled link"}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs leading-relaxed text-soft">
                {selectedButton
                  ? "Only this button changes. Other buttons keep their style."
                  : "Sets the default for your page. Buttons with their own style keep their custom settings."}
              </p>
              {selectedButton && (
                <button
                  type="button"
                  className="mt-3 text-xs font-medium underline underline-offset-2"
                  onClick={() =>
                    patchSelected({
                      buttonStyle: undefined,
                      buttonShape: undefined,
                      buttonSize: undefined,
                      buttonShadow: undefined,
                      buttonBorder: undefined,
                      buttonWeight: undefined,
                      buttonTextSize: undefined,
                      color: undefined,
                      textColor: undefined,
                      buttonGradientColor: undefined,
                      buttonGradientColor2: undefined,
                      anim: undefined,
                      featured: undefined,
                    })
                  }
                >
                  Reset this button to page style
                </button>
              )}
            </div>

            {selectedButton && selectedConfig && (
              <details className="studio-advanced rounded-xl border border-line bg-paper/60 p-4">
                <summary>Image, icon & layout</summary>
                <div>
                  <GroupLabel>Button type</GroupLabel>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {LINK_LAYOUT_KEYS.map((key) => {
                      const active =
                        (selectedConfig.layout ??
                          (selectedConfig.thumb ? "thumb" : "bar")) === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          title={LINK_LAYOUTS[key].hint}
                          aria-pressed={active}
                          onClick={() => patchSelected({ layout: key })}
                          className={`rounded-full border px-3 py-1.5 text-sm transition ${
                            active
                              ? "border-ink bg-ink text-paper"
                              : "border-line hover:border-soft"
                          }`}
                        >
                          {LINK_LAYOUTS[key].label}
                        </button>
                      );
                    })}
                  </div>
                  {LINK_LAYOUTS[(selectedConfig.layout ?? "bar") as LinkLayout]
                    .needsImage &&
                    !selectedConfig.thumb && (
                      <p className="mt-2 text-xs text-soft">
                        This type needs an image. Upload one below.
                      </p>
                    )}
                </div>

                <div className="border-t border-line pt-4">
                  <GroupLabel>Image or icon</GroupLabel>
                  <input
                    ref={buttonFileRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={async (event) => {
                      const file = event.target.files?.[0];
                      if (!file) return;
                      setButtonError(null);
                      setButtonBusy(true);
                      try {
                        const thumb = await uploadImage(file, userId);
                        patchSelected({
                          thumb,
                          thumbBytes: file.size,
                          icon: undefined,
                        });
                      } catch (error) {
                        setButtonError(
                          error instanceof Error
                            ? error.message
                            : "The image could not be uploaded. Please try again.",
                        );
                      } finally {
                        setButtonBusy(false);
                        event.target.value = "";
                      }
                    }}
                  />
                  {selectedConfig.thumb ? (
                    <div className="mt-2 flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={selectedConfig.thumb}
                        alt=""
                        className="h-14 w-14 rounded-xl border border-line object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setButtonError(null);
                          patchSelected({
                            thumb: undefined,
                            thumbBytes: undefined,
                          });
                        }}
                        className="text-sm text-danger"
                      >
                        Remove image
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        disabled={buttonBusy}
                        onClick={() => buttonFileRef.current?.click()}
                        className="mt-2 rounded-full border border-line px-4 py-2 text-sm transition hover:border-ink disabled:opacity-50"
                      >
                        {buttonBusy ? "Uploading…" : "Upload image"}
                      </button>
                      <div className="mt-3 flex max-h-40 flex-wrap gap-1.5 overflow-y-auto pr-1">
                        {ICON_KEYS.map((key) => (
                          <button
                            key={key}
                            type="button"
                            title={key}
                            aria-label={key}
                            aria-pressed={selectedConfig.icon === key}
                            onClick={() =>
                              patchSelected({
                                icon:
                                  selectedConfig.icon === key ? undefined : key,
                              })
                            }
                            className={`flex h-9 w-9 items-center justify-center rounded-lg border transition ${
                              selectedConfig.icon === key
                                ? "border-ink bg-ink text-paper"
                                : "border-line text-soft hover:border-soft hover:text-ink"
                            }`}
                          >
                            <Icon name={key} className="h-[18px] w-[18px]" />
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                  {buttonError && (
                    <p role="alert" className="mt-2 text-xs text-danger">
                      {buttonError}
                    </p>
                  )}
                </div>
              </details>
            )}

            <div>
              <GroupLabel>Shape</GroupLabel>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {(Object.keys(BTN_SHAPES) as BtnShape[]).map((k) => (
                  <VisualChip
                    key={k}
                    active={
                      (selectedConfig?.buttonShape ?? design.btnShape) === k
                    }
                    onClick={() =>
                      selectedButton
                        ? patchSelected({ buttonShape: k })
                        : onChange({ btnShape: k })
                    }
                    label={BTN_SHAPES[k].label}
                    glyph={
                      <span
                        className="h-3.5 w-8 shrink-0 border-[1.5px] border-current opacity-80"
                        style={{
                          borderRadius:
                            BTN_SHAPES[k].radius === "999px"
                              ? "999px"
                              : BTN_SHAPES[k].radius === "14px"
                                ? "5px"
                                : "1px",
                        }}
                      />
                    }
                  />
                ))}
              </div>
            </div>

            <div>
              <GroupLabel>Style</GroupLabel>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {(Object.keys(BTN_STYLES) as BtnStyle[]).map((k) => {
                  const locked =
                    (k === "glass" || k === "gradient") && !caps.btnFancy;
                  return (
                    <VisualChip
                      key={k}
                      locked={locked}
                      active={
                        (selectedConfig?.buttonStyle ?? design.btnStyle) === k
                      }
                      onClick={() =>
                        locked ? onUpsell() : chooseButtonStyle(k)
                      }
                      label={BTN_STYLES[k]}
                      glyph={
                        <span
                          className={`h-3.5 w-8 shrink-0 rounded-full ${
                            k === "fill"
                              ? "bg-current opacity-80"
                              : k === "outline"
                                ? "border-[1.5px] border-current opacity-80"
                                : k === "soft"
                                  ? "bg-current opacity-30"
                                  : k === "gradient"
                                    ? "bg-gradient-to-r from-current to-transparent opacity-80"
                                    : "border border-current bg-current opacity-20"
                          }`}
                        />
                      }
                    />
                  );
                })}
              </div>
            </div>

            <div className="divide-y divide-line/60 border-t border-line pt-1">
              {(selectedConfig?.buttonStyle ?? design.btnStyle) ===
              "gradient" ? (
                <>
                  <ColorRow
                    label="Gradient from"
                    value={
                      selectedConfig?.buttonGradientColor ??
                      design.btnGradientColor
                    }
                    fallback="#7c3aed"
                    onChange={(buttonGradientColor) =>
                      selectedButton
                        ? patchSelected({ buttonGradientColor })
                        : onChange({ btnGradientColor: buttonGradientColor })
                    }
                  />
                  <ColorRow
                    label="Gradient to"
                    value={
                      selectedConfig?.buttonGradientColor2 ??
                      design.btnGradientColor2
                    }
                    fallback="#0ea5e9"
                    onChange={(buttonGradientColor2) =>
                      selectedButton
                        ? patchSelected({ buttonGradientColor2 })
                        : onChange({ btnGradientColor2: buttonGradientColor2 })
                    }
                  />
                </>
              ) : (
                <ColorRow
                  label="Button colour"
                  value={selectedConfig?.color ?? design.btnBg}
                  fallback="#ffffff"
                  onChange={(color) =>
                    selectedButton
                      ? patchSelected({ color })
                      : onChange({ btnBg: color })
                  }
                />
              )}
              <ColorRow
                label="Button text"
                value={selectedConfig?.textColor ?? design.btnText}
                fallback="#191813"
                onChange={(textColor) =>
                  selectedButton
                    ? patchSelected({ textColor })
                    : onChange({ btnText: textColor })
                }
              />
            </div>

            <div className="grid gap-4 border-t border-line pt-4 sm:grid-cols-2">
              <StepSlider
                label="Size"
                keys={Object.keys(BTN_SIZE_LABELS) as BtnSize[]}
                value={selectedConfig?.buttonSize ?? design.btnSize ?? "md"}
                labelOf={(k) => BTN_SIZE_LABELS[k]}
                onChange={(v) =>
                  selectedButton
                    ? patchSelected({ buttonSize: v })
                    : onChange({ btnSize: v })
                }
              />
              <div>
                <GroupLabel>Text size</GroupLabel>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {(Object.keys(LINK_TEXT_SIZES) as LinkTextSize[]).map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() =>
                        selectedButton
                          ? patchSelected({ buttonTextSize: k })
                          : onChange({ btnTextSize: k })
                      }
                      className={`rounded-full border px-3 py-1.5 text-xs transition ${
                        (selectedConfig?.buttonTextSize ??
                          design.btnTextSize ??
                          "md") === k
                          ? "border-ink bg-ink text-paper"
                          : "border-line hover:border-soft"
                      }`}
                    >
                      {LINK_TEXT_SIZES[k].label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <details className="studio-advanced">
              <summary>
                Motion ·{" "}
                {
                  BTN_ANIMATIONS[
                    selectedConfig?.anim ?? design.btnAnimation ?? "none"
                  ].label
                }
              </summary>
              <div className="flex items-center gap-2">
                <GroupLabel>Animation</GroupLabel>
                {!caps.btnAnimation && <ProPill />}
              </div>
              <p className="mt-1 text-xs text-soft">
                {selectedButton
                  ? "Choose an independent effect for this button. Off overrides any page animation."
                  : "Apply this effect to every button, replacing individual animation settings."}
              </p>
              <Locked locked={!caps.btnAnimation} onUpsell={onUpsell}>
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {(Object.keys(BTN_ANIMATIONS) as BtnAnimation[]).map((k) => {
                    const active =
                      (selectedConfig?.anim ??
                        design.btnAnimation ??
                        "none") === k;
                    return (
                      <button
                        key={k}
                        type="button"
                        aria-pressed={active}
                        title={BTN_ANIMATIONS[k].hint}
                        onClick={() =>
                          selectedButton
                            ? patchSelected({ anim: k })
                            : onAllButtonAnimation(k)
                        }
                        className={`rounded-xl border px-3 py-2.5 text-left transition ${
                          active
                            ? "border-ink bg-ink/[0.04] ring-1 ring-ink"
                            : "border-line hover:border-soft"
                        }`}
                      >
                        <span
                          aria-hidden
                          className={`mb-2 block h-3 w-full rounded-full border border-current bg-current/10 ${
                            active ? BTN_ANIMATIONS[k].className : ""
                          }`}
                        />
                        <span className="block text-xs font-medium">
                          {BTN_ANIMATIONS[k].label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </Locked>
            </details>

            <details className="studio-advanced">
              <summary>Borders, shadows & text weight</summary>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <GroupLabel>Shadow</GroupLabel>
                  <div className="mt-2 grid grid-cols-2 gap-1.5">
                    {(Object.keys(BTN_SHADOWS) as BtnShadow[]).map((k) => (
                      <button
                        key={k}
                        type="button"
                        onClick={() =>
                          selectedButton
                            ? patchSelected({ buttonShadow: k })
                            : onChange({ btnShadow: k })
                        }
                        className={`rounded-xl border px-2 py-2 text-xs transition ${
                          (selectedConfig?.buttonShadow ?? design.btnShadow) ===
                          k
                            ? "border-ink bg-ink/[0.04] font-medium"
                            : "border-line hover:border-soft"
                        }`}
                      >
                        {BTN_SHADOWS[k].label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <GroupLabel>Border</GroupLabel>
                  <div className="mt-2 grid grid-cols-3 gap-1.5">
                    {(Object.keys(BTN_BORDERS) as BtnBorder[]).map((k) => (
                      <button
                        key={k}
                        type="button"
                        onClick={() =>
                          selectedButton
                            ? patchSelected({ buttonBorder: k })
                            : onChange({ btnBorder: k })
                        }
                        className={`rounded-xl border px-2 py-2 text-xs transition ${
                          (selectedConfig?.buttonBorder ?? design.btnBorder) ===
                          k
                            ? "border-ink bg-ink/[0.04] font-medium"
                            : "border-line hover:border-soft"
                        }`}
                      >
                        {BTN_BORDERS[k].label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="border-t border-line pt-4">
                <GroupLabel>Text weight</GroupLabel>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {(Object.keys(BTN_WEIGHTS) as BtnWeight[]).map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() =>
                        selectedButton
                          ? patchSelected({ buttonWeight: k })
                          : onChange({ btnWeight: k })
                      }
                      style={{ fontWeight: BTN_WEIGHTS[k].value }}
                      className={`rounded-full border px-3.5 py-1.5 text-sm transition ${
                        (selectedConfig?.buttonWeight ??
                          design.btnWeight ??
                          "medium") === k
                          ? "border-ink bg-ink text-paper"
                          : "border-line hover:border-soft"
                      }`}
                    >
                      {BTN_WEIGHTS[k].label}
                    </button>
                  ))}
                </div>
              </div>
            </details>
            {selectedButton && (
              <label className="flex items-center gap-2 border-t border-line pt-4 text-sm">
                <input
                  type="checkbox"
                  checked={selectedConfig?.featured === true}
                  onChange={(event) =>
                    patchSelected({ featured: event.target.checked })
                  }
                />
                Highlight this button
              </label>
            )}
          </div>
        )}

        {/* ---------- Profile text ---------- */}
        {tab === "font" && (
          <div className="space-y-6">
            <p className="text-sm leading-relaxed text-soft">
              Adjust each part of your profile heading. Your preview updates as you go.
            </p>
            <div className="space-y-5">
              {([
                ["nameSize", "Name size"],
                ["handleSize", "Username size"],
                ["bioSize", "Bio size"],
              ] as const).map(([key, label]) => (
                <StepSlider
                  key={key}
                  label={label}
                  keys={Object.keys(PROFILE_TEXT_SIZES) as ProfileTextSize[]}
                  value={design[key] ?? "md"}
                  labelOf={(size) => PROFILE_TEXT_SIZES[size]}
                  onChange={(size) => onChange({ [key]: size })}
                />
              ))}
            </div>
            <div className="border-t border-line pt-5">
              {isSpotlight ? (
                <>
                  <GroupLabel>Text alignment</GroupLabel>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {(["left", "center", "right"] as const).map((align) => (
                      <button key={align} type="button"
                        aria-pressed={(design.profileTextAlign ?? "left") === align}
                        onClick={() => onChange({ profileTextAlign: align })}
                        className={`rounded-xl border px-3 py-2.5 text-sm capitalize transition ${
                          (design.profileTextAlign ?? "left") === align
                            ? "border-ink bg-ink/[0.04] font-medium"
                            : "border-line hover:border-soft"
                        }`}
                      >{align === "center" ? "Centre" : align}</button>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-xs leading-relaxed text-soft">
                  {resolved.profileLayout === "compact"
                    ? "Compact keeps your text beside the photo."
                    : isEditorial ? "Editorial keeps your introduction above the photo." : resolved.profileLayout === "cover" ? "Cover keeps your introduction below the cover and avatar." : "Portrait keeps your text centred below the photo."}
                  {" "}Choose Spotlight in Layout for left, centre or right alignment.
                </p>
              )}
            </div>
            <details className="group border-t border-line pt-4">
              <summary className="cursor-pointer text-sm font-medium">Name font</summary>
              <div className="pt-3">
                <FontGrid value={design.fontHeading}
                  onPick={(fontHeading) => onChange({ fontHeading })} />
              </div>
            </details>
            <details className="group border-t border-line pt-4">
              <summary className="cursor-pointer text-sm font-medium">Body &amp; button font</summary>
              <div className="pt-3">
                <FontGrid value={design.font}
                  onPick={(font) => onChange({ font })} />
              </div>
            </details>
          </div>
        )}
      </div>

      <div className="flex justify-end border-t border-line px-5 py-3">
        <button
          type="button"
          onClick={onReset}
          className="text-xs text-soft underline underline-offset-4 transition hover:text-ink"
        >
          {selectedButton
            ? "Reset page design to theme defaults"
            : "Reset to theme defaults"}
        </button>
      </div>
    </div>
  );
}
