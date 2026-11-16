"use client";

import { useState } from "react";
import { safeColor } from "@/lib/design";
import type { BlockConfig } from "@/lib/blocks";
import type { Theme } from "@/lib/themes";

export function Faq({
  items,
  config = {},
  theme,
}: {
  items: { q: string; a: string }[];
  config?: BlockConfig;
  theme: Theme;
}) {
  const [open, setOpen] = useState<number | null>(null);
  const visible = items.filter((i) => i.q?.trim());
  if (visible.length === 0) return null;

  return (
    <div
      className="block-surface overflow-hidden"
      style={{
        border: config.faqStyle === "lines" ? undefined : theme.btnBorder,
        borderRadius: theme.btnRadius === "999px" ? "18px" : theme.btnRadius,
        background: config.faqStyle === "lines" ? "transparent" : safeColor(config.color) ?? theme.btnBg,
        color:safeColor(config.textColor) ?? (config.faqStyle === "lines" ? theme.text : theme.btnText),
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
                color: "inherit",
                transform: open === i ? "rotate(45deg)" : "none",
              }}
            >
              +
            </span>
          </button>
          {item.a && (
            <div className="grid transition-[grid-template-rows] duration-300 motion-reduce:transition-none" style={{gridTemplateRows:open===i?"1fr":"0fr"}} aria-hidden={open!==i}><div className="overflow-hidden">
            <p
              className="px-5 pb-4 text-sm leading-relaxed"
              style={{ color: "inherit",opacity:.75,whiteSpace:"pre-wrap",overflowWrap:"anywhere" }}
            >
              {item.a}
            </p></div></div>
          )}
        </div>
      ))}
    </div>
  );
}
