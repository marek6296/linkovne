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

/** Nikdy needorujeme surovy vstup — do DB ide len znamy kanal. */
export function normaliseSource(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const v = raw.trim().toLowerCase().slice(0, 24);
  if (VALID.has(v)) return v;
  // Vlastne kampane povolime, ale len bezpecne znaky
  return /^[a-z0-9_-]{2,24}$/.test(v) ? v : null;
}

export function channelLabel(key: string | null): string {
  if (!key) return "direct";
  return CHANNELS.find((c) => c.key === key)?.label ?? key;
}
