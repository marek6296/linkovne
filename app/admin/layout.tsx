import "./admin.css";
import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/auth/actions";
import { Logo } from "@/components/logo";

import { AdminNav } from "@/components/admin/nav";
import { AdminBell } from "@/components/dashboard/admin-bell";
import { NoTrackMarker } from "@/components/site-tracker";

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
    <div className="admin-workspace">
      <NoTrackMarker />
      <aside className="admin-sidebar">
        <Link href="/admin" className="admin-brand" aria-label="Linkovne administration"><Logo className="h-7 w-auto" /></Link>
        <span className="admin-workspace-label">Administration</span>
        <AdminNav />
        <Link href="/dashboard" className="admin-back">← Back to editor</Link>
      </aside>
      <div className="admin-body">
        <header className="admin-topbar">
          <span>Workspace <span className="admin-access">Admin access</span></span>
          <div className="flex items-center gap-3">
            <AdminBell />
            <form action={signOut}><button type="submit" className="btn-quiet">Log out</button></form>
          </div>
        </header>
        <main id="admin-content" className="admin-content"><Suspense fallback={<div className="admin-loading" role="status">Loading workspace…</div>}>{children}</Suspense></main>
      </div>
    </div>
  );
}
