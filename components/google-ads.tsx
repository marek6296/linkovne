"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { ADS_CONSENT_KEY, ADS_CONSENT_EVENT, ADS_CONVERSION_EVENT, adsPageAllowed,
  adsPageLocation, hasAdsConsent, pendingConversion, acknowledgeConversion } from "@/lib/google-ads";

function clearAdsCookies() {
  for (const cookie of document.cookie.split(";")) {
    const name = cookie.trim().split("=")[0];
    if (!name.startsWith("_gcl_")) continue;
    for (const domain of ["", "; domain=linkovne.com", "; domain=.linkovne.com"]) {
      document.cookie = `${name}=; Max-Age=0; path=/${domain}; SameSite=Lax; Secure`;
    }
  }
}

/** The Google runtime lives in a removable document, never in the root SPA. */
export function GoogleAdsMeasurement() {
  const pathname = usePathname();
  const frame = useRef<HTMLIFrameElement>(null);
  const ready = useRef(false);
  const [available, setAvailable] = useState(false);
  const [granted, setGranted] = useState(false);
  const [frameState, setFrameState] = useState("waiting");
  const [open, setOpen] = useState(false);
  const allowedPath = adsPageAllowed("linkovne.com", pathname);

  useEffect(() => {
    const allowed = process.env.NEXT_PUBLIC_VERCEL_ENV !== "preview" && process.env.NODE_ENV === "production" && adsPageAllowed(location.hostname, pathname);
    setAvailable(allowed);
    ready.current = false;
    setFrameState("waiting");
    if (!allowed) return;
    function sync() {
      try {
        const raw = localStorage.getItem(ADS_CONSENT_KEY);
        const parsed = JSON.parse(raw || "null");
        const consent = hasAdsConsent(raw);
        setGranted(consent);
        setOpen(!(parsed?.version === 1 && ["granted", "denied"].includes(parsed.choice)));
        if (!consent) {
          ready.current = false;
          clearAdsCookies();
          sessionStorage.removeItem("linkovne:ads-pending");
        }
      } catch { setGranted(false); setOpen(true); }
    }
    function flush() {
      try {
        if (!ready.current || !hasAdsConsent(localStorage.getItem(ADS_CONSENT_KEY))) return;
        const id = pendingConversion(sessionStorage);
        if (id) frame.current?.contentWindow?.postMessage({ type: "linkovne:ads-convert", id }, location.origin);
      } catch { /* Measurement never blocks the product. */ }
    }
    function onMessage(event: MessageEvent) {
      if (event.origin !== location.origin || event.source !== frame.current?.contentWindow) return;
      if (event.data?.type === "linkovne:ads-ready") { ready.current = true; setFrameState("ready"); flush(); }
      if (event.data?.type === "linkovne:ads-sent") {
        try {
          const id = pendingConversion(sessionStorage);
          if (id && event.data.id === id) acknowledgeConversion(sessionStorage, id);
        } catch { /* No storage */ }
      }
    }
    const onStorage = (event: StorageEvent) => { if (event.key === ADS_CONSENT_KEY) sync(); };
    sync();
    window.addEventListener(ADS_CONSENT_EVENT, sync);
    window.addEventListener(ADS_CONVERSION_EVENT, flush);
    window.addEventListener("storage", onStorage);
    window.addEventListener("message", onMessage);
    return () => {
      ready.current = false;
      window.removeEventListener(ADS_CONSENT_EVENT, sync);
      window.removeEventListener(ADS_CONVERSION_EVENT, flush);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("message", onMessage);
    };
  }, [pathname]);

  function choose(consent: boolean) {
    try { localStorage.setItem(ADS_CONSENT_KEY, JSON.stringify({ version: 1, choice: consent ? "granted" : "denied" })); } catch { /* Fail closed */ }
    window.dispatchEvent(new Event(ADS_CONSENT_EVENT));
    setOpen(false);
  }
  if (!available || !allowedPath) return null;
  return <>
    {granted && <iframe key={pathname} ref={frame} title="Optional advertising measurement" data-measurement-state={frameState} src={`/api/ads-frame${new URL(adsPageLocation(location.href)).search}`} referrerPolicy="no-referrer" hidden onLoad={() => {
      ready.current = false;
      setFrameState("loaded");
      frame.current?.contentWindow?.postMessage({ type: "linkovne:ads-start", location: adsPageLocation(location.href) }, location.origin);
    }} />}
    {!open && <button type="button" onClick={() => setOpen(true)} className="fixed bottom-3 left-3 z-40 rounded-full border border-neutral-300 bg-white px-3 py-2 text-xs text-neutral-700 shadow-sm">Privacy choices</button>}
    {open && <section aria-label="Optional advertising measurement" className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-xl rounded-2xl border border-neutral-200 bg-white p-5 text-neutral-900 shadow-xl">
      <h2 className="text-base font-semibold">Help us measure our ads?</h2>
      <p className="mt-2 text-sm leading-6">With your permission, Google Ads uses cookies to connect ad visits with completed account setup. Optional: your choice won’t affect your account. No advertising measurement runs on hosted creator pages. <Link href="/privacy" className="underline">Privacy policy</Link></p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button type="button" onClick={() => choose(false)} className="rounded-full border border-neutral-800 px-5 py-2 text-sm font-medium">Reject optional</button>
        <button type="button" onClick={() => choose(true)} className="rounded-full border border-neutral-800 px-5 py-2 text-sm font-medium">Allow measurement</button>
      </div>
    </section>}
  </>;
}
