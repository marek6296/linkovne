import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * In-app admin bell. GET vracia posledné notable udalosti + počet neprečítaných;
 * POST označí všetko po „teraz" ako prečítané. Autorizáciu rieši samotná RPC
 * (is_admin), tu len overíme prihlásenie.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ unread: 0, items: [] }, { status: 401 });

  const [{ data: items, error }, { data: unread }] = await Promise.all([
    supabase.rpc("admin_notifications", { p_limit: 20 }),
    supabase.rpc("admin_unread_count"),
  ]);

  // Nie je admin (RPC vyhodí) → prázdno, nie chyba.
  if (error) return NextResponse.json({ unread: 0, items: [] });

  return NextResponse.json({
    unread: typeof unread === "number" ? unread : 0,
    items: items ?? [],
  });
}

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const { error } = await supabase.rpc("admin_mark_notifications_seen");
  return NextResponse.json({ ok: !error });
}
