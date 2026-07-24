"use client";

import type { Block } from "@/lib/blocks";
import type { Theme } from "@/lib/themes";
import { BlockList, ProfileHeader } from "@/components/blocks/render";
import { LogoMark } from "@/components/logo-mark";
import { profileLabel, BRAND_TITLE } from "@/lib/site";

/**
 * Zivy nahlad — VERNA kopia verejnej stranky (app/[username]/page.tsx): rovnaka
 * paleta, glow (odlesky/hlbka), plavajuce tlacidla hore (promo + share),
 * rovnake linkove tlacidla aj „Powered by" paticka. Co vidis tu, to navstevnik
 * dostane. Jedina odlisnost: tu sa nedaju kliknut (hrefFor => "#").
 */
export function Preview({
  profileId,
  displayName,
  username,
  bio,
  avatarUrl,
  blocks,
  theme,
  showBranding = true,
  onSelect,
}: {
  profileId: string;
  displayName: string;
  username: string;
  bio: string;
  avatarUrl: string | null;
  blocks: Block[];
  theme: Theme;
  /** Ci sa ukaze „Powered by" (free vzdy, Pro ked branding nevypol). */
  showBranding?: boolean;
  onSelect?: (target: { kind: "profile" } | { kind: "block"; id: string }) => void;
}) {
  // Rovnaky styl plavajucich tlacidiel ako na verejnej stranke — drzi farby,
  // obrys aj tien/odlesk temy, takze aj tie sedia 1:1.
  const chip: React.CSSProperties = {
    background: theme.btnBg,
    color: theme.btnText,
    border: theme.btnBorder,
    boxShadow: theme.btnShadow,
    backdropFilter: theme.btnBackdrop,
    WebkitBackdropFilter: theme.btnBackdrop,
  };

  return (
    <div className="profile-preview mx-auto w-full max-w-[382px]">
      {/* Desktop backdrop za kartou — verne ako na PC verejnej stranke. */}
      <div className="relative overflow-hidden rounded-[3.1rem] p-4">
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background: theme.deskBg ?? theme.page,
            ...(theme.deskBlur !== false
              ? { filter: "blur(30px) brightness(0.8)", transform: "scale(1.4)" }
              : null),
          }}
        />
        <div className="relative rounded-[2.55rem] border-[7px] border-neutral-950 bg-neutral-950 shadow-[0_26px_70px_rgba(25,24,19,0.24)]">
        <div
          className="relative flex h-[650px] flex-col overflow-y-auto rounded-[2.05rem] px-[18px] py-[18px]"
          style={{
            background: theme.page,
            color: theme.text,
            fontFamily: theme.font,
          }}
        >
          {/* Dekorativny glow — presne ako na verejnej stranke (hlbka/odlesk) */}
          {theme.glow && (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{ background: theme.glow }}
            />
          )}

          {/* Plavajuce tlacidla hore: promo (vlavo, len ak branding) + share */}
          <div className="relative z-20 flex items-center justify-between">
            {showBranding ? (
              <span
                className="flex h-10 w-10 items-center justify-center rounded-full"
                style={chip}
              >
                <LogoMark className="h-[18px] w-[18px]" />
              </span>
            ) : (
              <span />
            )}
            <span
              className="flex h-10 w-10 items-center justify-center rounded-full"
              style={chip}
            >
              <svg
                viewBox="0 0 24 24"
                className="h-[16px] w-[16px]"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" />
                <path d="M16 6l-4-4-4 4" />
                <path d="M12 2v14" />
              </svg>
            </span>
          </div>

          {/* Obsah */}
          <div
            className={`relative z-10 ${
              theme.profileLayout === "hero" ? "mt-5" : "mt-8"
            }`}
          >
            <ProfileHeader
              displayName={displayName}
              username={username}
              bio={bio}
              avatarUrl={avatarUrl}
              theme={theme}
              onSelect={onSelect ? () => onSelect({ kind: "profile" }) : undefined}
            />
            <div className={theme.profileLayout === "hero" ? "mt-5" : "mt-7"}>
              <BlockList
                blocks={blocks}
                theme={theme}
                profileId={profileId}
                preview
                onSelect={onSelect ? (id) => onSelect({ kind: "block", id }) : undefined}
              />
            </div>
            {blocks.length === 0 && (
              <p
                className="mt-8 text-center text-sm"
                style={{ color: theme.muted }}
              >
                No links here yet.
              </p>
            )}
          </div>

          {/* Powered by — presne ako na stranke, dole cez mt-auto */}
          {showBranding && (
            <footer className="relative z-10 mt-auto pt-8 pb-1 text-center">
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
            </footer>
          )}
        </div>
      </div>
      </div>
      <p className="mt-3 text-center text-xs text-faint">
        Live preview · {profileLabel(username)}
      </p>
    </div>
  );
}
