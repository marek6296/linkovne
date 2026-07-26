"use client";

import { useEffect, useState } from "react";
import { BlockList, ProfileHeader } from "@/components/blocks/render";
import type { Theme } from "@/lib/themes";
import type { Block } from "@/lib/blocks";

type Payload = { bio: string | null; blocks: Block[]; theme: Theme };

/**
 * Stealth (Creator mode) obsah — bio + bloky. V SSR HTML profilu NIE JE nič
 * z tohto (crawler/link-preview bot vidí len meno + fotku). Reálny návštevník
 * si obsah po načítaní stránky doťiahne cez /api/stealth-content a vykreslí.
 */
export function StealthContent({
  username,
  profileId,
  displayName,
  avatarUrl,
  initialTheme,
}: {
  username: string;
  profileId: string;
  displayName: string | null;
  avatarUrl: string | null;
  initialTheme: Theme;
}) {
  const [data, setData] = useState<Payload | null>(null);

  useEffect(() => {
    let alive = true;
    fetch(`/api/stealth-content?u=${encodeURIComponent(username)}`, {
      cache: "no-store",
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: Payload | null) => {
        if (alive && d && Array.isArray(d.blocks)) setData(d);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [username]);

  const theme = data?.theme ?? initialTheme;

  return (
    <>
      <ProfileHeader
        displayName={displayName}
        username={username}
        bio={data?.bio ?? null}
        avatarUrl={avatarUrl}
        theme={theme}
      />
      {data && (
        <div className="profile-links">
          <BlockList blocks={data.blocks} theme={theme} profileId={profileId} />
        </div>
      )}
    </>
  );
}
