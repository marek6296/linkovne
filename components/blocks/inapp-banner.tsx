"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { Theme } from "@/lib/themes";

/**
 * Vnutorny prehliadac Instagramu/TikToku neprenasa prihlasenia a lame cast
 * platobnych tokov — navstevnik, ktory by zaplatil, casto odide. Detekcia je
 * na klientovi, aby stranka ostala staticka (ISR).
 *
 *  - `auto = false` (default): jemny inline banner s tlacidlom.
 *  - `auto = true`  (Pro+ funkcia zapnuta): TVRDY full-screen gate — pokusi sa
 *    hned vyskocit von a zaroven prekryje CELU stranku nepriehladne, takze pod
 *    tym sa NIC neda kliknut, kym navstevnik neotvori realny prehliadac.
 *
 * Gate sa renderuje cez portal do <body>, aby ho neovplyvnil ziadny stacking
 * kontext stranky (transform v `.reveal`, z-index vrstvy) — inak sa obsah
 * vykreslil NAD prekryv a dal sa klikat.
 *
 * Pozn.: na iOS sa Safari z webview nedaju otvorit 100 % programovo (Apple to
 * neumoznuje), preto je gate zaroven blokujuci + navod „tap ⋯ → Open in Safari".
 * Na Androide je `intent://` spolahlivy.
 */
export function InAppBanner({
  theme,
  auto = false,
}: {
  theme: Theme;
  auto?: boolean;
}) {
  const [escapeUrl, setEscapeUrl] = useState<string | null>(null);
  const [ios, setIos] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const ua = navigator.userAgent;
    const inApp =
      /instagram|fban|fbav|fb_iab|musical_ly|bytedance|tiktok|snapchat|linkedinapp/i.test(
        ua,
      );
    if (!inApp) return;

    const here = window.location.href;
    const isiOS = /iphone|ipad|ipod/i.test(ua);
    setIos(isiOS);

    let url: string | null = null;
    if (isiOS) {
      url = `x-safari-${here}`;
    } else if (/android/i.test(ua)) {
      const u = new URL(here);
      url = `intent://${u.host}${u.pathname}${u.search}#Intent;scheme=${u.protocol.replace(
        ":",
        "",
      )};action=android.intent.action.VIEW;S.browser_fallback_url=${encodeURIComponent(
        here,
      )};end`;
    }
    if (!url) return;
    setEscapeUrl(url);

    // Auto-escape (len ked je funkcia zapnuta). Skusime hned; ak system trik
    // nepodpori, gate ostane a blokuje stranku + ponuka tlacidlo a navod.
    if (auto) {
      window.location.href = url;
    }
  }, [auto]);

  if (!escapeUrl) return null;

  // Jemny inline banner — ked funkcia nie je zapnuta.
  if (!auto) {
    return (
      <a
        href={escapeUrl}
        className="mb-6 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium transition hover:opacity-80"
        style={{
          background: theme.btnBg,
          border: theme.btnBorder,
          borderRadius: theme.btnRadius,
          color: theme.btnText,
        }}
      >
        Open in your browser
        <span aria-hidden>↗</span>
      </a>
    );
  }

  // Zapnute: tvrdy full-screen gate. Cely prekryv je odkaz — tap kdekolvek skusi
  // otvorit realny prehliadac. Neutralne brand farby, aby bol vzdy citatelny.
  const gate = (
    <a
      href={escapeUrl}
      role="dialog"
      aria-label="Open in your browser"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2147483647,
        display: "grid",
        placeItems: "center",
        padding: "1.5rem",
        background: "#faf9f6",
        color: "#191813",
        textAlign: "center",
        textDecoration: "none",
        overscrollBehavior: "contain",
      }}
    >
      <div style={{ maxWidth: "22rem" }}>
        <p style={{ fontSize: "0.95rem", opacity: 0.7, margin: "0 0 1rem" }}>
          This page opens in your browser.
        </p>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.95rem 1.6rem",
            borderRadius: "999px",
            background: "#191813",
            color: "#faf9f6",
            fontWeight: 600,
            fontSize: "1rem",
          }}
        >
          Open in browser <span aria-hidden>↗</span>
        </span>
        <p
          style={{
            marginTop: "1.4rem",
            fontSize: "0.82rem",
            lineHeight: 1.5,
            opacity: 0.65,
          }}
        >
          {ios
            ? "If nothing happens, tap ⋯ at the top-right and choose “Open in external browser”."
            : "If nothing happens, tap ⋮ at the top-right and choose “Open in browser”."}
        </p>
      </div>
    </a>
  );

  // Portal do <body> — mimo stacking kontextov stranky, aby gate prekryl VSETKO.
  return mounted ? createPortal(gate, document.body) : null;
}
