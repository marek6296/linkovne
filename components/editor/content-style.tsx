"use client";
import type { BlockConfig, BlockType } from "@/lib/blocks";
export function ContentStyle({
  type,
  config,
  onChange,
}: {
  type: BlockType;
  config: BlockConfig;
  onChange: (patch: Partial<BlockConfig>) => void;
}) {
  const select = (
    label: string,
    key: keyof BlockConfig,
    values: Record<string, string>,
    fallback: string,
  ) => (
    <label className="block text-sm">
      {label}
      <select
        className="field mt-1"
        value={String(config[key] ?? fallback)}
        onChange={(e) => onChange({ [key]: e.target.value })}
      >
        {Object.entries(values).map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  );
  return (
    <div className="grid grid-cols-2 gap-3 border-t border-line pt-4">
      {type === "countdown" &&
        select(
          "Display",
          "countdownStyle",
          { minimal: "Minimal", tiles: "Number tiles" },
          "minimal",
        )}
      {type === "faq" &&
        select(
          "Display",
          "faqStyle",
          { card: "Card", lines: "Simple lines" },
          "card",
        )}
      {type === "divider" && (
        <>
          {select(
            "Line style",
            "dividerStyle",
            {
              solid: "Solid",
              dashed: "Dashed",
              dotted: "Dotted",
              space: "Space only",
            },
            "solid",
          )}
          {select(
            "Width",
            "dividerWidth",
            { short: "Short", medium: "Half", full: "Full" },
            "short",
          )}
          {select(
            "Spacing",
            "blockSpacing",
            { compact: "Compact", normal: "Balanced", airy: "Airy" },
            "normal",
          )}
        </>
      )}
      {(type === "headline" || type === "text") && (
        <>
          {select(
            "Alignment",
            "textAlign",
            { left: "Left", center: "Centre", right: "Right" },
            "left",
          )}
          {select(
            "Size",
            "textSize",
            { small: "Small", medium: "Medium", large: "Large" },
            "medium",
          )}
        </>
      )}
      {["countdown", "faq", "divider"].includes(type) && (
        <label className="text-sm">
          {type === "divider" ? "Line colour" : "Background"}
          <input
            type="color"
            className="mt-2 block h-9 w-full"
            value={config.color ?? "#ffffff"}
            onChange={(e) => onChange({ color: e.target.value })}
          />
        </label>
      )}
      {type !== "divider" && (
        <label className="text-sm">
          Text colour
          <input
            type="color"
            className="mt-2 block h-9 w-full"
            value={config.textColor ?? "#202027"}
            onChange={(e) => onChange({ textColor: e.target.value })}
          />
        </label>
      )}
      <button
        type="button"
        className="col-span-2 text-left text-xs text-soft underline"
        onClick={() => onChange({ color: undefined, textColor: undefined })}
      >
        Use theme colours
      </button>
    </div>
  );
}
