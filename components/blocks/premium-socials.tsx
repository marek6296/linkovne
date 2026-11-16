"use client";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { Icon, ICON_KEYS, type IconKey } from "./icon";
import { SocialIcon } from "./social-icon";
import {
  SOCIAL_LABELS,
  SOCIAL_BRAND,
  socialHref,
  type BlockConfig,
} from "@/lib/blocks";
import { readableText, safeColor } from "@/lib/design";
import type { Theme } from "@/lib/themes";

/** The rail is mounted in the profile surface, never against the editor viewport. */
export function PremiumSocials({
  config,
  theme,
  preview = false,
}: {
  config: BlockConfig;
  theme: Theme;
  preview?: boolean;
}) {
  const [host, setHost] = useState<HTMLElement | null>(null);
  const marker = useRef<HTMLSpanElement>(null);
  const mode = config.socialPresentation ?? "dock";
  useEffect(() => {
    if (mode !== "rail") return;
    const slot = marker.current?.closest(".profile-card")?.querySelector<HTMLElement>(".profile-header-social-slot");
    setHost(slot ?? null);
  }, [mode]);
  const items = (config.items ?? []).filter((item) => item.url?.trim());
  if (!items.length) return null;
  const links = items.map((item, index) => {
    const label =
      item.platform === "custom"
        ? item.label?.trim() || "Website"
        : SOCIAL_LABELS[item.platform] || "Website";
    const accent =
      safeColor(item.color) ??
      (config.socialStyle === "brand"
        ? SOCIAL_BRAND[item.platform]
        : safeColor(config.socialColor)) ??
      theme.text;
    const bg =
      mode === "rail" ? accent : (safeColor(config.socialBg) ?? theme.btnBg);
    return (
      <a
        key={`${item.platform}-${index}`}
        href={preview ? "#" : socialHref(item.platform, item.url)}
        onClick={(e) => {
          if (preview) e.preventDefault();
        }}
        target={preview ? undefined : "_blank"}
        rel="noopener noreferrer"
        aria-label={label}
        title={label}
        style={
          {
            "--social-accent": accent,
            "--social-bg": bg,
            "--social-fg": readableText(bg),
            "--social-delay": `${Math.min(index, 8) * 35}ms`,
          } as CSSProperties
        }
      >
        <span className="premium-social-glyph" aria-hidden>
          {item.platform === "custom" &&
          ICON_KEYS.includes(item.icon as IconKey) ? (
            <Icon name={item.icon as IconKey} className="h-6 w-6" />
          ) : (
            <SocialIcon platform={item.platform} size={24} />
          )}
        </span>
        <span className="premium-social-name">{label}</span>
      </a>
    );
  });
  const rail = <nav className="premium-profile-rail" aria-label="Social links">{links}</nav>;
  return <>
    <span ref={marker} className="premium-social-marker" />
    {mode === "rail"
      ? host ? createPortal(rail, host) : rail
      : <div className={`premium-socials premium-socials-${mode}`}>{links}</div>}
  </>;
}
