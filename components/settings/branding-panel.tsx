"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { setHideBranding } from "@/app/dashboard/actions";

/**
 * Toggle „Hide Powered by Linkovne". Zapnute len pre platene plany (canHide);
 * free vidi zamknuty stav s upsellom.
 */
export function BrandingPanel({
  profileId,
  hidden,
  canHide,
}: {
  profileId: string;
  hidden: boolean;
  canHide: boolean;
}) {
  const [on, setOn] = useState(hidden); // on = watermark SKRYTY
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  function toggle() {
    if (!canHide || pending) return;
    const next = !on;
    setOn(next);
    setErr(null);
    start(async () => {
      const res = await setHideBranding(profileId, next);
      if (res?.error) {
        setOn(!next);
        setErr(res.error);
      }
    });
  }

  return (
    <div className="card max-w-md p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium">Hide “Powered by linkovne”</p>
          <p className="mt-1 text-xs text-soft">
            {canHide
              ? "Remove the badge at the bottom of your page and the promo button."
              : "Available on paid plans — free pages always show the badge."}
          </p>
        </div>

        {canHide ? (
          <button
            type="button"
            role="switch"
            aria-checked={on}
            onClick={toggle}
            disabled={pending}
            className={`relative h-6 w-11 shrink-0 rounded-full transition ${
              on ? "bg-ink" : "bg-line"
            } disabled:opacity-60`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                on ? "left-[22px]" : "left-0.5"
              }`}
            />
          </button>
        ) : (
          <Link
            href="/#pricing"
            className="btn-ink shrink-0 px-4 py-2 text-sm"
          >
            Upgrade
          </Link>
        )}
      </div>
      {err && <p className="alert-error mt-3">{err}</p>}
    </div>
  );
}
