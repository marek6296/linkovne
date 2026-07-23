import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/auth/actions";
import { Logo } from "@/components/logo";
import { PlanBadge } from "@/components/dashboard/plan-badge";
import { AdminNav } from "@/components/admin/nav";

/**
 * Zdielany obal admin panelu — guard + chrome sa nacitaju RAZ, podstranky
 * (Overview / Clients / Growth / Platform) riesia len svoj obsah. Vizualne
 * kopiruje dashboard chrome, nech admin posobi ako sucast produktu.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (isAdmin !== true) redirect("/dashboard");

  return (
    <div className="min-h-dvh">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          {/* Horny riadok: logo + akcie. Na desktope je medzi nimi navigacia. */}
          <div className="flex items-center justify-between gap-3 py-2.5">
            <div className="flex shrink-0 items-center gap-2.5">
              <Link href="/admin" className="flex items-center">
                <Logo className="h-6 w-auto" />
              </Link>
              <PlanBadge planKey="admin" />
            </div>

            {/* Navigacia — centrovana na desktope; na mobile ma vlastny riadok nizsie. */}
            <div className="hidden min-w-0 flex-1 md:block">
              <AdminNav />
            </div>

            <div className="flex shrink-0 items-center gap-1">
              <Link href="/dashboard" className="btn-quiet">
                ← App
              </Link>
              <form action={signOut}>
                <button type="submit" className="btn-quiet">
                  Log out
                </button>
              </form>
            </div>
          </div>

          {/* Mobilna navigacia — samostatny riadok cez celu sirku, scrollovatelny. */}
          <div className="border-t border-line py-2 md:hidden">
            <AdminNav />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <Suspense>{children}</Suspense>
      </main>
    </div>
  );
}
