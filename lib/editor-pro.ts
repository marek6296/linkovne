import type { Block } from "@/lib/blocks";
import { readableText, safeColor, type Design } from "@/lib/design";
import { resolveTheme } from "@/lib/design";

export type AuditIssue = {
  id: string;
  severity: "error" | "warning";
  title: string;
  detail: string;
  blockId?: string;
  fix?: "text" | "button" | "motion" | "alt";
};

function channel(v: number) {
  const n = v / 255;
  return n <= 0.03928 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4;
}

function luminance(raw: string) {
  let h = raw.replace("#", "");
  if (h.length === 3) h = h.replace(/(.)/g, "$1$1");
  if (!/^[0-9a-f]{6}$/i.test(h)) return null;
  const n = Number.parseInt(h, 16);
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
}

export function contrast(a: string, b: string) {
  const x = luminance(a);
  const y = luminance(b);
  if (x === null || y === null) return 21;
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

export function auditDesign(themeKey: string, design: Design, blocks: Block[], broken: Set<string>): AuditIssue[] {
  const theme = resolveTheme(themeKey, design);
  const page = safeColor(design.bgColor) ?? safeColor(theme.page) ?? "#ffffff";
  const text = safeColor(design.textColor) ?? safeColor(theme.text) ?? "#111111";
  const button = safeColor(design.btnBg) ?? safeColor(theme.btnBg) ?? "#111111";
  const buttonText = safeColor(design.btnText) ?? safeColor(theme.btnText) ?? "#ffffff";
  const issues: AuditIssue[] = [];

  if (contrast(page, text) < 4.5) issues.push({ id: "text-contrast", severity: "error", title: "Text is hard to read", detail: "Page text does not have enough contrast against the background.", fix: "text" });
  if (contrast(button, page) < 1.35 || contrast(button, buttonText) < 4.5) issues.push({ id: "button-contrast", severity: "error", title: "Button may disappear", detail: "The button or its label blends into the page.", fix: "button" });
  if ((design.btnAnimation ?? "none") !== "none" && blocks.filter((b) => b.type === "link" && b.is_active).length > 5) issues.push({ id: "motion", severity: "warning", title: "Too much movement", detail: "Animation on many buttons competes for attention.", fix: "motion" });
  for (const block of blocks) {
    if (block.type === "image" && block.config.src && block.config.mediaType !== "video" && !block.config.alt?.trim()) issues.push({ id: `alt-${block.id}`, severity: "warning", title: "Image needs alt text", detail: "Add a short description for accessibility.", blockId: block.id, fix: "alt" });
    if (broken.has(block.id)) issues.push({ id: `broken-${block.id}`, severity: "error", title: "Broken link", detail: "The last automated check could not open this destination.", blockId: block.id });
    const bytes = Number((block.config as Record<string, unknown>).mediaBytes ?? 0);
    if (bytes > 4_000_000) issues.push({ id: `large-${block.id}`, severity: "warning", title: "Large image", detail: "Replace or compress this image to make the page faster.", blockId: block.id });
  }
  return issues;
}

export function autoFixDesign(design: Design, issues: AuditIssue[]) {
  const next = { ...design };
  if (issues.some((i) => i.fix === "text")) next.textColor = readableText(safeColor(next.bgColor) ?? "#ffffff");
  if (issues.some((i) => i.fix === "button")) {
    const page = safeColor(next.bgColor) ?? "#ffffff";
    next.btnBg = readableText(page) === "#ffffff" ? "#171717" : "#f5f5f5";
    next.btnText = readableText(next.btnBg);
  }
  if (issues.some((i) => i.fix === "motion")) next.btnAnimation = "none";
  return next;
}
