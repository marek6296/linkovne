"use client";

import { useRef, useState } from "react";
import {
  BTN_ANIMATIONS,
  BTN_SHAPES,
  BTN_STYLES,
  type BtnAnimation,
  type BtnShape,
  type BtnStyle,
} from "@/lib/design";
import { BTN_SIZE_LABELS, type BtnSize } from "@/lib/themes";
import {
  LINK_LAYOUT_KEYS,
  LINK_LAYOUTS,
  type BlockConfig,
  type LinkLayout,
} from "@/lib/blocks";
import { Icon, ICON_KEYS } from "@/components/blocks/icon";
import { uploadImage } from "@/lib/upload";

/**
 * Vzhľad JEDNÉHO buttonu — žije priamo v jeho bloku (nie v Design paneli).
 * Prepisuje predvolený vzhľad z Design → Buttons. Prázdna hodnota = zdedí default.
 */
function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold tracking-wide text-faint uppercase">
      {children}
    </p>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-3 py-1.5 text-sm transition ${
        active ? "border-ink bg-ink text-paper" : "border-line hover:border-soft"
      }`}
    >
      {children}
    </button>
  );
}

function ColorField({
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
    <label className="flex items-center justify-between gap-3 py-2">
      <span className="text-sm text-soft">{label}</span>
      <span className="flex items-center gap-2.5 rounded-full border border-line bg-paper/50 py-1 pr-1 pl-3">
        <code className="text-xs font-medium tracking-wide text-faint uppercase">
          {current}
        </code>
        <span
          className="relative h-7 w-7 overflow-hidden rounded-full border border-black/10 ring-1 ring-black/5"
          style={{ background: current }}
        >
          <input
            type="color"
            value={current}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </span>
      </span>
    </label>
  );
}

export function ButtonStyle({
  config,
  onPatch,
  userId,
}: {
  config: BlockConfig;
  onPatch: (patch: Partial<BlockConfig>) => void;
  userId: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const layout = (config.layout ?? (config.thumb ? "thumb" : "bar")) as LinkLayout;
  const style = config.buttonStyle;
  const hasOverride =
    config.buttonStyle !== undefined ||
    config.buttonShape !== undefined ||
    config.buttonSize !== undefined ||
    config.color !== undefined ||
    config.textColor !== undefined ||
    config.anim !== undefined ||
    config.featured !== undefined ||
    config.layout !== undefined ||
    !!config.thumb ||
    !!config.icon;

  return (
    <div className="space-y-4 rounded-xl border border-line bg-paper/60 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold">Button look</p>
        {hasOverride && (
          <button
            type="button"
            onClick={() =>
              onPatch({
                buttonStyle: undefined,
                buttonShape: undefined,
                buttonSize: undefined,
                color: undefined,
                textColor: undefined,
                buttonGradientColor: undefined,
                buttonGradientColor2: undefined,
                anim: undefined,
                featured: undefined,
              })
            }
            className="text-xs text-soft underline underline-offset-4 hover:text-ink"
          >
            Reset to page style
          </button>
        )}
      </div>

      {/* Featured — zvýraznený button */}
      <label className="flex items-center justify-between gap-3">
        <span className="min-w-0">
          <span className="text-sm font-medium">Highlight (featured)</span>
          <span className="mt-0.5 block text-xs text-soft">
            Bigger, filled with your theme&apos;s accent — draws the eye.
          </span>
        </span>
        <input
          type="checkbox"
          checked={config.featured === true}
          onChange={(e) => onPatch({ featured: e.target.checked || undefined })}
          className="h-4 w-4 shrink-0"
        />
      </label>

      {/* Typ */}
      <div className="border-t border-line pt-4">
        <Label>Type</Label>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {LINK_LAYOUT_KEYS.map((key) => (
            <Chip
              key={key}
              active={layout === key}
              onClick={() => onPatch({ layout: key })}
            >
              {LINK_LAYOUTS[key].label}
            </Chip>
          ))}
        </div>
        {LINK_LAYOUTS[layout].needsImage && !config.thumb && (
          <p className="mt-2 text-xs text-soft">This type needs an image — add one below.</p>
        )}
      </div>

      {/* Obrázok / ikona */}
      <div className="border-t border-line pt-4">
        <Label>Image or icon</Label>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setErr(null);
            setBusy(true);
            try {
              const thumb = await uploadImage(file, userId);
              onPatch({ thumb, thumbBytes: file.size, icon: undefined });
            } catch (error) {
              setErr(error instanceof Error ? error.message : "Upload failed.");
            } finally {
              setBusy(false);
              e.target.value = "";
            }
          }}
        />
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {config.thumb ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={config.thumb}
                alt=""
                className="h-10 w-10 rounded-lg border border-line object-cover"
              />
              <button
                type="button"
                onClick={() => onPatch({ thumb: undefined, thumbBytes: undefined })}
                className="text-xs text-soft underline underline-offset-4 hover:text-danger"
              >
                Remove
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={busy}
              className="rounded-full border border-line px-3.5 py-1.5 text-sm transition hover:border-ink disabled:opacity-50"
            >
              {busy ? "Uploading…" : "Upload photo"}
            </button>
          )}
        </div>
        {err && <p className="mt-1.5 text-xs text-danger">{err}</p>}
        {!config.thumb && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {ICON_KEYS.slice(0, 14).map((key) => (
              <button
                key={key}
                type="button"
                title={key}
                aria-pressed={config.icon === key}
                onClick={() =>
                  onPatch({ icon: config.icon === key ? undefined : key })
                }
                className={`flex h-8 w-8 items-center justify-center rounded-lg border transition ${
                  config.icon === key
                    ? "border-ink bg-ink/[0.05]"
                    : "border-line hover:border-soft"
                }`}
              >
                <Icon name={key} className="h-4 w-4" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Štýl */}
      <div className="border-t border-line pt-4">
        <Label>Style</Label>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {(Object.keys(BTN_STYLES) as BtnStyle[]).map((key) => (
            <Chip
              key={key}
              active={style === key}
              onClick={() =>
                onPatch({ buttonStyle: style === key ? undefined : key })
              }
            >
              {BTN_STYLES[key]}
            </Chip>
          ))}
        </div>
      </div>

      {/* Farby */}
      <div className="divide-y divide-line/60 border-t border-line pt-1">
        {style === "gradient" ? (
          <>
            <ColorField
              label="Gradient from"
              value={config.buttonGradientColor}
              fallback="#7c3aed"
              onChange={(v) => onPatch({ buttonGradientColor: v })}
            />
            <ColorField
              label="Gradient to"
              value={config.buttonGradientColor2}
              fallback="#0ea5e9"
              onChange={(v) => onPatch({ buttonGradientColor2: v })}
            />
            <ColorField
              label="Text"
              value={config.textColor}
              fallback="#ffffff"
              onChange={(v) => onPatch({ textColor: v })}
            />
          </>
        ) : (
          <>
            <ColorField
              label="Background"
              value={config.color}
              fallback="#191813"
              onChange={(v) => onPatch({ color: v })}
            />
            <ColorField
              label="Text"
              value={config.textColor}
              fallback="#ffffff"
              onChange={(v) => onPatch({ textColor: v })}
            />
          </>
        )}
      </div>

      {/* Tvar + veľkosť */}
      <div className="grid gap-4 border-t border-line pt-4 sm:grid-cols-2">
        <div>
          <Label>Shape</Label>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {(Object.keys(BTN_SHAPES) as BtnShape[]).map((key) => (
              <Chip
                key={key}
                active={config.buttonShape === key}
                onClick={() =>
                  onPatch({
                    buttonShape: config.buttonShape === key ? undefined : key,
                  })
                }
              >
                {BTN_SHAPES[key].label}
              </Chip>
            ))}
          </div>
        </div>
        <div>
          <Label>Size</Label>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {(Object.keys(BTN_SIZE_LABELS) as BtnSize[]).map((key) => (
              <Chip
                key={key}
                active={config.buttonSize === key}
                onClick={() =>
                  onPatch({
                    buttonSize: config.buttonSize === key ? undefined : key,
                  })
                }
              >
                {BTN_SIZE_LABELS[key]}
              </Chip>
            ))}
          </div>
        </div>
      </div>

      {/* Animácia */}
      <div className="border-t border-line pt-4">
        <Label>Animation</Label>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {(Object.keys(BTN_ANIMATIONS) as BtnAnimation[]).map((key) => {
            const active = (config.anim ?? "none") === key;
            return (
              <button
                key={key}
                type="button"
                aria-pressed={active}
                title={BTN_ANIMATIONS[key].hint}
                onClick={() =>
                  onPatch({ anim: key === "none" ? undefined : key })
                }
                className={`rounded-xl border px-3 py-2 text-left text-xs font-medium transition ${
                  active
                    ? "border-ink bg-ink/[0.04] ring-1 ring-ink"
                    : "border-line hover:border-soft"
                }`}
              >
                {BTN_ANIMATIONS[key].label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
