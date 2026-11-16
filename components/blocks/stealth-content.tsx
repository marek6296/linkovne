"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { BlockList, ProfileHeader } from "@/components/blocks/render";
import { useProfileReady } from "@/components/profile/profile-load-boundary";
import type { Theme } from "@/lib/themes";
import type { Block } from "@/lib/blocks";

type Payload = { bio: string | null; blocks: Block[]; theme: Theme };

/**
 * Stealth (Creator mode) obsah — bio + bloky. V SSR HTML profilu NIE JE nič
 * z tohto (crawler/link-preview bot vidí len meno + fotku). Reálny návštevník
 * si obsah po načítaní stránky doťiahne cez /api/stealth-content a vykreslí.
 */
export function StealthContent({
  premium = false,
  username,
  profileId,
  displayName,
  avatarUrl,
  initialTheme,
}: {
  premium?: boolean;
  username: string;
  profileId: string;
  displayName: string | null;
  avatarUrl: string | null;
  initialTheme: Theme;
}) {
  const [data, setData] = useState<Payload | null>(null);

  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const setReady = useProfileReady();
  useLayoutEffect(() => { setReady(!!data || error); }, [data, error, setReady]);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    let alive = true;
    fetch(`/api/stealth-content?u=${encodeURIComponent(username)}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: Payload | null) => {
        if (!alive) return;
        if (d && Array.isArray(d.blocks)) setData(d);
        else setError(true);
      })
      .catch(() => { if (alive) setError(true); })
      .finally(() => clearTimeout(timeout));
    return () => {
      alive = false;
      clearTimeout(timeout);
      controller.abort();
    };
  }, [username, attempt]);

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
      {error && <div role="alert" className="mt-6 text-center text-sm"><p>We couldn’t load this profile.</p><button type="button" className="mt-3 underline" onClick={() => {setError(false);setAttempt(n => n + 1);}}>Try again</button></div>}
      {data && (
        <div className="profile-links">
          <BlockList premium={premium} blocks={data.blocks} theme={theme} profileId={profileId} />
        </div>
      )}
    </>
  );
}
