import Link from "next/link";
import { signOut } from "@/app/auth/actions";
import { Logo } from "@/components/logo";
import type { PlanFeatures } from "@/lib/plans";

export type NavKey =
  | "editor"
  | "analytics"
  | "inbox"
  | "pages"
  | "invite"
  | "settings";

type NavItem = { key: NavKey; label: string; href: string; show: boolean };

/**
 * Jednotny obal pre CELY dashboard. Vsetky podstranky (editor, analytika,
 * inbox, nastavenia…) maju rovnaku hlavicku, rovnaku sirku obsahu a rovnake
 * menu — takze preklikavanie nemeni layout. To bola hlavna vytka.
 */
export function DashboardShell({
  plan,
  isAdmin,
  active,
  profileId,
  children,
  wide = false,
}: {
  plan: PlanFeatures;
  isAdmin: boolean;
  active: NavKey;
  /** Pre linky, ktore drzia vybrany profil v URL */
  profileId?: string;
  children: React.ReactNode;
  /** Editor potrebuje sirsi obsah kvoli nahladu */
  wide?: boolean;
}) {
  const p = profileId ? `?p=${profileId}` : "";

  const items: NavItem[] = [
    { key: "editor", label: "Editor", href: `/dashboard${p}`, show: true },
    {
      key: "analytics",
      label: "Analytics",
      href: `/dashboard/analytics${p}`,
      show: true,
    },
    {
      key: "invite",
      label: "Invite & earn",
      href: `/dashboard/invite`,
      show: true,
    },
    {
      key: "settings",
      label: "Settings",
      href: `/dashboard/settings${p}`,
      show: true,
    },
  ];

  // Vsetky podstranky maju rovnaku sirku ako editor — preklikavanie nesmie
  // menit layout. `wide` uz nerozlisuje sirku obalu (ostava kvoli API), len
  // hint pre obsah editora (nahlad vedla).
  void wide;
  const width = "max-w-6xl";

  return (
    <div className="min-h-dvh">
      {/* Jednoriadkovy header: logo+badge vlavo, menu v strede, ucet vpravo —
          vsetko na jednej urovni, nizsi a cistejsi. */}
      <header className="border-b border-line bg-surface">
        <div className={`mx-auto flex ${width} items-center gap-4 px-6 py-2.5`}>
          <div className="flex shrink-0 items-center gap-2.5">
            <Link href="/dashboard" className="flex items-center">
              <Logo className="h-6 w-auto" />
            </Link>
            <span className="rounded-full border border-line px-2.5 py-0.5 text-xs font-medium text-soft">
              {plan.label}
            </span>
          </div>

          {/* Menu — vycentrovane medzi logom a uctom */}
          <nav className="flex min-w-0 flex-1 items-center justify-center gap-1 overflow-x-auto">
            {items
              .filter((i) => i.show)
              .map((i) => (
                <Link
                  key={i.key}
                  href={i.href}
                  className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                    i.key === active
                      ? "bg-ink text-white"
                      : "text-soft hover:bg-black/[0.04] hover:text-ink"
                  }`}
                >
                  {i.label}
                </Link>
              ))}
          </nav>

          <div className="flex shrink-0 items-center gap-1">
            {isAdmin && (
              <Link href="/admin" className="btn-quiet">
                Admin
              </Link>
            )}
            <form action={signOut}>
              <button type="submit" className="btn-quiet">
                Log out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className={`mx-auto ${width} px-6 py-8`}>{children}</main>
    </div>
  );
}
