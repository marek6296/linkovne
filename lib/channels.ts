/**
 * Kanaly na trackovanie: kazdy dostane vlastnu URL (?s=instagram), takze
 * vidno, z ktorej siete ludia naozaj chodia. Nezavisi to na referreri,
 * ktory in-app prehliadace casto zahadzuju.
 */
export const CHANNELS = [
  { key: "instagram", label: "Instagram" },
  { key: "tiktok", label: "TikTok" },
  { key: "x", label: "X" },
  { key: "youtube", label: "YouTube" },
  { key: "threads", label: "Threads" },
  { key: "facebook", label: "Facebook" },
  { key: "snapchat", label: "Snapchat" },
  { key: "reddit", label: "Reddit" },
  { key: "email", label: "Email" },
  { key: "qr", label: "QR code" },
] as const;

export type ChannelKey = (typeof CHANNELS)[number]["key"];

const VALID = new Set<string>(CHANNELS.map((c) => c.key));

/** Do DB ide iba validovany kanal alebo vlastny zdroj. */
export function normaliseSource(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const v = raw.trim().toLowerCase();
  if (VALID.has(v)) return v;
  // Vlastne kampane povolime, ale len bezpecne znaky
  return /^[a-z0-9_-]{2,24}$/.test(v) ? v : null;
}

export function channelLabel(
  key: string | null,
  links: TrackedLink[] = [],
): string {
  if (!key) return "direct";
  const custom = links.find((link) => link.source === key);
  return custom
    ? `${custom.label} (${key})`
    : (CHANNELS.find((c) => c.key === key)?.label ?? key);
}

/** Saved campaign aliases, stored with the profile draft. */
export type TrackedLink = { label: string; source: string };
export function trackingSlug(label: string): string {
  return label
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 24)
    .replace(/-$/g, "");
}
export function cleanTrackedLinks(value: unknown): TrackedLink[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  return value.slice(0, 50).flatMap((item) => {
    if (
      !item ||
      typeof item.label !== "string" ||
      typeof item.source !== "string"
    )
      return [];
    const source = normaliseSource(item.source);
    const label = item.label.trim().slice(0, 60);
    if (!source || source !== item.source || !label || seen.has(source))
      return [];
    seen.add(source);
    return [{ label, source }];
  });
}
