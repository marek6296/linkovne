"use client";
import { useEffect, useState } from "react";
import type { Theme } from "@/lib/themes";
import type { BlockConfig } from "@/lib/blocks";
import { safeColor, safeUrl } from "@/lib/design";

export function Countdown({
  title,
  target,
  theme,
  config = {},
}: {
  title?: string;
  target?: string;
  theme: Theme;
  config?: BlockConfig;
}) {
  const targetMs = target ? new Date(target).getTime() : NaN;
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [target]);
  if (!Number.isFinite(targetMs)) return null;
  const seconds = Math.max(
    0,
    Math.floor((targetMs - (now ?? targetMs)) / 1000),
  );
  const done = now !== null && seconds === 0;
  const image = safeUrl(config.src),
    href = safeUrl(config.href);
  const values = [
    Math.floor(seconds / 86400),
    Math.floor((seconds % 86400) / 3600),
    Math.floor((seconds % 3600) / 60),
    seconds % 60,
  ];
  const style = {
    background: safeColor(config.color) ?? theme.btnBg,
    color: safeColor(config.textColor) ?? theme.btnText,
    border: theme.btnBorder,
    borderRadius: theme.btnRadius === "999px" ? "18px" : theme.btnRadius,
  };
  const content = (
    <>
      {image && (
        <img
          src={image}
          alt={config.alt ?? ""}
          className="aspect-[16/9] w-full object-cover"
        />
      )}
      <div className="p-5 text-center">
        {title && <p className="font-semibold break-words">{title}</p>}
        {done ? (
          <p className="mt-3 text-lg font-semibold">
            {config.completedText || "It's live"}
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-4 gap-2">
            {values.map((value, i) => (
              <div
                key={i}
                className={
                  config.countdownStyle === "tiles"
                    ? "rounded-xl bg-current/5 px-1 py-3"
                    : "py-1"
                }
              >
                <p className="text-2xl font-semibold tabular-nums">
                  {now === null ? "—" : String(value).padStart(2, "0")}
                </p>
                <p className="mt-1 text-[10px] uppercase tracking-wide opacity-70">
                  {["Days", "Hours", "Min", "Sec"][i]}
                </p>
              </div>
            ))}
          </div>
        )}
        {href && (
          <p className="mt-4 text-sm font-medium underline underline-offset-4">
            {config.buttonLabel || "View event"}
          </p>
        )}
      </div>
    </>
  );
  return href ? (
    <a
      href={href}
      rel="noopener"
      className="block-surface block overflow-hidden transition hover:brightness-105 focus-visible:outline-2"
      style={style}
    >
      {content}
    </a>
  ) : (
    <div className="block-surface overflow-hidden" style={style}>
      {content}
    </div>
  );
}
