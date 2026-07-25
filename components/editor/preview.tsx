"use client";

import type { Block } from "@/lib/blocks";
import type { Theme } from "@/lib/themes";
import { BlockList, ProfileHeader } from "@/components/blocks/render";
import { ProfileTopControls } from "@/components/profile/profile-top-controls";
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
  return (
    <div className="profile-preview mx-auto w-full">
      <div className="mb-3">
        <p className="text-xs font-semibold text-ink">Preview</p>
      </div>

      <div
        className="profile-preview-canvas"
        style={{ background: theme.deskBg ?? theme.page }}
      >
        <div className="profile-preview-viewport">
          <div className="profile-stage">
            <ProfileShell theme={theme} showBranding={showBranding}>
              <ProfileTopControls theme={theme} showPromo={showBranding} />

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
        Draft preview · {profileLabel(username)}
      </p>
    </div>
  );
}
