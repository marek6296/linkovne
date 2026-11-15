"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { SITE_DOMAIN } from "@/lib/site";
import {
  isTrackedSitePath,
  NO_TRACK_KEY,
  PRICING_SECTION_PATH,
} from "@/lib/site-analytics";

/**
 * Meranie navstevnosti marketingoveho webu linkovne.com — bez cookies.
 * Zije v root layoute, ale pocita len verejne marketingove stranky
 * (isTrackedSitePath), nikdy profily tvorcov, dashboard ani admin.
 *
 * Nespomaluje stranku: posiela sa az po hydratacii cez sendBeacon, nic
 * neblokuje a odpoved sa necita. Na landingu navyse jeden IntersectionObserver
 * zaznamena, ze navstevnik doscrolloval na cennik.
 */
function send(data: Record<string, unknown>) {
  const body = JSON.stringify(data);
  try {
    // text/plain → ziadny CORS preflight; server parsuje JSON rucne.
    if (navigator.sendBeacon?.("/api/sv", body)) return;
  } catch {
    /* fallback nizsie */
  }
  fetch("/api/sv", { method: "POST", body, keepalive: true }).catch(() => {});
}

function trackingAllowed() {
  if (process.env.NODE_ENV !== "production") return false;
  // Klientske vlastne domeny maju na „/" profil tvorcu, nie nas landing.
  if (window.location.hostname !== SITE_DOMAIN) return false;
  if (navigator.webdriver) return false;
  try {
    if (window.localStorage.getItem(NO_TRACK_KEY)) return false;
  } catch {
    /* privatny rezim bez storage — meriame normalne */
  }
  return true;
}

export function SiteTracker() {
  const pathname = usePathname();
  // Referrer a UTM patria len k prvej stranke nacitaneho dokumentu —
  // pri klientskej navigacii (Link) sa document.referrer nemeni.
  const firstLoad = useRef(true);

  useEffect(() => {
    const entry = firstLoad.current;
    firstLoad.current = false;

    if (!isTrackedSitePath(pathname) || !trackingAllowed()) return;

    const qs = entry ? new URLSearchParams(window.location.search) : null;
    send({
      p: pathname,
      e: entry,
      r: entry ? document.referrer || null : null,
      // ?s= a ?ref= su nase kratke kanaly (napr. linky v bio), UTM ma prednost
      us: qs ? qs.get("utm_source") || qs.get("s") || qs.get("ref") : null,
      um: qs?.get("utm_medium") ?? null,
      uc: qs?.get("utm_campaign") ?? null,
    });

    if (pathname !== "/") return;

    // Landing: videl navstevnik cennik? (jeden zaznam na nacitanie stranky)
    const pricing = document.getElementById("pricing");
    if (!pricing || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect();
          send({ p: PRICING_SECTION_PATH, k: "section" });
        }
      },
      // Sekcia je vysoka — staci, ked jej vrch prejde do hornych 60 % okna.
      { rootMargin: "0px 0px -40% 0px" },
    );
    io.observe(pricing);
    return () => io.disconnect();
  }, [pathname]);

  return null;
}

/** Vlozene v /admin: toto zariadenie sa uz nikdy nezapocita (ani odhlasene). */
export function NoTrackMarker() {
  useEffect(() => {
    try {
      window.localStorage.setItem(NO_TRACK_KEY, "1");
    } catch {
      /* bez storage nic */
    }
  }, []);
  return null;
}
