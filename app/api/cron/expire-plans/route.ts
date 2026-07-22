import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isCronAuthorized } from "@/lib/cron-auth";

/**
 * Vracia expirovane platene ucty (invite na mesiac/rok) spat na free.
 * Spusta Vercel Cron; chraneny CRON_SECRET (fail-closed).
 */
export async function GET(request: NextRequest) {
  if (!isCronAuthorized(request.headers.get("authorization"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return NextResponse.json({ error: "Not configured." }, { status: 503 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    { db: { schema: "linkove" }, auth: { persistSession: false } },
  );

  const { data, error } = await supabase.rpc("expire_plans");
  if (error) {
    console.error("[cron/expire-plans]", error.message);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }

  return NextResponse.json({ expired: data ?? 0 });
}
