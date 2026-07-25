"use client";

import { useState } from "react";
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
  const [device, setDevice] = useState<"mobile" | "desktop">("desktop");

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
    <div
      className={`profile-preview profile-preview--${device} mx-auto w-full`}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-ink">Responsive preview</p>
          <p className="text-[11px] text-faint">
            Check the exact mobile and desktop layout
          </p>
        </div>
        <div
          className="inline-flex rounded-full border border-line bg-surface p-1"
          role="group"
          aria-label="Preview device"
        >
          {(["mobile", "desktop"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setDevice(option)}
              aria-pressed={device === option}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition ${
                device === option
                  ? "bg-ink text-paper shadow-sm"
                  : "text-soft hover:text-ink"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div
        className="profile-preview-canvas"
        style={{ background: theme.deskBg ?? theme.page }}
      >
        <div className="profile-preview-viewport">
          <div className="profile-stage">
            <ProfileShell theme={theme} showBranding={showBranding}>
              <div
                className="profile-preview-toolbar absolute inset-x-0 top-[18px] z-40 mx-auto flex w-full items-center justify-between"
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

      <p className="mt-3 text-center text-xs text-faint">
        {device === "mobile" ? "Mobile · 390 px" : "Desktop · full card"} draft
        preview ·{" "}
        {profileLabel(username)}
      </p>
    </div>
  );
}
