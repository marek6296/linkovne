"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ANIM_CLASS,
  BLOCK_META,
  LINK_ANIMS,
  LINK_LAYOUT_KEYS,
  LINK_LAYOUTS,
  LINK_WIDTHS,
  SOCIAL_LABELS,
  SOCIAL_PLATFORMS,
  SOCIAL_STYLES,
  SOCIAL_SHAPES,
  SOCIAL_SIZES,
  type Block,
  type BlockConfig,
  type LinkAnim,
  type LinkLayout,
  type LinkWidth,
  type SocialPlatform,
} from "@/lib/blocks";
import { Icon, ICON_KEYS } from "@/components/blocks/icon";
import { Collapse, Chevron } from "@/components/editor/collapse";
import { uploadImage, uploadVideo } from "@/lib/upload";

/** ISO → hodnota pre <input type="datetime-local"> v lokálnom čase. */
function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

function fromLocalInput(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-soft">{label}</span>
      {children}
    </label>
  );
}

/** Jednoducha verzia len pre obrazky — pouziva ju miniatura tlacidla (thumb),
 *  ktora video nepodporuje. Photo/Video blok pouziva MediaPicker nizsie. */
function ImagePicker({
  value,
  userId,
  onChange,
}: {
  value: string;
  userId: string;
  onChange: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handle(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      onChange(await uploadImage(file, userId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value}
            alt=""
            className="h-14 w-14 rounded-lg border border-line object-cover"
          />
        ) : (
          <div className="h-14 w-14 rounded-lg border border-dashed border-line" />
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => handle(e.target.files?.[0])}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="rounded-full border border-line px-4 py-2 text-sm transition hover:border-ink disabled:opacity-50"
        >
          {busy ? "Uploading…" : value ? "Replace" : "Upload image"}
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-sm text-danger"
          >
            Remove
          </button>
        )}
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}

function MediaPicker({
  value,
  mediaType,
  userId,
  onChange,
}: {
  value: string;
  mediaType: "image" | "video";
  userId: string;
  onChange: (patch: { src: string; mediaType: "image" | "video" }) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handle(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const isVideo = file.type.startsWith("video/");
      const src = isVideo
        ? await uploadVideo(file, userId)
        : await uploadImage(file, userId);
      onChange({ src, mediaType: isVideo ? "video" : "image" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      {/* Prepinac urcuje, aky suborovy picker sa otvori — nie retroaktivnu
          zmenu uz nahrateho media (na to sluzi Replace). */}
      <div className="inline-flex rounded-full border border-line p-0.5 text-sm">
        {(["image", "video"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => !value && onChange({ src: value, mediaType: t })}
            className={`rounded-full px-3 py-1 transition ${
              mediaType === t ? "bg-ink text-white" : "text-soft hover:text-ink"
            }`}
          >
            {t === "image" ? "Photo" : "Video"}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3">
        {value ? (
          mediaType === "video" ? (
            <video
              src={value}
              muted
              playsInline
              className="h-14 w-14 rounded-lg border border-line object-cover"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={value}
              alt=""
              className="h-14 w-14 rounded-lg border border-line object-cover"
            />
          )
        ) : (
          <div className="h-14 w-14 rounded-lg border border-dashed border-line" />
        )}
        <input
          ref={inputRef}
          type="file"
          accept={mediaType === "video" ? "video/*" : "image/*"}
          hidden
          onChange={(e) => handle(e.target.files?.[0])}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="rounded-full border border-line px-4 py-2 text-sm transition hover:border-ink disabled:opacity-50"
        >
          {busy
            ? "Uploading…"
            : value
              ? "Replace"
              : `Upload ${mediaType === "video" ? "video" : "image"}`}
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onChange({ src: "", mediaType })}
            className="text-sm text-danger"
          >
            Remove
          </button>
        )}
      </div>
      {mediaType === "video" && (
        <p className="text-xs text-faint">MP4 or MOV, up to 30 MB.</p>
      )}
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}

type SocialItem = { platform: SocialPlatform; url: string; color?: string };

/** Skupina chipov s malym vizualnym nahladom vlavo. */
function SocialChips<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { key: T; label: string; glyph?: React.ReactNode }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div>
      <p className="mb-1.5 text-[11px] font-semibold tracking-wide text-faint uppercase">
        {label}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button
            key={o.key}
            type="button"
            onClick={() => onChange(o.key)}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-sm transition ${
              value === o.key
                ? "border-ink bg-ink/[0.04] font-medium"
                : "border-line hover:border-soft"
            }`}
          >
            {o.glyph}
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Farebny riadok — label vlavo, farba + hex vpravo. */
function SocialColorRow({
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

function SocialsEditor({
  config,
  onPatch,
}: {
  config: BlockConfig;
  onPatch: (patch: Partial<BlockConfig>) => void;
}) {
  const items = (config.items ?? []) as SocialItem[];
  const style = config.socialStyle ?? "line";
  const shape = config.socialShape ?? "bare";
  const size = config.socialSize ?? "md";

  const setItems = (next: SocialItem[]) => onPatch({ items: next });

  return (
    <div className="space-y-4">
      {/* ---------- Vzhlad ikon (vsetky naraz) ---------- */}
      <div className="space-y-3 rounded-xl border border-line p-3.5">
        <SocialChips
          label="Style"
          value={style}
          onChange={(socialStyle) => onPatch({ socialStyle })}
          options={SOCIAL_STYLES.map((s) => ({
            key: s.key,
            label: s.label,
            glyph:
              s.key === "brand" ? (
                <span className="flex gap-0.5" aria-hidden>
                  <span className="h-2.5 w-2.5 rounded-full bg-pink-500" />
                  <span className="h-2.5 w-2.5 rounded-full bg-sky-500" />
                </span>
              ) : (
                <span
                  aria-hidden
                  className="h-2.5 w-2.5 rounded-full border-[1.5px] border-current"
                />
              ),
          }))}
        />

        <SocialChips
          label="Shape"
          value={shape}
          onChange={(socialShape) => onPatch({ socialShape })}
          options={SOCIAL_SHAPES.map((s) => ({
            key: s.key,
            label: s.label,
            glyph:
              s.key === "bare" ? undefined : (
                <span
                  aria-hidden
                  className="h-4 w-4 border-[1.5px] border-current opacity-80"
                  style={{
                    borderRadius:
                      s.key === "circle"
                        ? "999px"
                        : s.key === "rounded"
                          ? "5px"
                          : "2px",
                  }}
                />
              ),
          }))}
        />

        <SocialChips
          label="Size"
          value={size}
          onChange={(socialSize) => onPatch({ socialSize })}
          options={SOCIAL_SIZES.map((s) => ({ key: s.key, label: s.label }))}
        />

        {/* Farby — len pre `line` styl (brand pouziva znackove farby) */}
        {style === "line" && (
          <div className="divide-y divide-line/60 border-t border-line pt-1">
            <SocialColorRow
              label="Icon colour"
              value={config.socialColor}
              fallback="#191813"
              onChange={(socialColor) => onPatch({ socialColor })}
            />
            {shape !== "bare" && (
              <SocialColorRow
                label="Background"
                value={config.socialBg}
                fallback="#ffffff"
                onChange={(socialBg) => onPatch({ socialBg })}
              />
            )}
          </div>
        )}
      </div>

      {/* ---------- Ucty (kazdy zvlast + volitelna farba) ---------- */}
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <select
              value={item.platform}
              onChange={(e) => {
                const next = [...items];
                next[i] = { ...item, platform: e.target.value as SocialPlatform };
                setItems(next);
              }}
              className="rounded-lg border border-line bg-surface px-2 py-2 text-sm"
            >
              {SOCIAL_PLATFORMS.map((p) => (
                <option key={p} value={p}>
                  {SOCIAL_LABELS[p]}
                </option>
              ))}
            </select>
            <input
              value={item.url}
              placeholder={
                item.platform === "email"
                  ? "you@example.com"
                  : item.platform === "phone"
                    ? "+421…"
                    : "instagram.com/you"
              }
              onChange={(e) => {
                const next = [...items];
                next[i] = { ...item, url: e.target.value };
                setItems(next);
              }}
              className="field min-w-0 flex-1 px-3 py-2 text-sm"
            />
            {/* Per-icon farba — override pre tuto jednu ikonu */}
            <label
              title="Custom colour for this icon"
              className="relative flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full border border-line"
              style={item.color ? { background: item.color } : undefined}
            >
              {!item.color && (
                <span
                  aria-hidden
                  className="h-3.5 w-3.5 rounded-full border-[1.5px] border-dashed border-faint"
                />
              )}
              <input
                type="color"
                value={item.color ?? "#000000"}
                onChange={(e) => {
                  const next = [...items];
                  next[i] = { ...item, color: e.target.value };
                  setItems(next);
                }}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
            </label>
            {item.color && (
              <button
                type="button"
                aria-label="Reset colour"
                title="Reset to default colour"
                onClick={() => {
                  const next = [...items];
                  const { color: _drop, ...rest } = item;
                  void _drop;
                  next[i] = rest;
                  setItems(next);
                }}
                className="shrink-0 text-xs text-faint transition hover:text-ink"
              >
                ↺
              </button>
            )}
            <button
              type="button"
              aria-label="Remove"
              onClick={() => setItems(items.filter((_, j) => j !== i))}
              className="shrink-0 px-1 text-faint transition hover:text-danger"
            >
              ×
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            setItems([...items, { platform: "instagram", url: "" }])
          }
          className="text-sm text-soft underline underline-offset-4 hover:text-ink"
        >
          Add another
        </button>
      </div>
    </div>
  );
}

export function BlockCard({
  block,
  broken = false,
  userId,
  vip = false,
  onChange,
  onDelete,
  onDuplicate,
}: {
  block: Block;
  /** Odkaz pri poslednej kontrole neodpovedal */
  broken?: boolean;
  userId: string;
  /** VIP zamok (kod) je platena funkcia */
  vip?: boolean;
  onChange: (patch: Partial<Block>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}) {
  const [open, setOpen] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const patchConfig = (c: Partial<BlockConfig>) =>
    onChange({ config: { ...block.config, ...c } });

  const summary =
    block.type === "link"
      ? block.config.title || "Untitled link"
      : block.type === "socials"
        ? `${(block.config.items ?? []).length} icons`
        : block.type === "image"
          ? block.config.src
            ? block.config.mediaType === "video"
              ? "Video"
              : "Photo"
            : "No media yet"
          : (block.config.text ?? block.config.url ?? "").slice(0, 40) ||
            BLOCK_META[block.type].label;

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
      className="card overflow-hidden"
    >
      <div className="flex items-center gap-2 p-3">
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder"
          className="cursor-grab px-1.5 text-faint transition hover:text-ink active:cursor-grabbing"
        >
          ⠿
        </button>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="min-w-0 flex-1 text-left"
        >
          <span className="block text-[11px] tracking-wide text-faint uppercase">
            {BLOCK_META[block.type].label}
          </span>
          <span
            className={`block truncate text-sm font-medium ${
              block.is_active ? "" : "text-faint line-through"
            }`}
          >
            {summary}
          </span>
          {block.type === "link" &&
            (block.config.width === "half" ||
              (block.config.anim && block.config.anim !== "none")) && (
              <span className="mt-1 flex flex-wrap gap-1.5">
                {block.config.width === "half" && (
                  <span className="rounded-full bg-black/[0.05] px-2 py-0.5 text-[10px] font-medium text-soft">
                    ½ Grid
                  </span>
                )}
                {block.config.anim && block.config.anim !== "none" && (
                  <span className="rounded-full bg-black/[0.05] px-2 py-0.5 text-[10px] font-medium text-soft">
                    Motion · {LINK_ANIMS[block.config.anim]}
                  </span>
                )}
              </span>
            )}
          {broken && (
            <span className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-medium text-danger">
              ● This link isn&apos;t responding
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => onChange({ is_active: !block.is_active })}
          className="rounded-full border border-line px-3 py-1 text-xs text-soft transition hover:border-ink hover:text-ink"
        >
          {block.is_active ? "On" : "Off"}
        </button>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Edit block"
          className="px-2 text-faint transition hover:text-ink"
        >
          <Chevron open={open} />
        </button>
      </div>

      <Collapse open={open}>
        <div className="space-y-3 border-t border-line bg-paper/60 p-4">
          {block.type === "link" && (
            <>
              <Field label="Title">
                <input
                  value={block.config.title ?? ""}
                  onChange={(e) => patchConfig({ title: e.target.value })}
                  className="field py-2.5"
                />
              </Field>
              <Field label="URL">
                <input
                  value={block.config.url ?? ""}
                  placeholder="https://…"
                  onChange={(e) => patchConfig({ url: e.target.value })}
                  className="field py-2.5"
                />
              </Field>

              <div className="rounded-xl border border-line bg-surface p-4">
                <div>
                  <p className="text-sm font-semibold">Layout &amp; motion</p>
                  <p className="mt-1 text-xs leading-relaxed text-soft">
                    These settings affect only this button. Use half width on two
                    links to create a two-column grid.
                  </p>
                </div>

                <div className="mt-4 grid gap-5 sm:grid-cols-2">
                  <div>
                    <span className="mb-2 block text-[11px] font-semibold tracking-wide text-faint uppercase">
                      Width
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {(Object.keys(LINK_WIDTHS) as LinkWidth[]).map((key) => {
                        const active = (block.config.width ?? "full") === key;
                        return (
                          <button
                            key={key}
                            type="button"
                            aria-pressed={active}
                            onClick={() => patchConfig({ width: key })}
                            className={`rounded-xl border px-3 py-2.5 text-left transition ${
                              active
                                ? "border-ink bg-ink/[0.04] ring-1 ring-ink"
                                : "border-line hover:border-soft"
                            }`}
                          >
                            <span className="mb-2 flex h-5 w-full items-center gap-1" aria-hidden>
                              {key === "full" ? (
                                <span className="h-3.5 w-full rounded border border-current bg-current/10" />
                              ) : (
                                <>
                                  <span className="h-3.5 w-1/2 rounded border border-current bg-current/10" />
                                  <span className="h-3.5 w-1/2 rounded border border-dashed border-current opacity-35" />
                                </>
                              )}
                            </span>
                            <span className="block text-xs font-medium">
                              {LINK_WIDTHS[key]}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    {block.config.width === "half" && (
                      <p className="mt-2 text-[11px] leading-relaxed text-soft">
                        This button now occupies the left half. Put another
                        half-width link directly after it to fill the row.
                      </p>
                    )}
                  </div>

                  <div>
                    <span className="mb-2 block text-[11px] font-semibold tracking-wide text-faint uppercase">
                      Attention animation
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {(Object.keys(LINK_ANIMS) as LinkAnim[]).map((key) => {
                        const active = (block.config.anim ?? "none") === key;
                        return (
                          <button
                            key={key}
                            type="button"
                            aria-pressed={active}
                            onClick={() => patchConfig({ anim: key })}
                            className={`flex min-h-10 items-center gap-2 rounded-xl border px-2.5 py-2 text-left transition ${
                              active
                                ? "border-ink bg-ink/[0.04] ring-1 ring-ink"
                                : "border-line hover:border-soft"
                            }`}
                          >
                            <span
                              aria-hidden
                              className={`h-2.5 w-5 shrink-0 rounded-full bg-current opacity-60 ${
                                active ? ANIM_CLASS[key] : ""
                              }`}
                            />
                            <span className="text-[11px] font-medium leading-tight">
                              {LINK_ANIMS[key]}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    {block.config.anim && block.config.anim !== "none" && (
                      <p className="mt-2 text-[11px] leading-relaxed text-soft">
                        Motion is on for this button. Choose <strong>Off</strong>{" "}
                        to stop the pulsing or movement.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <span className="mb-1.5 block text-xs font-medium text-soft">
                  Button type
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {LINK_LAYOUT_KEYS.map((key) => {
                    const active =
                      (block.config.layout ??
                        (block.config.thumb ? "thumb" : "bar")) === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        title={LINK_LAYOUTS[key].hint}
                        onClick={() => patchConfig({ layout: key })}
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
                {LINK_LAYOUTS[
                  (block.config.layout ?? "bar") as LinkLayout
                ].needsImage &&
                  !block.config.thumb && (
                    <p className="mt-2 text-xs text-soft">
                      This type needs an image — upload one below.
                    </p>
                  )}
              </div>

              <div>
                <span className="mb-1 block text-xs font-medium text-soft">
                  Image
                </span>
                <ImagePicker
                  value={block.config.thumb ?? ""}
                  userId={userId}
                  onChange={(thumb) => patchConfig({ thumb })}
                />
              </div>

              {!block.config.thumb && (
                <div>
                  <span className="mb-1.5 block text-xs font-medium text-soft">
                    …or pick an icon
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {ICON_KEYS.map((key) => (
                      <button
                        key={key}
                        type="button"
                        title={key}
                        aria-label={key}
                        onClick={() =>
                          patchConfig({
                            icon: block.config.icon === key ? undefined : key,
                          })
                        }
                        className={`flex h-9 w-9 items-center justify-center rounded-lg border transition ${
                          block.config.icon === key
                            ? "border-ink bg-ink text-paper"
                            : "border-line text-soft hover:border-soft hover:text-ink"
                        }`}
                      >
                        <Icon name={key} className="h-[18px] w-[18px]" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-5">
                <label className="flex items-center gap-2 text-sm">
                  <span className="text-xs font-medium text-soft">
                    Button colour
                  </span>
                  <input
                    type="color"
                    value={block.config.color ?? "#ffffff"}
                    onChange={(e) => patchConfig({ color: e.target.value })}
                    className="h-8 w-12 cursor-pointer rounded-lg border border-line bg-surface p-1"
                  />
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <span className="text-xs font-medium text-soft">Text</span>
                  <input
                    type="color"
                    value={block.config.textColor ?? "#191813"}
                    onChange={(e) =>
                      patchConfig({ textColor: e.target.value })
                    }
                    className="h-8 w-12 cursor-pointer rounded-lg border border-line bg-surface p-1"
                  />
                </label>
                {(block.config.color || block.config.textColor) && (
                  <button
                    type="button"
                    onClick={() =>
                      patchConfig({ color: undefined, textColor: undefined })
                    }
                    className="text-xs text-soft underline underline-offset-2 hover:text-ink"
                  >
                    Use theme colours
                  </button>
                )}
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={block.config.featured === true}
                  onChange={(e) => patchConfig({ featured: e.target.checked })}
                />
                Highlight this link
              </label>

              {/* VIP zamok — Pro+ */}
              {vip ? (
                <div className="space-y-2 rounded-lg border border-line p-3">
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <input
                      type="checkbox"
                      checked={block.config.lockCode !== undefined}
                      onChange={(e) =>
                        patchConfig({
                          lockCode: e.target.checked
                            ? (block.config.lockCode ?? "")
                            : undefined,
                        })
                      }
                    />
                    Lock as VIP (require a code)
                  </label>
                  {block.config.lockCode !== undefined && (
                    <>
                      <input
                        value={block.config.lockCode ?? ""}
                        placeholder="Access code — e.g. VIP2026"
                        maxLength={64}
                        onChange={(e) =>
                          patchConfig({ lockCode: e.target.value })
                        }
                        className="field py-2 text-sm"
                      />
                      <p className="text-xs text-soft">
                        Fans must enter this code to open the link. The code and
                        the destination never appear in your page&apos;s source.
                      </p>
                    </>
                  )}
                </div>
              ) : (
                <Link
                  href="/#pricing"
                  className="flex items-center justify-between gap-3 rounded-lg border border-dashed border-line p-3 text-sm text-soft transition hover:border-soft"
                >
                  <span>🔒 Lock this link behind a VIP code</span>
                  <span className="btn-ink px-3 py-1 text-xs">Pro</span>
                </Link>
              )}
            </>
          )}

          {(block.type === "headline" || block.type === "text") && (
            <Field label={block.type === "headline" ? "Heading" : "Text"}>
              {block.type === "headline" ? (
                <input
                  value={block.config.text ?? ""}
                  onChange={(e) => patchConfig({ text: e.target.value })}
                  className="field py-2.5"
                />
              ) : (
                <textarea
                  rows={3}
                  value={block.config.text ?? ""}
                  onChange={(e) => patchConfig({ text: e.target.value })}
                  className="field py-2.5"
                />
              )}
            </Field>
          )}

          {block.type === "image" && (
            <>
              <MediaPicker
                value={block.config.src ?? ""}
                mediaType={block.config.mediaType ?? "image"}
                userId={userId}
                onChange={(patch) => patchConfig(patch)}
              />
              <Field label="Links to (optional)">
                <input
                  value={block.config.href ?? ""}
                  placeholder="https://…"
                  onChange={(e) => patchConfig({ href: e.target.value })}
                  className="field py-2.5"
                />
              </Field>
            </>
          )}

          {block.type === "video" && (
            <Field label="Embed URL">
              <input
                value={block.config.url ?? ""}
                placeholder="YouTube · TikTok · Spotify · Vimeo · SoundCloud"
                onChange={(e) => patchConfig({ url: e.target.value })}
                className="field py-2.5"
              />
            </Field>
          )}

          {block.type === "divider" && (
            <p className="text-sm text-soft">
              A thin line to separate sections. Nothing to set up.
            </p>
          )}

          {block.type === "tip" && (
            <>
              <Field label="Button label">
                <input
                  value={block.config.title ?? ""}
                  placeholder="Buy me a gift 🎁"
                  onChange={(e) => patchConfig({ title: e.target.value })}
                  className="field py-2.5"
                />
              </Field>
              <Field label="Where it links (your tip / support page)">
                <input
                  value={block.config.url ?? ""}
                  placeholder="https://… (Ko-fi, PayPal, Throne, crypto…)"
                  onChange={(e) => patchConfig({ url: e.target.value })}
                  className="field py-2.5"
                />
              </Field>
            </>
          )}

          {block.type === "socials" && (
            <SocialsEditor config={block.config} onPatch={patchConfig} />
          )}

          {block.type === "faq" && (
            <div className="space-y-3">
              {(block.config.faqs ?? []).map((item, i) => {
                const faqs = block.config.faqs ?? [];
                return (
                  <div key={i} className="space-y-2 rounded-lg border border-line p-3">
                    <input
                      value={item.q}
                      placeholder="Question"
                      onChange={(e) => {
                        const next = [...faqs];
                        next[i] = { ...item, q: e.target.value };
                        patchConfig({ faqs: next });
                      }}
                      className="field py-2 text-sm"
                    />
                    <textarea
                      rows={2}
                      value={item.a}
                      placeholder="Answer"
                      onChange={(e) => {
                        const next = [...faqs];
                        next[i] = { ...item, a: e.target.value };
                        patchConfig({ faqs: next });
                      }}
                      className="field py-2 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        patchConfig({ faqs: faqs.filter((_, j) => j !== i) })
                      }
                      className="text-xs text-danger"
                    >
                      Remove
                    </button>
                  </div>
                );
              })}
              <button
                type="button"
                onClick={() =>
                  patchConfig({
                    faqs: [...(block.config.faqs ?? []), { q: "", a: "" }],
                  })
                }
                className="text-sm text-soft underline underline-offset-4 hover:text-ink"
              >
                Add question
              </button>
            </div>
          )}

          {block.type === "countdown" && (
            <>
              <Field label="Label">
                <input
                  value={block.config.title ?? ""}
                  onChange={(e) => patchConfig({ title: e.target.value })}
                  className="field py-2.5"
                />
              </Field>
              <Field label="Counts down to">
                <input
                  type="datetime-local"
                  value={block.config.target ?? ""}
                  onChange={(e) => patchConfig({ target: e.target.value })}
                  className="field py-2.5"
                />
              </Field>
            </>
          )}

          {block.type === "form" && (
            <>
              <Field label="Title">
                <input
                  value={block.config.title ?? ""}
                  onChange={(e) => patchConfig({ title: e.target.value })}
                  className="field py-2.5"
                />
              </Field>
              <Field label="Button label">
                <input
                  value={block.config.buttonLabel ?? ""}
                  placeholder="Send"
                  onChange={(e) =>
                    patchConfig({ buttonLabel: e.target.value })
                  }
                  className="field py-2.5"
                />
              </Field>
              <p className="text-xs text-soft">
                Messages land in your{" "}
                <a
                  href="/dashboard/leads"
                  className="underline underline-offset-2"
                >
                  inbox
                </a>
                .
              </p>
            </>
          )}

          {/* Scheduling — plati pre kazdy typ bloku */}
          <div className="grid gap-3 border-t border-line pt-3 sm:grid-cols-2">
            <Field label="Show from (optional)">
              <input
                type="datetime-local"
                value={toLocalInput(block.starts_at)}
                onChange={(e) =>
                  onChange({ starts_at: fromLocalInput(e.target.value) })
                }
                className="field py-2"
              />
            </Field>
            <Field label="Hide after (optional)">
              <input
                type="datetime-local"
                value={toLocalInput(block.ends_at)}
                onChange={(e) =>
                  onChange({ ends_at: fromLocalInput(e.target.value) })
                }
                className="field py-2"
              />
            </Field>
            {(block.starts_at || block.ends_at) && (
              <button
                type="button"
                onClick={() => onChange({ starts_at: null, ends_at: null })}
                className="justify-self-start text-xs text-soft underline underline-offset-2 hover:text-ink"
              >
                Clear schedule
              </button>
            )}
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={onDuplicate}
              className="text-sm text-soft transition hover:text-ink"
            >
              Duplicate
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="text-sm text-danger transition hover:underline"
            >
              Delete block
            </button>
          </div>
        </div>
      </Collapse>
    </div>
  );
}
