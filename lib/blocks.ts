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
  full: "Full row",
  half: "Half / grid",
};

export type LinkAnim = "none" | "pulse" | "shake" | "glow";

export const LINK_ANIMS: Record<LinkAnim, string> = {
  none: "Off",
  pulse: "Gentle pulse",
  shake: "Nudge",
  glow: "Glow ring",
};

export const ANIM_CLASS: Record<LinkAnim, string> = {
  none: "",
  pulse: "anim-pulse",
  shake: "anim-shake",
  glow: "anim-glow",
};

export type SocialPlatform =
  | "website"
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

/* ---------- Social icons — customizacia bloku ---------- */

export type SocialStyle = "line" | "brand";
export type SocialShape = "bare" | "circle" | "rounded" | "square";
export type SocialSize = "sm" | "md" | "lg";

export const SOCIAL_STYLES: { key: SocialStyle; label: string }[] = [
  { key: "line", label: "Line" },
  { key: "brand", label: "Brand" },
];

export const SOCIAL_SHAPES: {
  key: SocialShape;
  label: string;
  radius: string;
}[] = [
  { key: "bare", label: "Bare", radius: "0" },
  { key: "circle", label: "Circle", radius: "999px" },
  { key: "rounded", label: "Rounded", radius: "12px" },
  { key: "square", label: "Square", radius: "6px" },
];

export const SOCIAL_SIZES: { key: SocialSize; label: string; px: number }[] = [
  { key: "sm", label: "Small", px: 18 },
  { key: "md", label: "Medium", px: 22 },
  { key: "lg", label: "Large", px: 28 },
];

export const SOCIAL_SIZE_PX: Record<SocialSize, number> = {
  sm: 18,
  md: 22,
  lg: 28,
};

export const SOCIAL_SHAPE_RADIUS: Record<SocialShape, string> = {
  bare: "0",
  circle: "999px",
  rounded: "12px",
  square: "6px",
};

/** Znackove farby pre `brand` styl. Web/email/telefon nie su znacky → neutral. */
export const SOCIAL_BRAND: Record<SocialPlatform, string> = {
  website: "#6B7280",
  instagram: "#E1306C",
  tiktok: "#010101",
  youtube: "#FF0000",
  facebook: "#1877F2",
  x: "#000000",
  linkedin: "#0A66C2",
  whatsapp: "#25D366",
  telegram: "#229ED9",
  email: "#6B7280",
  phone: "#6B7280",
};

export type BlockConfig = {
  // link
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
  /** Legacy per-link motion. Kept for old saved data; global Design wins. */
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
  /** Ci `src` je foto alebo nahrate video. Chyba = "image" (spatna kompatibilita). */
  mediaType?: "image" | "video";
  mediaBytes?: number;
  thumbBytes?: number;
  // socials — kazda polozka moze mat vlastnu farbu (per-icon override)
  items?: { platform: SocialPlatform; url: string; color?: string }[];
  /** Styl ikon: `line` (jednotny obrys) alebo `brand` (znackove farby). */
  socialStyle?: SocialStyle;
  /** Tvar podkladu: bez pozadia alebo farebny chip (kruh/zaobleny/stvorec). */
  socialShape?: SocialShape;
  /** Farba ikon v `line` style (default = farba textu temy). */
  socialColor?: string;
  /** Farba chipu v `line` style (default = tlacidlo temy). */
  socialBg?: string;
  /** Velkost ikon. */
  socialSize?: SocialSize;
  // faq
  faqs?: { q: string; a: string }[];
  // countdown — ISO datetime
  target?: string;
  // form
  buttonLabel?: string;
  /** Premium visual section. Stored on a headline block for DB compatibility. */
  isSection?: boolean;
  sectionBg?: string;
  sectionText?: string;
  sectionBorder?: string;
  sectionRadius?: "soft" | "rounded" | "square";
  sectionLayout?: "stack" | "grid";
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
  image: { label: "Photo / Video", hint: "An uploaded photo or short video" },
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
      return {
        title: "New link",
        url: "",
        featured: false,
        thumb: "",
        width: "full",
      };
    case "headline":
      return { text: "Section title" };
    case "text":
      return { text: "Say something about yourself." };
    case "image":
      return { src: "", alt: "", href: "", mediaType: "image" };
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
  website: "Website",
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
