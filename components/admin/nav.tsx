"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Sekcie admin panelu. Klientske — aktivnu polozku si urci samo z URL,
 * takze zije v zdielanom layoute a pri preklikavani sa nerenderuje nanovo.
 * Rovnaky vzor ako DashboardNav, nech admin posobi ako sucast produktu.
 */
const ITEMS = [
  { key: "overview", label: "Overview", href: "/admin" },
  { key: "website", label: "Website", href: "/admin/website" },
  { key: "clients", label: "Clients", href: "/admin/clients" },
  { key: "growth", label: "Growth", href: "/admin/growth" },
  { key: "discounts", label: "Discounts", href: "/admin/discounts" },
  { key: "log", label: "Activity", href: "/admin/log" },
  { key: "team", label: "Team", href: "/admin/team" },
  { key: "platform", label: "Platform", href: "/admin/platform" },
] as const;

const ICONS = [
  "M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z",
  "M3 5h18v14H3z M3 9h18 M7 7h.01 M10 7h.01",
  "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M17 4a4 4 0 0 1 0 8 M22 21v-2a4 4 0 0 0-3-4",
  "M3 17l6-6 4 4 8-10 M15 5h6v6",
  "M3 3h8l10 10-8 8L3 11z M7 7h.01",
  "M3 12h4l3-8 4 16 3-8h4",
  "M12 3l9 4v5c0 5-9 9-9 9s-9-4-9-9V7z M8 12l3 3 5-6",
  "M3 4h18v6H3z M3 14h18v6H3z M7 7h.01 M7 17h.01",
];

export function AdminNav() {
  const pathname = usePathname();

  // Aktivna sekcia = prva polozka (okrem Overview), ktorej href je prefix URL.
  const active =
    ITEMS.find((i) => i.key !== "overview" && pathname.startsWith(i.href))
      ?.key ?? "overview";

  return (
    <nav className="admin-nav" aria-label="Administration">
      {ITEMS.map((i) => (
        <Link
          key={i.key}
          href={i.href}
          prefetch
          aria-current={i.key === active ? "page" : undefined}
          className={`admin-nav-link ${i.key === active ? "is-active" : ""}`}
        >
          <svg className="admin-nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={ICONS[ITEMS.indexOf(i)]} /></svg>{i.label}
        </Link>
      ))}
    </nav>
  );
}
