"use client";

import { useEffect, useState } from "react";
import type { Theme } from "@/lib/themes";

const KEY = "linkovne_age_ok";

export function AgeGate({
  username,
  theme,
}: {
  username: string;
  theme: Theme;
}) {
  // null = este nevieme (SSR), true = potvrdene, false = pytame sa
  const [confirmed, setConfirmed] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      setConfirmed(localStorage.getItem(`${KEY}:${username}`) === "1");
    } catch {
      setConfirmed(false);
    }
  }, [username]);

  if (confirmed !== false) return null;

  function accept() {
    try {
      localStorage.setItem(`${KEY}:${username}`, "1");
    } catch {
      // Súkromný režim — potvrdenie proste nepretrvá
    }
    setConfirmed(true);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Age confirmation"
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
      style={{ background: theme.page, color: theme.text }}
    >
      <div className="w-full max-w-sm text-center">
        <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: theme.muted }}>
          18+
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">
          This page is for adults
        </h1>
        <p className="mt-2 text-sm" style={{ color: theme.muted }}>
          Please confirm you are 18 or older to continue.
        </p>

        <div className="mt-8 space-y-3">
          <button
            onClick={accept}
            className="w-full px-6 py-3.5 font-medium transition hover:-translate-y-0.5"
            style={{
              background: theme.text,
              color: theme.page.includes("gradient") || theme.page.includes("url(")
                ? "#fff"
                : theme.page,
              borderRadius: theme.btnRadius,
            }}
          >
            I am 18 or older
          </button>
          <a
            href="https://www.google.com"
            className="block w-full px-6 py-3.5 font-medium transition"
            style={{
              border: theme.btnBorder,
              borderRadius: theme.btnRadius,
              color: theme.text,
            }}
          >
            Take me away
          </a>
        </div>
      </div>
    </div>
  );
}
