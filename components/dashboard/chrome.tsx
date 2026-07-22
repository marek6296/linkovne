import Link from "next/link";
import { Suspense } from "react";
import { signOut } from "@/app/auth/actions";
import { Logo } from "@/components/logo";
import { DashboardNav } from "@/components/dashboard/nav";
import { PlanBadge } from "@/components/dashboard/plan-badge";

/**
 * Perzistentny obal dashboardu. Zije v app/dashboard/layout.tsx, takze header
 * a menu sa nacitaju RAZ a pri preklikavani medzi podstrankami sa nemenia —
 * meni sa len obsah (children). To je dovod, preco je navigacia svizna.
 */
export function DashboardChrome({
  planKey,
  isAdmin,
  children,
}: {
  /** Surova uroven ("free" | "pro" | "business" | "admin") — urcuje badge + upgrade CTA. */
  planKey: string;
  isAdmin: boolean;
  children: React.ReactNode;
}) {
  // Viditelny upgrade CTA v headeri: free → Pro (indigo), pro → Business (pink).
  // Business/admin uz nemaju kam ist vyssie.
  const upgrade =
    planKey === "free"
      ? {
          label: "Upgrade to Pro",
          color: "bg-indigo-500 hover:bg-indigo-600",
        }
      : planKey === "pro"
        ? {
            label: "Upgrade to Business",
            color: "bg-pink-500 hover:bg-pink-600",
          }
        : null;

  const UpgradeIcon = (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
      <path d="M13 2 4 14h7l-1 8 9-12h-7z" />
    </svg>
  );

  return (
    <div className="min-h-dvh">
      <header className="border-b border-line bg-surface">
        {/* ── Horny riadok: logo+badge vlavo, ucet vpravo. Na desktope je medzi
            nimi este vycentrovane menu; na mobile ide menu do vlastneho riadka
            nizsie, nech sa nic netlaci. ── */}
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5 sm:gap-4 sm:px-6">
          <div className="flex shrink-0 items-center gap-2.5">
            <Link href="/dashboard" className="flex items-center">
              <Logo className="h-6 w-auto" />
            </Link>
            <PlanBadge planKey={isAdmin ? "admin" : planKey} />
          </div>

          {/* Menu — len desktop (v strede). Mobile ma vlastny riadok nizsie. */}
          <div className="hidden min-w-0 flex-1 justify-center sm:flex">
            <Suspense fallback={<div />}>
              <DashboardNav />
            </Suspense>
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-1.5">
            {/* Upgrade CTA — na desktope tu, na mobile ako pruh cez celu sirku nizsie. */}
            {upgrade && (
              <Link
                href="/dashboard/settings"
                className={`hidden items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-white shadow-sm transition sm:inline-flex ${upgrade.color}`}
              >
                {UpgradeIcon}
                {upgrade.label}
              </Link>
            )}
            {isAdmin && (
              <Link href="/admin" className="btn-quiet px-2.5 sm:px-4">
                Admin
              </Link>
            )}
            <form action={signOut}>
              <button type="submit" className="btn-quiet px-2.5 sm:px-4">
                Log out
              </button>
            </form>
          </div>
        </div>

        {/* ── Mobilny riadok s menu — cez celu sirku, plynule scrollovatelny. ── */}
        <div className="border-t border-line px-2 py-1.5 sm:hidden">
          <Suspense fallback={<div />}>
            <DashboardNav />
          </Suspense>
        </div>
      </header>

      {/* Mobilne upgrade CTA — prominentne cez celu sirku pod headerom. */}
      {upgrade && (
        <div className="border-b border-line bg-surface px-4 py-2.5 sm:hidden">
          <Link
            href="/dashboard/settings"
            className={`flex w-full items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition ${upgrade.color}`}
          >
            {UpgradeIcon}
            {upgrade.label}
          </Link>
        </div>
      )}

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
