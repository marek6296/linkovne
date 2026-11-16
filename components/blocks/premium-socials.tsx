"use client";
import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
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
  const [wide, setWide] = useState(false);
  const [open, setOpen] = useState(false);
  const [host, setHost] = useState<HTMLElement | null>(null);
  const marker = useRef<HTMLSpanElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const id = useId();
  const mode = config.socialPresentation ?? "dock";
  useEffect(() => {
    setHost(marker.current?.closest<HTMLElement>(".profile-card") ?? null);
  }, []);
  useEffect(() => {
    if (!open) return;
    menu.current?.querySelector("a")?.focus({ preventScroll: true });
    const close = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        toggle.current?.focus();
      }
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [open]);
  useEffect(() => {
    const query = window.matchMedia("(min-width: 1024px) and (hover: hover)");
    const update = () => setWide(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  const expanded = wide || open;
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
        tabIndex={mode === "rail" && !expanded ? -1 : undefined}
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
  const rail = (
    <>
      {open && !wide && (
        <button
          type="button"
          className="premium-social-backdrop"
          data-preview={preview}
          aria-label="Close social menu"
          onClick={() => {
            setOpen(false);
            toggle.current?.focus();
          }}
        />
      )}
      <div
        className="premium-social-rail"
        data-open={expanded}
        data-wide={wide}
        data-preview={preview}
        style={
          {
            "--rail-bg": theme.btnBg,
            "--rail-fg": theme.btnText,
          } as CSSProperties
        }
      >
        <div
          ref={menu}
          id={id}
          className="premium-social-rail-links"
          aria-hidden={!expanded}
        >
          {links}
        </div>
        <button
          ref={toggle}
          type="button"
          className="premium-social-toggle"
          aria-label={open ? "Close social links" : "Open social links"}
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? (
            <span aria-hidden>×</span>
          ) : (
            <>
            <svg
              aria-hidden
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <path d="m9 10 6-4m-6 8 6 4" />
            </svg>
            <span className="premium-social-toggle-label">Social links</span>
            </>
          )}
        </button>
      </div>
    </>
  );
  return (
    <>
      <span ref={marker} className="premium-social-marker" />
      {mode === "rail" ? (
        host && createPortal(rail, preview ? host : document.body)
      ) : (
        <div className={`premium-socials premium-socials-${mode}`}>{links}</div>
      )}
    </>
  );
}
