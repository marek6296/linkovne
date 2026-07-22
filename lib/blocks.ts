export type BlockType =
  | "link"
  | "headline"
  | "text"
  | "image"
  | "video"
  | "socials"
  | "faq"
  | "countdown"
  | "divider"
  | "tip"
  | "form";

export type LinkLayout = "bar" | "thumb" | "card" | "cover";

export const LINK_LAYOUTS: Record<
  LinkLayout,
  { label: string; hint: string; needsImage: boolean }
> = {
  bar: { label: "Bar", hint: "Just text", needsImage: false },
  thumb: { label: "Thumbnail", hint: "Small image on the left", needsImage: true },
  card: { label: "Card", hint: "Wide image above the title", needsImage: true },
  cover: { label: "Cover", hint: "Title over a full image", needsImage: true },
};

export const LINK_LAYOUT_KEYS = Object.keys(LINK_LAYOUTS) as LinkLayout[];

export type LinkWidth = "full" | "half";

export const LINK_WIDTHS: Record<LinkWidth, string> = {
  full: "Full width",
  half: "Half",
};

export type LinkAnim = "none" | "pulse" | "shake" | "glow";

export const LINK_ANIMS: Record<LinkAnim, string> = {
  none: "None",
  pulse: "Pulse",
  shake: "Shake",
  glow: "Glow",
};

export const ANIM_CLASS: Record<LinkAnim, string> = {
  none: "",
  pulse: "anim-pulse",
  shake: "anim-shake",
  glow: "anim-glow",
};

export type SocialPlatform =
  | "instagram"
  | "tiktok"
  | "youtube"
  | "facebook"
  | "x"
  | "linkedin"
  | "whatsapp"
  | "telegram"
  | "email"
  | "phone";

export type BlockConfig = {
  // link
  title?: string;
  url?: string;
  featured?: boolean;
  /** Obrazok na buttone — pouzitie zavisi od layoutu */
  thumb?: string;
  /** Typ buttonu */
  layout?: LinkLayout;
  /** Vlastna farba len pre tento button */
  color?: string;
  textColor?: string;
  /** Ikona namiesto nahrateho obrazka */
  icon?: string;
  /** Sirka — dva half buttony vedla seba tvoria riadok */
  width?: LinkWidth;
  /** Upozornovacia animacia */
  anim?: LinkAnim;
  /** VIP zamok — ked je nastaveny, odkaz sa odomkne az po zadani tohto kodu.
   *  Overuje sa vylucne na serveri; do verejneho HTML sa nikdy nedostane. */
  lockCode?: string;
  // headline / text
  text?: string;
  // image
  src?: string;
  alt?: string;
  href?: string;
  // socials
  items?: { platform: SocialPlatform; url: string }[];
  // faq
  faqs?: { q: string; a: string }[];
  // countdown — ISO datetime
  target?: string;
  // form
  buttonLabel?: string;
};

export type Block = {
  id: string;
  type: BlockType;
  config: BlockConfig;
  position: number;
  is_active: boolean;
  /** Naplanovane zobrazenie — ISO datetime alebo null */
  starts_at?: string | null;
  ends_at?: string | null;
};

/** Je blok práve teraz v okne, v ktorom sa má zobrazovať? */
export function isVisibleNow(block: Block, now = Date.now()): boolean {
  if (!block.is_active) return false;
  if (block.starts_at && new Date(block.starts_at).getTime() > now) return false;
  if (block.ends_at && new Date(block.ends_at).getTime() <= now) return false;
  return true;
}

export const BLOCK_META: Record<
  BlockType,
  { label: string; hint: string }
> = {
  link: { label: "Link", hint: "A button that sends people somewhere" },
  headline: { label: "Headline", hint: "Section title to group your links" },
  text: { label: "Text", hint: "A short paragraph or announcement" },
  image: { label: "Image", hint: "A photo or clickable banner" },
  video: { label: "Embed", hint: "YouTube · TikTok · Spotify · Vimeo" },
  socials: { label: "Social icons", hint: "A row of social profile icons" },
  faq: { label: "FAQ", hint: "Questions people keep asking you" },
  countdown: { label: "Countdown", hint: "Counts down to a launch or event" },
  divider: { label: "Divider", hint: "A thin line to break up the page" },
  tip: { label: "Tip / support", hint: "A highlighted button to get tips" },
  form: { label: "Contact form", hint: "Collect messages and leads" },
};

export const BLOCK_ORDER: BlockType[] = [
  "link",
  "headline",
  "text",
  "image",
  "video",
  "socials",
  "faq",
  "countdown",
  "divider",
  "tip",
  // "form" — kontaktny formular / inbox sme odstranili (nikto tam nepise).
];

export function defaultConfig(type: BlockType): BlockConfig {
  switch (type) {
    case "link":
      return { title: "New link", url: "", featured: false, thumb: "" };
    case "headline":
      return { text: "Section title" };
    case "text":
      return { text: "Say something about yourself." };
    case "image":
      return { src: "", alt: "", href: "" };
    case "video":
      return { url: "" };
    case "socials":
      return { items: [{ platform: "instagram", url: "" }] };
    case "faq":
      return { faqs: [{ q: "Do you ship worldwide?", a: "Yes, we do." }] };
    case "countdown":
      return {
        title: "Launching soon",
        // O tyzden — konkretny datum si nastavi user
        target: new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 16),
      };
    case "divider":
      return {};
    case "tip":
      return { title: "Buy me a gift 🎁", url: "" };
    case "form":
      return { title: "Get in touch", buttonLabel: "Send" };
  }
}

export const SOCIAL_LABELS: Record<SocialPlatform, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
  facebook: "Facebook",
  x: "X",
  linkedin: "LinkedIn",
  whatsapp: "WhatsApp",
  telegram: "Telegram",
  email: "Email",
  phone: "Phone",
};

export const SOCIAL_PLATFORMS = Object.keys(
  SOCIAL_LABELS,
) as SocialPlatform[];

/** Ratio embedu — riadi vysku ramca v renderi. */
export type EmbedKind = "video" | "vertical" | "audio" | "audioTall";

/**
 * Prevedie URL na embed. Podporuje YouTube (aj Shorts), Vimeo, TikTok,
 * Spotify (track/album/playlist/artist/episode) a SoundCloud. `kind` urcuje
 * pomer stran, aby TikTok nebol roztiahnuty a Spotify nebol privysoky.
 */
export function toEmbed(raw: string): { src: string; kind: EmbedKind } | null {
  if (!raw) return null;
  try {
    const u = new URL(raw);
    const host = u.hostname.replace(/^www\./, "");
    const seg = u.pathname.split("/").filter(Boolean);

    if (host === "youtube.com" || host === "m.youtube.com") {
      const id = u.searchParams.get("v");
      if (id) return { src: `https://www.youtube.com/embed/${id}`, kind: "video" };
      if (seg[0] === "embed" && seg[1])
        return { src: `https://www.youtube.com/embed/${seg[1]}`, kind: "video" };
      if (seg[0] === "shorts" && seg[1])
        return {
          src: `https://www.youtube.com/embed/${seg[1]}`,
          kind: "vertical",
        };
    }
    if (host === "youtu.be" && seg[0]) {
      return { src: `https://www.youtube.com/embed/${seg[0]}`, kind: "video" };
    }
    if (host === "vimeo.com") {
      const id = seg[0];
      if (id && /^\d+$/.test(id))
        return { src: `https://player.vimeo.com/video/${id}`, kind: "video" };
    }
    if (host === "tiktok.com") {
      const vi = seg.indexOf("video");
      const id = vi >= 0 ? seg[vi + 1] : seg.find((p) => /^\d{6,}$/.test(p));
      if (id && /^\d+$/.test(id))
        return { src: `https://www.tiktok.com/embed/v2/${id}`, kind: "vertical" };
    }
    if (host === "open.spotify.com") {
      const [type, id] = seg;
      const ok = ["track", "album", "playlist", "artist", "episode", "show"];
      if (id && ok.includes(type)) {
        const tall = type !== "track" && type !== "episode";
        return {
          src: `https://open.spotify.com/embed/${type}/${id}`,
          kind: tall ? "audioTall" : "audio",
        };
      }
    }
    if (host === "soundcloud.com") {
      return {
        src: `https://w.soundcloud.com/player/?url=${encodeURIComponent(
          raw,
        )}&color=%23ff5500&auto_play=false&show_comments=false`,
        kind: "audio",
      };
    }
    return null;
  } catch {
    return null;
  }
}

/** Spatna kompatibilita — vrati len URL embedu (pouziva sa v preview logike). */
export function toEmbedUrl(raw: string): string | null {
  return toEmbed(raw)?.src ?? null;
}

/** Normalises a social entry into an href. */
export function socialHref(platform: SocialPlatform, value: string): string {
  const v = value.trim();
  if (!v) return "#";
  if (platform === "email") return v.startsWith("mailto:") ? v : `mailto:${v}`;
  if (platform === "phone") return v.startsWith("tel:") ? v : `tel:${v}`;
  if (/^https?:\/\//i.test(v)) return v;
  return `https://${v}`;
}
