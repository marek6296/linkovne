/**
 * Plan badge vedla loga v dashboarde — vizualne odlisi uroven uctu:
 *  • Free     → cisty cierno-biely obrys,
 *  • Pro      → indigo pilulka s bleskom (rovnaka farba ako Pro v pricingu),
 *  • Business → ruzova pilulka s korunkou,
 *  • Admin    → cierna pilulka s gradientovym obrysom a diamantom (operator).
 * Server-only markup, ziadny state.
 */
export function PlanBadge({ planKey }: { planKey: string }) {
  if (planKey === "admin") {
    return (
      <span className="inline-flex rounded-full bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-pink-500 p-[1.5px] shadow-[0_2px_12px_rgba(168,85,247,0.5)]">
        <span className="inline-flex items-center gap-1 rounded-full bg-neutral-900 px-2.5 py-0.5 text-xs font-bold tracking-wide text-white">
          <svg viewBox="0 0 24 24" className="h-3 w-3" aria-hidden>
            <defs>
              <linearGradient
                id="pb-admin-gem"
                x1="2"
                y1="3"
                x2="22"
                y2="21"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#818cf8" />
                <stop offset="0.5" stopColor="#e879f9" />
                <stop offset="1" stopColor="#f472b6" />
              </linearGradient>
            </defs>
            <path d="M6 3h12l3 5-9 13L3 8z" fill="url(#pb-admin-gem)" />
          </svg>
          Admin
        </span>
      </span>
    );
  }

  if (planKey === "pro") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500 px-2.5 py-0.5 text-xs font-bold tracking-wide text-white shadow-[0_2px_8px_rgba(99,102,241,0.45)] ring-1 ring-white/25 ring-inset">
        <svg
          viewBox="0 0 24 24"
          className="h-3 w-3"
          fill="currentColor"
          aria-hidden
        >
          <path d="M13 2 4 14h7l-1 8 9-12h-7z" />
        </svg>
        Pro
      </span>
    );
  }

  if (planKey === "business") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-pink-500 px-2.5 py-0.5 text-xs font-bold tracking-wide text-white shadow-[0_2px_8px_rgba(236,72,153,0.45)] ring-1 ring-white/25 ring-inset">
        <svg
          viewBox="0 0 24 24"
          className="h-3 w-3"
          fill="currentColor"
          aria-hidden
        >
          <path d="M4 18h16l1-9-5 3-4-6-4 6-5-3 1 9z" />
        </svg>
        Business
      </span>
    );
  }

  // Free — cierno-biely obrys
  return (
    <span className="inline-flex items-center rounded-full border-[1.5px] border-neutral-900 bg-white px-2.5 py-0.5 text-xs font-bold tracking-wide text-neutral-900">
      Free
    </span>
  );
}
