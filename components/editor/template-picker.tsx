"use client";

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

  return (
    <button
      type="button"
      onClick={() => onPick(t)}
      className="group overflow-hidden rounded-2xl border border-line text-left transition hover:-translate-y-0.5 hover:border-ink hover:shadow-[0_10px_28px_rgba(25,24,19,0.10)]"
    >
      <div
        className="flex h-44 flex-col items-center gap-2 px-6 pt-6"
        style={{ background: theme.page }}
      >
        {/* avatar */}
        <div
          className="h-9 w-9 rounded-full"
          style={{ background: theme.avatarBg }}
        />
        {/* meno */}
        <div
          className="h-2 w-16 rounded-full"
          style={{ background: theme.text, opacity: 0.75 }}
        />
        <div className="mt-1 w-full space-y-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="flex h-6 items-center justify-center"
              style={{
                background: theme.btnBg,
                color: theme.btnText,
                border: theme.btnBorder,
                borderRadius: theme.btnRadius,
                boxShadow: theme.btnShadow,
                backdropFilter: theme.btnBackdrop,
                WebkitBackdropFilter: theme.btnBackdrop,
              }}
            >
              <span
                className="h-1.5 w-10 rounded-full"
                style={{ background: theme.btnText, opacity: 0.65 }}
              />
            </div>
          ))}
        </div>
      </div>
      <div className="bg-surface p-4">
        <p className="text-sm font-semibold">{t.label}</p>
        <p className="mt-0.5 text-xs text-soft">{t.tagline}</p>
      </div>
    </button>
  );
}

export function TemplateGrid({ onPick }: { onPick: (t: Template) => void }) {
  return (
    <div className="space-y-6">
      {TEMPLATE_CATEGORIES.map((cat) => {
        const items = TEMPLATES.filter((t) => t.category === cat);
        if (items.length === 0) return null;
        return (
          <div key={cat}>
            <p className="mb-2.5 text-xs font-semibold tracking-wide text-faint uppercase">
              {cat}
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {items.map((t) => (
                <TemplateCard key={t.key} t={t} onPick={onPick} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
