"use client";

import { useEffect } from "react";

export function ViewBeacon({ profileId }: { profileId: string }) {
  useEffect(() => {
    // Kanal citame az v prehliadaci — keby sme cakali searchParams na serveri,
    // stranka by prestala byt staticka a prisli by sme o ISR cache.
    const source = new URLSearchParams(window.location.search).get("s");

    fetch("/api/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        profileId,
        referrer: document.referrer || null,
        source,
      }),
      keepalive: true,
    }).catch(() => {});
  }, [profileId]);

  return null;
}
