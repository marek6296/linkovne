import type { Design } from "@/lib/design";
import type { Block, BlockType } from "@/lib/blocks";

/**
 * Sablona = kompletny vzhlad na jeden klik: tema + dizajn + startovacie bloky.
 * Pouziva ju onboarding (novy user) aj editor (kedykolvek neskor).
 *
 * DOLEZITE: kazda sablona ma EXPLICITNE btnBg + btnText, aby tlacidlo vzdy
 * kontrastovalo s pozadim. Spolieha sa na `btnStyle: "fill"`, ktory tie farby
 * pouzije priamo — nie na priehladne styly (glass/soft), ktore na svetlom
 * pozadi splynu.
 */
export type TemplateCategory =
  | "Minimal"
  | "Gradient"
  | "Bold"
  | "Warm"
  | "Creator";

export const TEMPLATE_CATEGORIES: TemplateCategory[] = [
  "Minimal",
  "Gradient",
  "Bold",
  "Warm",
  "Creator",
];

export type Template = {
  key: string;
  label: string;
  tagline: string;
  category: TemplateCategory;
  theme: string;
  design: Design;
  starter: { type: BlockType; title?: string; text?: string }[];
};

const STARTER_LINKS: Template["starter"] = [
  { type: "link", title: "Instagram" },
  { type: "link", title: "Latest" },
  { type: "socials" },
];

export const TEMPLATES: Template[] = [
  /* ---------- Minimal ---------- */
  {
    key: "paper",
    label: "Paper",
    tagline: "Warm cream, black buttons, timeless",
    category: "Minimal",
    theme: "classic",
    design: {
      bg: "solid",
      bgColor: "#f4f1ea",
      textColor: "#1a1a1a",
      btnBg: "#1a1a1a",
      btnText: "#f4f1ea",
      btnStyle: "fill",
      btnShape: "rounded",
      font: "sans",
      fontHeading: "serif",
    },
    starter: [
      { type: "link", title: "Portfolio" },
      { type: "link", title: "Contact" },
      { type: "socials" },
    ],
  },
  {
    key: "mono",
    label: "Mono",
    tagline: "Pure black on white, no distractions",
    category: "Minimal",
    theme: "mono",
    design: {
      bg: "solid",
      bgColor: "#ffffff",
      textColor: "#000000",
      btnBg: "#000000",
      btnText: "#ffffff",
      btnStyle: "fill",
      btnShape: "square",
      font: "sans",
      fontHeading: "sans",
    },
    starter: [
      { type: "link", title: "Website" },
      { type: "link", title: "Email me" },
      { type: "socials" },
    ],
  },
  {
    key: "ivory",
    label: "Ivory",
    tagline: "Soft off-white, outlined buttons",
    category: "Minimal",
    theme: "classic",
    design: {
      bg: "solid",
      bgColor: "#f7f5f0",
      textColor: "#1c1b19",
      btnBg: "#1c1b19",
      btnText: "#1c1b19",
      btnStyle: "outline",
      btnShape: "pill",
      font: "serif",
      fontHeading: "classic",
    },
    starter: STARTER_LINKS,
  },
  {
    key: "slate",
    label: "Slate",
    tagline: "Cool grey, crisp and modern",
    category: "Minimal",
    theme: "mono",
    design: {
      bg: "solid",
      bgColor: "#eceef1",
      textColor: "#1f2933",
      btnBg: "#1f2933",
      btnText: "#eceef1",
      btnStyle: "fill",
      btnShape: "rounded",
      font: "grotesk",
      fontHeading: "grotesk",
    },
    starter: STARTER_LINKS,
  },

  /* ---------- Gradient ---------- */
  {
    key: "sunset",
    label: "Sunset",
    tagline: "Warm orange-to-pink, white buttons",
    category: "Gradient",
    theme: "classic",
    design: {
      bg: "gradient",
      bgColor: "#ff8a5c",
      bgColor2: "#d64d7a",
      textColor: "#ffffff",
      btnBg: "#ffffff",
      btnText: "#c2402a",
      btnStyle: "fill",
      btnShape: "pill",
      font: "grotesk",
      fontHeading: "display",
    },
    starter: [
      { type: "link", title: "New single" },
      { type: "link", title: "Tour dates" },
      { type: "socials" },
    ],
  },
  {
    key: "ocean",
    label: "Ocean",
    tagline: "Blue gradient, crisp white buttons",
    category: "Gradient",
    theme: "noir",
    design: {
      bg: "gradient",
      bgColor: "#1e3a8a",
      bgColor2: "#0ea5b7",
      textColor: "#ffffff",
      btnBg: "#ffffff",
      btnText: "#1e3a8a",
      btnStyle: "fill",
      btnShape: "pill",
      font: "sans",
      fontHeading: "grotesk",
    },
    starter: [
      { type: "link", title: "Book a call" },
      { type: "link", title: "Services" },
      { type: "socials" },
    ],
  },
  {
    key: "aurora",
    label: "Aurora",
    tagline: "Teal to violet, glassy buttons",
    category: "Gradient",
    theme: "noir",
    design: {
      bg: "gradient",
      bgColor: "#2dd4bf",
      bgColor2: "#7c3aed",
      textColor: "#ffffff",
      btnBg: "#ffffff",
      btnText: "#ffffff",
      btnStyle: "glass",
      btnShape: "pill",
      font: "grotesk",
      fontHeading: "grotesk",
    },
    starter: STARTER_LINKS,
  },
  {
    key: "peach",
    label: "Peach",
    tagline: "Sunny peach to coral, dark buttons",
    category: "Gradient",
    theme: "bloom",
    design: {
      bg: "gradient",
      bgColor: "#ffd3a5",
      bgColor2: "#fd6585",
      textColor: "#3a1f2b",
      btnBg: "#3a1f2b",
      btnText: "#ffe9d6",
      btnStyle: "fill",
      btnShape: "pill",
      font: "display",
      fontHeading: "display",
    },
    starter: STARTER_LINKS,
  },
  {
    key: "lavender",
    label: "Lavender",
    tagline: "Dreamy purple to pink",
    category: "Gradient",
    theme: "bloom",
    design: {
      bg: "gradient",
      bgColor: "#a18cd1",
      bgColor2: "#fbc2eb",
      textColor: "#2e2545",
      btnBg: "#2e2545",
      btnText: "#ffffff",
      btnStyle: "fill",
      btnShape: "pill",
      font: "display",
      fontHeading: "classic",
    },
    starter: STARTER_LINKS,
  },

  /* ---------- Bold ---------- */
  {
    key: "midnight",
    label: "Midnight",
    tagline: "Dark and sharp with bright buttons",
    category: "Bold",
    theme: "noir",
    design: {
      bg: "solid",
      bgColor: "#0e0e10",
      textColor: "#f4f4f5",
      btnBg: "#f4f4f5",
      btnText: "#0e0e10",
      btnStyle: "fill",
      btnShape: "pill",
      font: "grotesk",
      fontHeading: "grotesk",
    },
    starter: [
      { type: "link", title: "Latest drop" },
      { type: "link", title: "Shop" },
      { type: "socials" },
    ],
  },
  {
    key: "grape",
    label: "Grape",
    tagline: "Rich purple, playful, bold",
    category: "Bold",
    theme: "noir",
    design: {
      bg: "gradient",
      bgColor: "#4c1d95",
      bgColor2: "#7c3aed",
      textColor: "#f5f3ff",
      btnBg: "#f5f3ff",
      btnText: "#4c1d95",
      btnStyle: "fill",
      btnShape: "rounded",
      font: "grotesk",
      fontHeading: "grotesk",
    },
    starter: [
      { type: "link", title: "Watch now" },
      { type: "link", title: "Join Discord" },
      { type: "socials" },
    ],
  },
  {
    key: "electric",
    label: "Electric",
    tagline: "Black with neon-lime buttons",
    category: "Bold",
    theme: "noir",
    design: {
      bg: "solid",
      bgColor: "#0a0a0a",
      textColor: "#eaffb0",
      btnBg: "#d1ff3a",
      btnText: "#0a0a0a",
      btnStyle: "fill",
      btnShape: "square",
      font: "mono",
      fontHeading: "grotesk",
    },
    starter: STARTER_LINKS,
  },
  {
    key: "cherry",
    label: "Cherry",
    tagline: "Deep wine with hot-red buttons",
    category: "Bold",
    theme: "noir",
    design: {
      bg: "solid",
      bgColor: "#1a0a0e",
      textColor: "#ffe1e7",
      btnBg: "#ff2d55",
      btnText: "#ffffff",
      btnStyle: "fill",
      btnShape: "pill",
      font: "grotesk",
      fontHeading: "grotesk",
    },
    starter: STARTER_LINKS,
  },

  /* ---------- Warm ---------- */
  {
    key: "sand",
    label: "Sand",
    tagline: "Editorial serif on warm sand",
    category: "Warm",
    theme: "sand",
    design: {
      bg: "gradient",
      bgColor: "#f3ece1",
      bgColor2: "#e3d7c3",
      textColor: "#3d3226",
      btnBg: "#3d3226",
      btnText: "#f3ece1",
      btnStyle: "fill",
      btnShape: "rounded",
      font: "serif",
      fontHeading: "classic",
    },
    starter: [
      { type: "headline", text: "Work" },
      { type: "link", title: "Portfolio" },
      { type: "link", title: "Book me" },
    ],
  },
  {
    key: "forest",
    label: "Forest",
    tagline: "Deep green, calm, cream buttons",
    category: "Warm",
    theme: "sand",
    design: {
      bg: "solid",
      bgColor: "#1e3a2f",
      textColor: "#eef3ee",
      btnBg: "#eef3ee",
      btnText: "#1e3a2f",
      btnStyle: "fill",
      btnShape: "rounded",
      font: "serif",
      fontHeading: "serif",
    },
    starter: [
      { type: "link", title: "Shop" },
      { type: "text", text: "Handmade, small batch." },
      { type: "socials" },
    ],
  },
  {
    key: "terracotta",
    label: "Terracotta",
    tagline: "Earthy clay with cream buttons",
    category: "Warm",
    theme: "sand",
    design: {
      bg: "solid",
      bgColor: "#c65f3f",
      textColor: "#fff3ec",
      btnBg: "#fff3ec",
      btnText: "#a2432a",
      btnStyle: "fill",
      btnShape: "rounded",
      font: "serif",
      fontHeading: "classic",
    },
    starter: STARTER_LINKS,
  },
  {
    key: "latte",
    label: "Latte",
    tagline: "Creamy beige, coffee-brown buttons",
    category: "Warm",
    theme: "sand",
    design: {
      bg: "solid",
      bgColor: "#efe7db",
      textColor: "#4b3826",
      btnBg: "#6f4e37",
      btnText: "#efe7db",
      btnStyle: "fill",
      btnShape: "pill",
      font: "serif",
      fontHeading: "serif",
    },
    starter: STARTER_LINKS,
  },

  /* ---------- Creator ---------- */
  {
    key: "blush",
    label: "Blush",
    tagline: "Soft pink, elegant, adult-friendly",
    category: "Creator",
    theme: "bloom",
    design: {
      bg: "gradient",
      bgColor: "#fde8ef",
      bgColor2: "#e9d5f2",
      textColor: "#2f2336",
      btnBg: "#2f2336",
      btnText: "#ffffff",
      btnStyle: "fill",
      btnShape: "pill",
      font: "display",
      fontHeading: "display",
    },
    starter: [
      { type: "link", title: "Exclusive content" },
      { type: "link", title: "Instagram" },
      { type: "socials" },
    ],
  },
  {
    key: "rosegold",
    label: "Rose gold",
    tagline: "Soft warm neutral, dark buttons",
    category: "Creator",
    theme: "bloom",
    design: {
      bg: "gradient",
      bgColor: "#f7e7de",
      bgColor2: "#f0d5c8",
      textColor: "#4a2c2a",
      btnBg: "#4a2c2a",
      btnText: "#f7e7de",
      btnStyle: "fill",
      btnShape: "pill",
      font: "display",
      fontHeading: "classic",
    },
    starter: [
      { type: "link", title: "Bookings" },
      { type: "link", title: "Price list" },
      { type: "socials" },
    ],
  },
  {
    key: "velvet",
    label: "Velvet",
    tagline: "Plum night with warm-gold buttons",
    category: "Creator",
    theme: "noir",
    design: {
      bg: "gradient",
      bgColor: "#2b1024",
      bgColor2: "#4a1d3f",
      textColor: "#f6e7d8",
      btnBg: "#e8c9a0",
      btnText: "#2b1024",
      btnStyle: "fill",
      btnShape: "pill",
      font: "display",
      fontHeading: "classic",
    },
    starter: [
      { type: "link", title: "Exclusive content" },
      { type: "link", title: "Tip me" },
      { type: "socials" },
    ],
  },
  {
    key: "noirrose",
    label: "Noir rose",
    tagline: "Black and rose, sultry and clean",
    category: "Creator",
    theme: "noir",
    design: {
      bg: "solid",
      bgColor: "#0e0e10",
      textColor: "#ffd9e2",
      btnBg: "#e75a7c",
      btnText: "#ffffff",
      btnStyle: "fill",
      btnShape: "pill",
      font: "display",
      fontHeading: "display",
    },
    starter: [
      { type: "link", title: "Exclusive content" },
      { type: "link", title: "Instagram" },
      { type: "socials" },
    ],
  },
];

export function templateByKey(key: string | null | undefined): Template | null {
  return TEMPLATES.find((t) => t.key === key) ?? null;
}

/** Prevedie starter na plnohodnotne bloky s ID a poradim. */
export function templateBlocks(t: Template): Block[] {
  return t.starter.map((s, i) => {
    const base = { id: crypto.randomUUID(), position: i, is_active: true };
    if (s.type === "link")
      return { ...base, type: "link" as const, config: { title: s.title ?? "Link", url: "", featured: i === 0 } };
    if (s.type === "headline")
      return { ...base, type: "headline" as const, config: { text: s.text ?? "Section" } };
    if (s.type === "text")
      return { ...base, type: "text" as const, config: { text: s.text ?? "" } };
    if (s.type === "socials")
      return { ...base, type: "socials" as const, config: { items: [{ platform: "instagram" as const, url: "" }] } };
    return { ...base, type: "link" as const, config: { title: s.title ?? "Link", url: "" } };
  });
}
