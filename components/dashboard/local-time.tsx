"use client";

import { useEffect, useState } from "react";

/** Kratky UTC fallback pre SSR (nez sa na kliente prepne na lokalny cas). */
function utcShort(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-GB", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
    hour12: false,
  });
}

/**
 * Cas navstevy v LOKALNOM pcase navstevnika dashboardu (modelka chce vidiet
 * „kedy" vo svojom case, nie v UTC). SSR vykresli UTC, po hydratacii sa prepne
 * na lokalny — `suppressHydrationWarning` drzi React ticho pri tej vymene.
 */
export function LocalTime({ iso }: { iso: string }) {
  const [label, setLabel] = useState(() => utcShort(iso));

  useEffect(() => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return;
    setLabel(
      d.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    );
  }, [iso]);

  return (
    <time dateTime={iso} suppressHydrationWarning className="tabular-nums">
      {label}
    </time>
  );
}
