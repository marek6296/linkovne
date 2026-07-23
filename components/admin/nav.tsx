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
  { key: "clients", label: "Clients", href: "/admin/clients" },
  { key: "growth", label: "Growth", href: "/admin/growth" },
  { key: "discounts", label: "Discounts", href: "/admin/discounts" },
  { key: "platform", label: "Platform", href: "/admin/platform" },
] as const;

export function AdminNav() {
  const pathname = usePathname();

  const active = pathname.startsWith("/admin/clients")
    ? "clients"
    : pathname.startsWith("/admin/growth")
      ? "growth"
      : pathname.startsWith("/admin/discounts")
        ? "discounts"
        : pathname.startsWith("/admin/platform")
          ? "platform"
          : "overview";

  return (
    <nav className="flex items-center gap-1 overflow-x-auto md:justify-center [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {ITEMS.map((i) => (
        <Link
          key={i.key}
          href={i.href}
          prefetch
          className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition ${
            i.key === active
              ? "bg-ink text-white"
              : "text-soft hover:bg-black/[0.04] hover:text-ink"
          }`}
        >
          {i.label}
        </Link>
      ))}
    </nav>
  );
}
