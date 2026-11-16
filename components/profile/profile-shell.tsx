"use client";
import { useEffect, useState } from "react";
import { readableText } from "@/lib/design";
import { ProfileEffects } from "@/components/profile/profile-effects";
import { ProfileVideo } from "@/components/profile/profile-video";
import type { CSSProperties, ReactNode } from "react";
import type { Theme } from "@/lib/themes";
import { LogoMark } from "@/components/logo-mark";
import { BRAND_TITLE } from "@/lib/site";

function surfaceStyle(theme: Theme): CSSProperties {
  return {
    background: theme.page,
    color: theme.text,
    fontFamily: theme.font,
    "--profile-glass": readableText(theme.text) === "#0b0b0b" ? "#222135" : "#ffffff",
    "--profile-card-width": `${theme.cardWidthPx ?? 480}px`,
    "--profile-content-width": `${theme.contentWidthPx ?? 424}px`,
    "--profile-block-gap": theme.blockGap ?? "0.75rem",
  } as CSSProperties;
}

export function ProfileShell({
  theme,
  showBranding,
  brandingHref,
  leading,
  children,
}: {
  theme: Theme;
  showBranding: boolean;
  /** Omitted in the editor so the preview cannot navigate away. */
  brandingHref?: string;
  /** Content that must be the first child of the profile surface. */
  leading?: ReactNode;
  children: ReactNode;
}) {
  const [replay, setReplay] = useState(0);
  useEffect(() => { const run = () => setReplay(n => n + 1); window.addEventListener("profile-replay-entrance", run); return () => window.removeEventListener("profile-replay-entrance", run); }, []);
  const branding = (
    <span
      className="profile-branding"
      style={{ color: theme.muted }}
    >
      <LogoMark className="h-3.5 w-3.5" />
      <span>
        Powered by{" "}
        <span className="font-semibold" style={{ color: theme.text }}>
          {BRAND_TITLE}
        </span>
      </span>
    </span>
  );

  return (
    <div key={`${theme.profileEntrance ?? "none"}-${replay}`} className="profile-arrival" data-entrance={theme.profileEntrance ?? "none"}>
    <ProfileEffects theme={theme} scope="card">
    <main className="profile-card" data-surface={theme.profileSurface} data-hover={theme.profileHover} data-entrance={theme.profileEntrance} style={surfaceStyle(theme)}>
      {theme.bgVideo && <ProfileVideo src={theme.bgVideo} poster={theme.bgVideoPoster} className="pointer-events-none absolute inset-0 -z-10 h-full w-full object-cover" />}
      {theme.bgVideo && <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 opacity-60" style={{ background: theme.page }} />}
      {leading}

      {theme.glow && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: theme.glow }}
        />
      )}

      {children}

      {showBranding && (
        <footer className="profile-footer">
          {brandingHref ? (
            <a
              href={brandingHref}
              target="_blank"
              rel="noopener noreferrer"
              className="contents"
            >
              {branding}
            </a>
          ) : (
            branding
          )}
        </footer>
      )}
    </main>
    </ProfileEffects>
    </div>
  );
}
