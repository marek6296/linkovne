"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/**
 * Horny promo bar so ZIVYM odpoctom — „marketing pressure". Odpocet ide k
 * ends_at; ked vyprsi, bar sa skryje (return null). Cislo pocita klient.
 */
export function PromoBar({
  headline,
  endsAt,
}: {
  headline: string;
  endsAt: string | null;
}) {
  const [left, setLeft] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (!endsAt) return;
    const target = new Date(endsAt).getTime();
    const tick = () => {
      const ms = target - Date.now();
      if (ms <= 0) {
        setExpired(true);
        setLeft(null);
        return;
      }
      const d = Math.floor(ms / 864e5);
      const h = Math.floor((ms % 864e5) / 36e5);
      const m = Math.floor((ms % 36e5) / 6e4);
      const s = Math.floor((ms % 6e4) / 1000);
      const pad = (n: number) => String(n).padStart(2, "0");
      setLeft(`${d > 0 ? d + "d " : ""}${pad(h)}:${pad(m)}:${pad(s)}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  if (expired) return null;

  return (
    <Link
      href="/register"
      className="block bg-neutral-900 py-2.5 text-center font-mono text-xs tracking-wide text-white uppercase transition hover:bg-neutral-800"
    >
      {headline}
      {endsAt && left && (
        <span className="ml-2 text-pink-400">· ends in {left}</span>
      )}
      &nbsp;→
    </Link>
  );
}
