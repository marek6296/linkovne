"use client";

import { useLayoutEffect, useRef, useState } from "react";
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
  premium = false,
  profileId,
  displayName,
  username,
  bio,
  avatarUrl,
  blocks,
  theme,
  showBranding = true,
  onSelect,
  onReorder,
}: {
  premium?: boolean;
  profileId: string;
  displayName: string;
  username: string;
  bio: string;
  avatarUrl: string | null;
  blocks: Block[];
  theme: Theme;
  /** Ci sa ukaze „Powered by" (free vzdy, Pro ked branding nevypol). */
  showBranding?: boolean;
  onSelect?: (
    target: { kind: "profile" } | { kind: "block"; id: string },
  ) => void;
  /** Drag-to-reorder priamo na preview — presunie blok `activeId` na `overId`. */
  onReorder?: (activeId: string, overId: string) => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const surface = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ scale: 1, height: 720 });

  useLayoutEffect(() => {
    const container = host.current;
    const content = surface.current;
    if (!container || !content) return;
    const measure = () => {
      const width = container.clientWidth;
      const height = content.offsetHeight;
      if (!width || !height) return; // Hidden mobile tab: measure when shown.
      const availableHeight = Math.max(240, window.innerHeight - 100);
      const scale = Math.min(1, width / 390, availableHeight / height);
      setSize((previous) =>
        previous.scale === scale && previous.height === height
          ? previous
          : { scale, height },
      );
    };
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    observer.observe(content);
    window.addEventListener("resize", measure);
    measure();
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  return (
    <div ref={host} className="profile-preview mx-auto w-full">
      <div className="mb-3">
        <p className="text-xs font-semibold text-ink">Preview</p>
      </div>

      <div
        className="profile-preview-fit"
        style={{ height: size.height * size.scale }}
      >
        <div
          ref={surface}
          className="profile-preview-canvas"
          style={{
            transform: `scale(${size.scale})`,
          }}
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
                        premium={premium}
                        blocks={blocks}
                        theme={theme}
                        profileId={profileId}
                        preview
                      coordinateScale={size.scale}
                        onSelect={
                          onSelect
                            ? (id) => onSelect({ kind: "block", id })
                            : undefined
                        }
                        onReorder={onReorder}
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
        Draft preview · {profileLabel(username)}
      </p>
    </div>
  );
}
