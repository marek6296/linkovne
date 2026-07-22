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
        <div className="mx-auto grid max-w-6xl grid-cols-[1fr_auto_1fr] items-center gap-4 px-6 py-2.5">
          <div className="flex shrink-0 items-center gap-2.5">
            <Link href="/admin" className="flex items-center">
              <Logo className="h-6 w-auto" />
            </Link>
            <PlanBadge planKey="admin" />
          </div>

          <AdminNav />

          <div className="flex shrink-0 items-center justify-self-end gap-1">
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
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <Suspense>{children}</Suspense>
      </main>
    </div>
  );
}
