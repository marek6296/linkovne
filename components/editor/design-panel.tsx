"use client";

import { useRef, useState } from "react";
import {
  AVATAR_SHAPES,
  AVATAR_SIZES,
  BTN_SHAPES,
  BTN_STYLES,
  FONT_KEYS,
  FONTS,
  type AvatarShape,
  type AvatarSize,
  type BgMode,
  type BtnShape,
  type BtnStyle,
  type Design,
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

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onClick}
      className={`relative h-6 w-11 shrink-0 rounded-full transition ${
        on ? "bg-ink" : "bg-line"
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-paper shadow transition-all ${
          on ? "left-[22px]" : "left-0.5"
        }`}
      />
    </button>
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
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<Tab>("theme");
  const bg = design.bg ?? "theme";

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface">
      {/* Taby — vzdy vidno len jednu skupinu nastaveni */}
      <div className="border-b border-line p-2.5">
        <div className="flex gap-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`flex-1 rounded-full px-2 py-1.5 text-sm font-medium transition ${
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
          <div className="space-y-3">
            <GroupLabel>Palette</GroupLabel>
            <div className="flex flex-wrap gap-2">
              {themes.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => onPickTheme(t.key)}
                  aria-pressed={activeTheme === t.key}
                  className={`flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition ${
                    activeTheme === t.key
                      ? "border-ink"
                      : "border-line hover:border-soft"
                  } ${t.locked ? "opacity-55" : ""}`}
                >
                  <span
                    className="h-4 w-4 rounded-full border border-line"
                    style={{ background: t.swatch }}
                  />
                  {t.label}
                  {t.locked && <LockGlyph />}
                </button>
              ))}
            </div>
            <p className="text-xs text-soft">
              A theme sets your base palette. Background, buttons and fonts fine-tune it.
            </p>
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
          </div>
        )}

        {/* ---------- Profile photo ---------- */}
        {tab === "avatar" && (
          <div className="space-y-4">
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
                            AVATAR_SHAPES[k].radius === "999px"
                              ? "999px"
                              : AVATAR_SHAPES[k].radius === "26px"
                                ? "7px"
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
                  <VisualChip
                    key={k}
                    active={(design.avatarSize ?? "md") === k}
                    onClick={() => onChange({ avatarSize: k })}
                    label={AVATAR_SIZES[k].label}
                    glyph={
                      <span
                        className="shrink-0 rounded-full border-[1.5px] border-current opacity-80"
                        style={{
                          width: k === "sm" ? 12 : k === "md" ? 16 : 20,
                          height: k === "sm" ? 12 : k === "md" ? 16 : 20,
                        }}
                      />
                    }
                  />
                ))}
              </div>
            </div>

            <div className="border-t border-line pt-2">
              <div className="flex items-center justify-between gap-4 py-2">
                <span className="text-sm text-soft">Ring around photo</span>
                <Toggle
                  on={!!design.avatarRing}
                  onClick={() => onChange({ avatarRing: !design.avatarRing })}
                />
              </div>
              {design.avatarRing && (
                <ColorRow
                  label="Ring colour"
                  value={design.avatarRingColor}
                  fallback="#ffffff"
                  onChange={(avatarRingColor) => onChange({ avatarRingColor })}
                />
              )}
            </div>
          </div>
        )}

        {/* ---------- Buttons ---------- */}
        {tab === "buttons" && (
          <div className="space-y-4">
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
                                : "border border-current bg-current opacity-20"
                        }`}
                      />
                    }
                  />
                ))}
              </div>
            </div>

            <div>
              <GroupLabel>Size</GroupLabel>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {(Object.keys(BTN_SIZE_LABELS) as BtnSize[]).map((k) => (
                  <VisualChip
                    key={k}
                    active={design.btnSize === k}
                    onClick={() => onChange({ btnSize: k })}
                    label={BTN_SIZE_LABELS[k]}
                    glyph={
                      <span
                        className="w-8 shrink-0 rounded-full border-[1.5px] border-current opacity-80"
                        style={{ height: k === "sm" ? 8 : k === "md" ? 12 : 16 }}
                      />
                    }
                  />
                ))}
              </div>
            </div>

            <div className="divide-y divide-line/60 border-t border-line pt-1">
              <ColorRow
                label="Button colour"
                value={design.btnBg}
                fallback="#ffffff"
                onChange={(btnBg) => onChange({ btnBg })}
              />
              <ColorRow
                label="Button text"
                value={design.btnText}
                fallback="#191813"
                onChange={(btnText) => onChange({ btnText })}
              />
            </div>
          </div>
        )}

        {/* ---------- Fonts ---------- */}
        {tab === "font" && (
          <div className="space-y-4">
            <div>
              <GroupLabel>Your name</GroupLabel>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {FONT_KEYS.map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => onChange({ fontHeading: k })}
                    style={{ fontFamily: FONTS[k].css }}
                    className={`rounded-full border px-3.5 py-1.5 text-sm transition ${
                      design.fontHeading === k
                        ? "border-ink bg-ink text-paper"
                        : "border-line hover:border-soft"
                    }`}
                  >
                    {FONTS[k].label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <GroupLabel>Buttons &amp; text</GroupLabel>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {FONT_KEYS.map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => onChange({ font: k })}
                    style={{ fontFamily: FONTS[k].css }}
                    className={`rounded-full border px-3.5 py-1.5 text-sm transition ${
                      design.font === k
                        ? "border-ink bg-ink text-paper"
                        : "border-line hover:border-soft"
                    }`}
                  >
                    {FONTS[k].label}
                  </button>
                ))}
              </div>
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
