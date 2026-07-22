"use client";

import { useEffect, useState } from "react";
import type { Theme } from "@/lib/themes";

function parts(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return [
    ["days", Math.floor(s / 86400)],
    ["hrs", Math.floor((s % 86400) / 3600)],
    ["min", Math.floor((s % 3600) / 60)],
    ["sec", s % 60],
  ] as const;
}

export function Countdown({
  title,
  target,
  theme,
}: {
  title?: string;
  target?: string;
  theme: Theme;
}) {
  const targetMs = target ? new Date(target).getTime() : NaN;
  // Prvy render musi sediet so serverom, inak React nahlasi hydration mismatch.
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  if (!target || Number.isNaN(targetMs)) return null;

  const remaining = now === null ? targetMs - targetMs : targetMs - now;
  const done = now !== null && remaining <= 0;

  return (
    <div
      className="rounded-xl px-5 py-5 text-center"
      style={{
        background: theme.btnBg,
        border: theme.btnBorder,
        borderRadius: theme.btnRadius === "999px" ? "18px" : theme.btnRadius,
      }}
    >
      {title && (
        <p className="text-sm font-medium" style={{ color: theme.muted }}>
          {title}
        </p>
      )}

      {done ? (
        <p className="mt-2 text-lg font-semibold">It&apos;s live 🎉</p>
      ) : (
        <div className="mt-3 flex justify-center gap-5">
          {parts(remaining).map(([label, value]) => (
            <div key={label}>
              <p className="text-2xl font-semibold tabular-nums">
                {now === null ? "--" : String(value).padStart(2, "0")}
              </p>
              <p className="text-[11px] tracking-wide uppercase" style={{ color: theme.muted }}>
                {label}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
