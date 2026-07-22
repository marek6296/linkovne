"use client";

import { useState } from "react";
import type { Theme } from "@/lib/themes";

export function Faq({
  items,
  theme,
}: {
  items: { q: string; a: string }[];
  theme: Theme;
}) {
  const [open, setOpen] = useState<number | null>(null);
  const visible = items.filter((i) => i.q?.trim());
  if (visible.length === 0) return null;

  return (
    <div
      className="overflow-hidden"
      style={{
        border: theme.btnBorder,
        borderRadius: theme.btnRadius === "999px" ? "18px" : theme.btnRadius,
        background: theme.btnBg,
      }}
    >
      {visible.map((item, i) => (
        <div
          key={i}
          style={{ borderTop: i === 0 ? undefined : theme.btnBorder }}
        >
          <button
            type="button"
            onClick={() => setOpen(open === i ? null : i)}
            aria-expanded={open === i}
            className="flex w-full items-center justify-between gap-3 px-5 py-3.5 text-left text-sm font-medium"
          >
            {item.q}
            <span
              className="shrink-0 transition-transform duration-200"
              style={{
                color: theme.muted,
                transform: open === i ? "rotate(45deg)" : "none",
              }}
            >
              +
            </span>
          </button>
          {open === i && item.a && (
            <p
              className="px-5 pb-4 text-sm leading-relaxed"
              style={{ color: theme.muted }}
            >
              {item.a}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
