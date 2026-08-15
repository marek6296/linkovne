"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { clearAnalytics } from "@/app/dashboard/analytics/actions";

/**
 * Ovladacie prvky nad detailom profilu: vyber casoveho rozsahu (presety +
 * presny pocet dni) a tvrde vymazanie analytik. Rozsah je obmedzeny retenciou
 * planu (`maxDays`) — free drzi 7 dni, platene 30.
 */
export function AnalyticsControls({
  profileId,
  days,
  maxDays,
}: {
  profileId: string;
  days: number;
  maxDays: number;
}) {
  const router = useRouter();
  const [custom, setCustom] = useState("");

  const presets = [7, 14, 30].filter((d) => d <= maxDays);
  // Nech je vzdy aspon plny rozsah planu ako preset (napr. free = len 7).
  if (!presets.includes(maxDays)) presets.push(maxDays);

  function go(d: number) {
    const clamped = Math.max(1, Math.min(maxDays, Math.round(d)));
    router.push(`/dashboard/analytics?p=${profileId}&d=${clamped}`);
  }

  function applyCustom() {
    const n = parseInt(custom, 10);
    if (Number.isFinite(n) && n > 0) go(n);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1 rounded-full border border-line bg-surface p-1">
        {presets.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => go(d)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
              days === d
                ? "bg-ink text-paper"
                : "text-soft hover:text-ink"
            }`}
          >
            {d === 30 ? "30d" : `${d}d`}
          </button>
        ))}
        {/* Presny pocet dni */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            applyCustom();
          }}
          className="flex items-center gap-1 pl-1"
        >
          <input
            value={custom}
            onChange={(e) => setCustom(e.target.value.replace(/[^0-9]/g, ""))}
            inputMode="numeric"
            placeholder={`1–${maxDays}`}
            aria-label={`Custom range in days (max ${maxDays})`}
            className="w-16 rounded-full border border-line bg-paper px-2.5 py-1.5 text-sm outline-none focus:border-ink"
          />
          <button
            type="submit"
            disabled={!custom}
            className="rounded-full px-2.5 py-1.5 text-sm text-soft transition hover:text-ink disabled:opacity-40"
          >
            Go
          </button>
        </form>
      </div>

      {/* Tvrde vymazanie — potvrdenie cez confirm(). */}
      <form
        action={clearAnalytics}
        onSubmit={(e) => {
          if (
            !confirm(
              "Delete ALL analytics for this profile? Views and clicks will be wiped permanently. This can't be undone.",
            )
          ) {
            e.preventDefault();
          }
        }}
      >
        <input type="hidden" name="profileId" value={profileId} />
        <button
          type="submit"
          className="rounded-full border border-line px-3.5 py-2 text-sm text-soft transition hover:border-danger hover:text-danger"
        >
          Clear data
        </button>
      </form>
    </div>
  );
}
