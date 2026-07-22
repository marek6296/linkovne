import type { BlockType } from "@/lib/blocks";

/** Malé line-ikony pre paletu blokov. currentColor = dedí farbu textu. */
export function BlockGlyph({ type }: { type: BlockType }) {
  const common = {
    viewBox: "0 0 24 24",
    className: "h-4 w-4 shrink-0",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  switch (type) {
    case "link":
      return (
        <svg {...common}>
          <path d="M10 14a3.5 3.5 0 0 0 5 0l3-3a3.5 3.5 0 0 0-5-5l-1 1" />
          <path d="M14 10a3.5 3.5 0 0 0-5 0l-3 3a3.5 3.5 0 0 0 5 5l1-1" />
        </svg>
      );
    case "headline":
      return (
        <svg {...common}>
          <path d="M6 5v14M18 5v14M6 12h12" />
        </svg>
      );
    case "text":
      return (
        <svg {...common}>
          <path d="M5 7h14M5 12h14M5 17h9" />
        </svg>
      );
    case "image":
      return (
        <svg {...common}>
          <rect x="4" y="5" width="16" height="14" rx="2" />
          <circle cx="9" cy="10" r="1.4" />
          <path d="m5 17 4-4 3 3 3-3 4 4" />
        </svg>
      );
    case "video":
      return (
        <svg {...common}>
          <rect x="4" y="5" width="16" height="14" rx="2" />
          <path d="m10 9 5 3-5 3z" />
        </svg>
      );
    case "socials":
      return (
        <svg {...common}>
          <circle cx="7" cy="12" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="17" cy="12" r="2" />
        </svg>
      );
    case "faq":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .8-1 1.7" />
          <path d="M12 17h.01" />
        </svg>
      );
    case "countdown":
      return (
        <svg {...common}>
          <circle cx="12" cy="13" r="7" />
          <path d="M12 13V9M9 3h6" />
        </svg>
      );
    case "divider":
      return (
        <svg {...common}>
          <path d="M4 12h16" />
        </svg>
      );
    case "tip":
      return (
        <svg {...common}>
          <path d="M12 20s-6-4.3-8-8a4 4 0 0 1 8-1 4 4 0 0 1 8 1c-2 3.7-8 8-8 8z" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <rect x="5" y="5" width="14" height="14" rx="2" />
        </svg>
      );
  }
}
