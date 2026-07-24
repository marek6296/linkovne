"use client";

import type { Block } from "@/lib/blocks";
import type { Theme } from "@/lib/themes";
import { BlockList, ProfileHeader } from "@/components/blocks/render";
import { LogoMark } from "@/components/logo-mark";
import { ProfileShell } from "@/components/profile/profile-shell";
import { profileLabel } from "@/lib/site";

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
      <div className="relative overflow-hidden rounded-[3.1rem] p-4">
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background: theme.deskBg ?? theme.page,
            ...(theme.deskBlur !== false
              ? {
                  filter: "blur(64px) brightness(0.72)",
                  transform: "scale(1.35)",
                }
              : null),
          }}
        />
        <div className="relative rounded-[2.55rem] border-[7px] border-neutral-950 bg-neutral-950 shadow-[0_26px_70px_rgba(25,24,19,0.24)]">
          <div className="profile-preview-viewport">
            <div className="profile-stage">
              <ProfileShell theme={theme} showBranding={showBranding}>
                {/* The same top-bar measurements and theme styles as live. */}
                <div
                  className="absolute inset-x-0 top-[18px] z-40 mx-auto flex w-full items-center justify-between px-5"
                  style={{ maxWidth: theme.contentWidthPx ?? 424 }}
                >
                  {showBranding ? (
                    <span
                      className="flex h-11 w-11 items-center justify-center rounded-full"
                      style={chip}
                    >
                      <LogoMark className="h-[22px] w-[22px]" />
                    </span>
                  ) : (
                    <span />
                  )}
                  <span
                    className="flex h-11 w-11 items-center justify-center rounded-full"
                    style={chip}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="h-[18px] w-[18px]"
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

                <div
                  className={`profile-content profile-content--${
                    theme.profileLayout ?? "centered"
                  }`}
                >
                  <div className="reveal">
                    <ProfileHeader
                      displayName={displayName}
                      username={username}
                      bio={bio}
                      avatarUrl={avatarUrl}
                      theme={theme}
                      onSelect={
                        onSelect
                          ? () => onSelect({ kind: "profile" })
                          : undefined
                      }
                    />
                    <div className="profile-links">
                      <BlockList
                        blocks={blocks}
                        theme={theme}
                        profileId={profileId}
                        preview
                        onSelect={
                          onSelect
                            ? (id) => onSelect({ kind: "block", id })
                            : undefined
                        }
                      />
                    </div>
                    {blocks.length === 0 && (
                      <p
                        className="mt-9 text-center text-sm"
                        style={{ color: theme.muted }}
                      >
                        No links here yet.
                      </p>
                    )}
                  </div>
                </div>
              </ProfileShell>
            </div>
          </div>
        </div>
      </div>
      <p className="mt-3 text-center text-xs text-faint">
        Draft preview · not the currently published page ·{" "}
        {profileLabel(username)}
      </p>
    </div>
  );
}
