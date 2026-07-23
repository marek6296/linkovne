"use client";

import { useState } from "react";
import {
  TEMPLATES,
  TEMPLATE_CATEGORIES,
  type Template,
} from "@/lib/templates";
import { resolveTheme } from "@/lib/design";

/**
 * Nahlad kreslime cez resolveTheme — presne tie farby, tvar a font, ktore
 * user reálne dostane. Ziadne samostatne "preview" farby, ktore by sa mohli
 * rozist s realitou (a robit neviditelne tlacidla).
 */
function TemplateCard({
  t,
  onPick,
}: {
  t: Template;
  onPick: (t: Template) => void;
}) {
  const theme = resolveTheme(t.theme, t.design);
  const sourceWidth = theme.avatarWidthPx ?? theme.avatarSizePx ?? 96;
  const sourceHeight = theme.avatarHeightPx ?? theme.avatarSizePx ?? 96;
  const avatarWidth = Math.max(30, Math.min(58, sourceWidth * 0.34));
  const avatarHeight = Math.max(
    28,
    Math.min(54, sourceHeight * (avatarWidth / sourceWidth)),
  );
  const templateLinks = t.starter
    .filter((item) => item.type === "link")
    .slice(0, 3);
  const previewLinks =
    templateLinks.length > 0
      ? templateLinks
      : [
          { type: "link" as const, title: "Featured link", width: "full" as const },
          { type: "link" as const, title: "Explore more", width: "full" as const },
        ];
  const previewRows: (typeof previewLinks)[] = [];
  for (let i = 0; i < previewLinks.length; i++) {
    const current = previewLinks[i];
    const next = previewLinks[i + 1];
    if (current.width === "half" && next?.width === "half") {
      previewRows.push([current, next]);
      i++;
    } else {
      previewRows.push([current]);
    }
  }

  return (
    <button
      type="button"
      onClick={() => onPick(t)}
      className="group relative overflow-hidden rounded-2xl border border-line bg-surface text-left transition duration-200 hover:-translate-y-1 hover:border-ink hover:shadow-[0_14px_34px_rgba(25,24,19,0.13)]"
    >
      {t.featured && (
        <span className="absolute top-2.5 right-2.5 z-20 rounded-full bg-black/70 px-2 py-1 text-[9px] font-bold tracking-wider text-white uppercase backdrop-blur-sm">
          New
        </span>
      )}
      <div
        className="relative flex h-48 flex-col items-center overflow-hidden px-5 pt-5"
        style={{
          background: theme.page,
          color: theme.text,
          fontFamily: theme.font,
        }}
      >
        {theme.glow && (
          <span
            aria-hidden
            className="absolute inset-0"
            style={{ background: theme.glow }}
          />
        )}
        <div className="relative z-10 flex w-full flex-col items-center">
          {/* Avatar faithfully mirrors aspect, crop shape and frame. */}
          <div
            style={{
              width: avatarWidth,
              height: avatarHeight,
              background: theme.avatarBg,
              borderRadius: theme.avatarRadius ?? "999px",
              border: theme.avatarBorder,
              boxShadow:
                theme.avatarShadow ??
                (theme.avatarRing
                  ? theme.avatarRing.replaceAll("4px", "2px")
                  : "0 7px 16px -8px rgba(0,0,0,0.45)"),
            }}
          />
          <p
            className="mt-2 max-w-full truncate text-[13px] font-semibold tracking-tight"
            style={{ fontFamily: theme.fontHeading ?? theme.font }}
          >
            Your name
          </p>
        </div>
        <div
          className="relative z-10 mt-2 flex w-full flex-col"
          style={{ gap: "6px" }}
        >
          {previewRows.map((row) => (
            <div
              key={row.map((item) => item.title).join("-")}
              className={row.length === 2 || row[0].width === "half" ? "grid grid-cols-2 gap-1.5" : ""}
            >
              {row.map((item) => (
                <div
                  key={item.title}
                  className="flex h-7 items-center justify-center truncate px-2 text-[9px]"
                  style={{
                    background: theme.btnBg,
                    color: theme.btnText,
                    border: theme.btnBorder,
                    borderRadius: theme.btnRadius,
                    boxShadow: theme.btnShadow,
                    backdropFilter: theme.btnBackdrop,
                    WebkitBackdropFilter: theme.btnBackdrop,
                    fontWeight: theme.btnWeight ?? 500,
                  }}
                >
                  {item.title ?? "Link"}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-line bg-surface p-3.5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold">{t.label}</p>
          <span className="text-[9px] font-semibold tracking-wide text-faint uppercase">
            {t.category}
          </span>
        </div>
        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-soft">
          {t.tagline}
        </p>
      </div>
    </button>
  );
}

export function TemplateGrid({ onPick }: { onPick: (t: Template) => void }) {
  type Filter = "Featured" | "All" | Template["category"];
  const [filter, setFilter] = useState<Filter>("Featured");
  const filters: Filter[] = ["Featured", "All", ...TEMPLATE_CATEGORIES];

  const groups =
    filter === "Featured"
      ? [{ label: "New premium", items: TEMPLATES.filter((t) => t.featured) }]
      : filter === "All"
        ? TEMPLATE_CATEGORIES.map((category) => ({
            label: category,
            items: TEMPLATES.filter((t) => t.category === category),
          }))
        : [
            {
              label: filter,
              items: TEMPLATES.filter((t) => t.category === filter),
            },
          ];

  return (
    <div>
      <div className="mb-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold">Premium template collection</p>
            <p className="mt-1 text-xs text-soft">
              A complete, accessible look applied in one click.
            </p>
          </div>
          <span className="shrink-0 text-xs text-faint">
            {TEMPLATES.length} looks
          </span>
        </div>
        <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1">
          {filters.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setFilter(item)}
              aria-pressed={filter === item}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                filter === item
                  ? "border-ink bg-ink text-paper"
                  : "border-line bg-surface text-soft hover:border-soft hover:text-ink"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-7">
        {groups.map(({ label, items }) =>
          items.length > 0 ? (
            <div key={label}>
              <p className="mb-2.5 text-xs font-semibold tracking-wide text-faint uppercase">
                {label}
              </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {items.map((t) => (
                <TemplateCard key={t.key} t={t} onPick={onPick} />
              ))}
            </div>
            </div>
          ) : null,
        )}
      </div>
    </div>
  );
}
