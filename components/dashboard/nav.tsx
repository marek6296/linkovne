"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Sekundarne menu dashboardu. Klientske — aktivnu polozku si urci samo z URL
 * (usePathname), takze zije v zdielanom layoute a pri preklikavani sa
 * NErenderuje nanovo zo servera. To robi navigaciu okamzitou.
 */
const ITEMS = [
  { key: "editor", label: "Editor", href: "/dashboard" },
  { key: "analytics", label: "Analytics", href: "/dashboard/analytics" },
  { key: "invite", label: "Invite & earn", href: "/dashboard/invite" },
  { key: "settings", label: "Settings", href: "/dashboard/settings" },
] as const;

export function DashboardNav() {
  const pathname = usePathname();
  const params = useSearchParams();
  const p = params.get("p");
  const q = p ? `?p=${p}` : "";

  const active = pathname.startsWith("/dashboard/analytics")
    ? "analytics"
    : pathname.startsWith("/dashboard/invite")
      ? "invite"
      : pathname.startsWith("/dashboard/settings")
        ? "settings"
        : "editor";

  return (
    <nav className="flex items-center justify-start gap-1 overflow-x-auto sm:justify-center [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {ITEMS.map((i) => {
        // „Invite" nedrzi vybrany profil v URL — nema ?p.
        const href = i.key === "invite" ? i.href : `${i.href}${q}`;
        return (
          <Link
            key={i.key}
            href={href}
            prefetch
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
              i.key === active
                ? "bg-ink text-white"
                : "text-soft hover:bg-black/[0.04] hover:text-ink"
            }`}
          >
            {i.label}
          </Link>
        );
      })}
    </nav>
  );
}
