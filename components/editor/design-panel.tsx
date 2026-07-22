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

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <span className="text-sm text-soft">{label}</span>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}

function Swatch({
  value,
  fallback,
  onChange,
}: {
  value: string | undefined;
  fallback: string;
  onChange: (v: string) => void;
}) {
  return (
    <input
      type="color"
      value={value ?? fallback}
      onChange={(e) => onChange(e.target.value)}
      className="h-8 w-12 cursor-pointer rounded-lg border border-line bg-surface p-1"
    />
  );
}

function Choice<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { key: T; label: string }[];
  value: T | undefined;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          onClick={() => onChange(o.key)}
          className={`rounded-full border px-3 py-1.5 text-sm transition ${
            value === o.key
              ? "border-ink bg-ink text-paper"
              : "border-line hover:border-soft"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function DesignPanel({
  design,
  userId,
  onChange,
  onReset,
}: {
  design: Design;
  userId: string;
  onChange: (patch: Design) => void;
  onReset: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const bg = design.bg ?? "theme";

  return (
    <div className="card divide-y divide-line">
      {/* ---------- Background ---------- */}
      <div className="p-5">
        <h3 className="text-sm font-semibold">Background</h3>
        <div className="mt-3">
          <Choice
            options={BG_MODES}
            value={bg}
            onChange={(v) => onChange({ bg: v })}
          />
        </div>

        {bg === "solid" && (
          <Row label="Colour">
            <Swatch
              value={design.bgColor}
              fallback="#faf9f6"
              onChange={(bgColor) => onChange({ bgColor })}
            />
          </Row>
        )}

        {bg === "gradient" && (
          <>
            <div className="mt-3 flex flex-wrap gap-2">
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
            <Row label="From">
              <Swatch
                value={design.bgColor}
                fallback="#fde8ef"
                onChange={(bgColor) => onChange({ bgColor })}
              />
            </Row>
            <Row label="To">
              <Swatch
                value={design.bgColor2}
                fallback="#e6e9fb"
                onChange={(bgColor2) => onChange({ bgColor2 })}
              />
            </Row>
          </>
        )}

        {bg === "image" && (
          <div className="mt-3 flex items-center gap-3">
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
          <Row label="Text colour">
            <Swatch
              value={design.textColor}
              fallback="#191813"
              onChange={(textColor) => onChange({ textColor })}
            />
          </Row>
        )}
      </div>

      {/* ---------- Profile photo ---------- */}
      <div className="p-5">
        <h3 className="text-sm font-semibold">Profile photo</h3>

        <div className="mt-3 space-y-3">
          <div>
            <p className="mb-1.5 text-xs text-soft">Shape</p>
            <Choice
              options={(Object.keys(AVATAR_SHAPES) as AvatarShape[]).map((k) => ({
                key: k,
                label: AVATAR_SHAPES[k].label,
              }))}
              value={design.avatarShape ?? "circle"}
              onChange={(avatarShape) => onChange({ avatarShape })}
            />
          </div>

          <div>
            <p className="mb-1.5 text-xs text-soft">Size</p>
            <Choice
              options={(Object.keys(AVATAR_SIZES) as AvatarSize[]).map((k) => ({
                key: k,
                label: AVATAR_SIZES[k].label,
              }))}
              value={design.avatarSize ?? "md"}
              onChange={(avatarSize) => onChange({ avatarSize })}
            />
          </div>
        </div>

        <Row label="Ring">
          <button
            type="button"
            role="switch"
            aria-checked={!!design.avatarRing}
            onClick={() => onChange({ avatarRing: !design.avatarRing })}
            className={`relative h-6 w-11 rounded-full transition ${
              design.avatarRing ? "bg-ink" : "bg-line"
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-paper shadow transition-all ${
                design.avatarRing ? "left-[22px]" : "left-0.5"
              }`}
            />
          </button>
        </Row>
        {design.avatarRing && (
          <Row label="Ring colour">
            <Swatch
              value={design.avatarRingColor}
              fallback="#ffffff"
              onChange={(avatarRingColor) => onChange({ avatarRingColor })}
            />
          </Row>
        )}
      </div>

      {/* ---------- Buttons ---------- */}
      <div className="p-5">
        <h3 className="text-sm font-semibold">Buttons</h3>

        <div className="mt-3 space-y-3">
          <div>
            <p className="mb-1.5 text-xs text-soft">Shape</p>
            <Choice
              options={(Object.keys(BTN_SHAPES) as BtnShape[]).map((k) => ({
                key: k,
                label: BTN_SHAPES[k].label,
              }))}
              value={design.btnShape}
              onChange={(btnShape) => onChange({ btnShape })}
            />
          </div>

          <div>
            <p className="mb-1.5 text-xs text-soft">Style</p>
            <Choice
              options={(Object.keys(BTN_STYLES) as BtnStyle[]).map((k) => ({
                key: k,
                label: BTN_STYLES[k],
              }))}
              value={design.btnStyle}
              onChange={(btnStyle) => onChange({ btnStyle })}
            />
          </div>

          <div>
            <p className="mb-1.5 text-xs text-soft">Size</p>
            <Choice
              options={(Object.keys(BTN_SIZE_LABELS) as BtnSize[]).map((k) => ({
                key: k,
                label: BTN_SIZE_LABELS[k],
              }))}
              value={design.btnSize}
              onChange={(btnSize) => onChange({ btnSize })}
            />
          </div>
        </div>

        <Row label="Button colour">
          <Swatch
            value={design.btnBg}
            fallback="#ffffff"
            onChange={(btnBg) => onChange({ btnBg })}
          />
        </Row>
        <Row label="Button text">
          <Swatch
            value={design.btnText}
            fallback="#191813"
            onChange={(btnText) => onChange({ btnText })}
          />
        </Row>
      </div>

      {/* ---------- Fonts ---------- */}
      <div className="p-5">
        <h3 className="text-sm font-semibold">Fonts</h3>

        <div className="mt-3 space-y-3">
          <div>
            <p className="mb-1.5 text-xs text-soft">Your name</p>
            <div className="flex flex-wrap gap-1.5">
              {FONT_KEYS.map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => onChange({ fontHeading: k })}
                  style={{ fontFamily: FONTS[k].css }}
                  className={`rounded-full border px-3 py-1.5 text-sm transition ${
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
            <p className="mb-1.5 text-xs text-soft">Buttons &amp; text</p>
            <div className="flex flex-wrap gap-1.5">
              {FONT_KEYS.map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => onChange({ font: k })}
                  style={{ fontFamily: FONTS[k].css }}
                  className={`rounded-full border px-3 py-1.5 text-sm transition ${
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
      </div>

      <div className="p-5">
        <button
          type="button"
          onClick={onReset}
          className="text-sm text-soft underline underline-offset-4 transition hover:text-ink"
        >
          Reset to theme defaults
        </button>
      </div>
    </div>
  );
}
