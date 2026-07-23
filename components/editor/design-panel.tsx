"use client";

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
  BTN_STYLES,
  BTN_WEIGHTS,
  FONT_KEYS,
  FONTS,
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
  type BtnStyle,
  type BtnWeight,
  type Design,
  type DeskBgMode,
} from "@/lib/design";
import { BTN_SIZE_LABELS, type BtnSize } from "@/lib/themes";
import { uploadImage } from "@/lib/upload";

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
  { key: "image", label: "Photo" },
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

type Tab = "theme" | "bg" | "avatar" | "buttons" | "font";

const TABS: { key: Tab; label: string }[] = [
  { key: "theme", label: "Theme" },
  { key: "bg", label: "Background" },
  { key: "avatar", label: "Photo" },
  { key: "buttons", label: "Buttons" },
  { key: "font", label: "Font" },
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

/** Chip s vizualnym nahladom (tvar/styl) + textom. */
function VisualChip({
  active,
  onClick,
  glyph,
  label,
}: {
  active: boolean;
  onClick: () => void;
  glyph: React.ReactNode;
  label: string;
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
      }`}
    >
      {glyph}
      {label}
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
      <label className="flex cursor-pointer items-center gap-2 rounded-full border border-line py-1 pr-3 pl-1 transition hover:border-soft">
        <span
          className="relative h-6 w-6 overflow-hidden rounded-full border border-line"
          style={{ background: current }}
        >
          <input
            type="color"
            value={current}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </span>
        <code className="text-xs text-faint uppercase">{current}</code>
      </label>
    </div>
  );
}

export function DesignPanel({
  design,
  userId,
  themes,
  activeTheme,
  onPickTheme,
  onChange,
  onReset,
}: {
  design: Design;
  userId: string;
  themes: ThemeOption[];
  activeTheme: string;
  onPickTheme: (key: string) => void;
  onChange: (patch: Design) => void;
  onReset: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const deskFileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [deskBusy, setDeskBusy] = useState(false);
  const [tab, setTab] = useState<Tab>("theme");
  const bg = design.bg ?? "theme";
  const deskBg = design.deskBg ?? "auto";

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_12px_35px_rgba(25,24,19,0.05)]">
      <div className="flex items-start justify-between gap-4 border-b border-line bg-paper/70 px-5 py-4">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold">Design studio</p>
            <span className="rounded-full bg-ink px-2 py-0.5 text-[9px] font-bold tracking-widest text-paper uppercase">
              Premium
            </span>
          </div>
          <p className="mt-1 text-xs text-soft">
            Every change appears instantly in your live preview.
          </p>
        </div>
      </div>
      {/* Taby — vzdy vidno len jednu skupinu nastaveni */}
      <div className="border-b border-line p-2.5">
        <div className="flex gap-1 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`min-w-[88px] flex-1 rounded-full px-3 py-1.5 text-sm font-medium transition ${
                tab === t.key
                  ? "bg-ink text-paper"
                  : "text-soft hover:bg-black/[0.04] hover:text-ink"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-[230px] p-5">
        {/* ---------- Theme ---------- */}
        {tab === "theme" && (
          <div className="space-y-4">
            <div>
              <GroupLabel>Theme collection</GroupLabel>
              <p className="mt-1 text-xs leading-relaxed text-soft">
                Start with a curated look, then fine-tune every detail in the other tabs.
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
                {BG_MODES.map((o) => (
                  <button
                    key={o.key}
                    type="button"
                    onClick={() => onChange({ bg: o.key })}
                    className={`rounded-full border px-3.5 py-1.5 text-sm transition ${
                      bg === o.key
                        ? "border-ink bg-ink text-paper"
                        : "border-line hover:border-soft"
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
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
                    try {
                      onChange({ bgImage: await uploadImage(file, userId) });
                    } finally {
                      setBusy(false);
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
              <GroupLabel>Behind the card · desktop</GroupLabel>
              <p className="mt-1 text-xs text-soft">
                The area around your card on wide screens. On phones the card
                fills the screen, so this only shows on desktop.
              </p>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {DESK_BG_MODES.map((o) => (
                  <button
                    key={o.key}
                    type="button"
                    onClick={() => onChange({ deskBg: o.key })}
                    className={`rounded-full border px-3.5 py-1.5 text-sm transition ${
                      deskBg === o.key
                        ? "border-ink bg-ink text-paper"
                        : "border-line hover:border-soft"
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
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
                            onChange({ deskBgColor: g.from, deskBgColor2: g.to })
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
                      try {
                        onChange({ deskBgImage: await uploadImage(file, userId) });
                      } finally {
                        setDeskBusy(false);
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
            <div>
              <GroupLabel>Format</GroupLabel>
              <p className="mt-1 text-xs text-soft">
                Choose a square, portrait or landscape crop for your profile image.
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
                      {AVATAR_ASPECTS[k].label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <GroupLabel>Shape</GroupLabel>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {(Object.keys(AVATAR_SHAPES) as AvatarShape[]).map((k) => (
                  <VisualChip
                    key={k}
                    active={(design.avatarShape ?? "circle") === k}
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
            </div>

            <div>
              <GroupLabel>Size</GroupLabel>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {(Object.keys(AVATAR_SIZES) as AvatarSize[]).map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => onChange({ avatarSize: k })}
                    className={`rounded-full border px-3.5 py-1.5 text-sm transition ${
                      (design.avatarSize ?? "md") === k
                        ? "border-ink bg-ink text-paper"
                        : "border-line hover:border-soft"
                    }`}
                  >
                    {AVATAR_SIZES[k].label}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-line pt-4">
              <GroupLabel>Frame</GroupLabel>
              <div className="mt-2 grid grid-cols-3 gap-1.5 sm:grid-cols-5">
                {(Object.keys(AVATAR_FRAMES) as AvatarFrame[]).map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() =>
                      onChange({ avatarFrame: k, avatarRing: false })
                    }
                    className={`rounded-xl border px-2 py-2 text-xs transition ${
                      (design.avatarFrame ?? (design.avatarRing ? "line" : "shadow")) === k
                        ? "border-ink bg-ink/[0.04] font-medium"
                        : "border-line hover:border-soft"
                    }`}
                  >
                    {AVATAR_FRAMES[k]}
                  </button>
                ))}
              </div>
              {design.avatarFrame &&
                design.avatarFrame !== "none" &&
                design.avatarFrame !== "shadow" && (
                <ColorRow
                  label="Frame colour"
                  value={design.avatarRingColor}
                  fallback="#ffffff"
                  onChange={(avatarRingColor) => onChange({ avatarRingColor })}
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
                  {(["top", "center", "bottom"] as AvatarPosition[]).map((k) => (
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
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ---------- Buttons ---------- */}
        {tab === "buttons" && (
          <div className="space-y-4">
            <div className="rounded-xl border border-line bg-paper px-4 py-3">
              <p className="text-sm font-medium">Button design applies page-wide</p>
              <p className="mt-1 text-xs leading-relaxed text-soft">
                Shape, style and animation affect every link button. Grid width
                stays inside each Link block because it controls page layout.
              </p>
            </div>

            <div>
              <GroupLabel>Shape</GroupLabel>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {(Object.keys(BTN_SHAPES) as BtnShape[]).map((k) => (
                  <VisualChip
                    key={k}
                    active={design.btnShape === k}
                    onClick={() => onChange({ btnShape: k })}
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
                {(Object.keys(BTN_STYLES) as BtnStyle[]).map((k) => (
                  <VisualChip
                    key={k}
                    active={design.btnStyle === k}
                    onClick={() => onChange({ btnStyle: k })}
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
                ))}
              </div>
            </div>

            <div className="divide-y divide-line/60 border-t border-line pt-1">
              {design.btnStyle === "gradient" ? (
                <>
                  <ColorRow
                    label="Gradient from"
                    value={design.btnGradientColor}
                    fallback="#7c3aed"
                    onChange={(btnGradientColor) => onChange({ btnGradientColor })}
                  />
                  <ColorRow
                    label="Gradient to"
                    value={design.btnGradientColor2}
                    fallback="#0ea5e9"
                    onChange={(btnGradientColor2) => onChange({ btnGradientColor2 })}
                  />
                </>
              ) : (
                <ColorRow
                  label="Button colour"
                  value={design.btnBg}
                  fallback="#ffffff"
                  onChange={(btnBg) => onChange({ btnBg })}
                />
              )}
              <ColorRow
                label="Button text"
                value={design.btnText}
                fallback="#191813"
                onChange={(btnText) => onChange({ btnText })}
              />
            </div>

            <div className="border-t border-line pt-4">
              <div>
                <GroupLabel>Size</GroupLabel>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {(Object.keys(BTN_SIZE_LABELS) as BtnSize[]).map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => onChange({ btnSize: k })}
                      className={`rounded-full border px-3 py-1.5 text-xs transition ${
                        (design.btnSize ?? "md") === k
                          ? "border-ink bg-ink text-paper"
                          : "border-line hover:border-soft"
                      }`}
                    >
                      {BTN_SIZE_LABELS[k]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="border-t border-line pt-4">
              <GroupLabel>Animation</GroupLabel>
              <p className="mt-1 text-xs text-soft">
                One consistent attention effect across all link buttons.
              </p>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {(Object.keys(BTN_ANIMATIONS) as BtnAnimation[]).map((k) => {
                  const active = (design.btnAnimation ?? "none") === k;
                  return (
                    <button
                      key={k}
                      type="button"
                      aria-pressed={active}
                      title={BTN_ANIMATIONS[k].hint}
                      onClick={() => onChange({ btnAnimation: k })}
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
              {(design.btnAnimation ?? "none") !== "none" && (
                <p className="mt-2 text-xs leading-relaxed text-soft">
                  This animation is active on every link button. Choose Off to
                  stop all automatic button movement.
                </p>
              )}
            </div>

            <div className="grid gap-4 border-t border-line pt-4 sm:grid-cols-2">
              <div>
                <GroupLabel>Shadow</GroupLabel>
                <div className="mt-2 grid grid-cols-2 gap-1.5">
                  {(Object.keys(BTN_SHADOWS) as BtnShadow[]).map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => onChange({ btnShadow: k })}
                      className={`rounded-xl border px-2 py-2 text-xs transition ${
                        design.btnShadow === k
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
                      onClick={() => onChange({ btnBorder: k })}
                      className={`rounded-xl border px-2 py-2 text-xs transition ${
                        design.btnBorder === k
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
                    onClick={() => onChange({ btnWeight: k })}
                    style={{ fontWeight: BTN_WEIGHTS[k].value }}
                    className={`rounded-full border px-3.5 py-1.5 text-sm transition ${
                      (design.btnWeight ?? "medium") === k
                        ? "border-ink bg-ink text-paper"
                        : "border-line hover:border-soft"
                    }`}
                  >
                    {BTN_WEIGHTS[k].label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ---------- Fonts ---------- */}
        {tab === "font" && (
          <div className="space-y-5">
            <div className="rounded-xl border border-line bg-paper px-4 py-3">
              <p
                className="text-2xl font-semibold tracking-tight"
                style={{ fontFamily: FONTS[design.fontHeading ?? "sans"].css }}
              >
                Your name
              </p>
              <p
                className="mt-1 text-sm text-soft"
                style={{ fontFamily: FONTS[design.font ?? "sans"].css }}
              >
                A live typography pairing preview
              </p>
            </div>
            <div>
              <GroupLabel>Name font</GroupLabel>
              <FontGrid
                value={design.fontHeading}
                onPick={(fontHeading) => onChange({ fontHeading })}
              />
            </div>

            <div className="border-t border-line pt-4">
              <GroupLabel>Buttons &amp; text</GroupLabel>
              <FontGrid
                value={design.font}
                onPick={(font) => onChange({ font })}
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end border-t border-line px-5 py-3">
        <button
          type="button"
          onClick={onReset}
          className="text-xs text-soft underline underline-offset-4 transition hover:text-ink"
        >
          Reset to theme defaults
        </button>
      </div>
    </div>
  );
}
