import { BRAND } from "@/lib/site";

export function Wordmark({
  className = "",
  dotClassName = "text-accent",
}: {
  className?: string;
  /** Farba bodky — na farebnych paneloch sa da zmenit napr. na biele. */
  dotClassName?: string;
}) {
  return (
    <span className={`font-semibold tracking-tight ${className}`}>
      {BRAND}
      <span className={dotClassName}>.</span>
    </span>
  );
}
