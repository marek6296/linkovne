import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isCronAuthorized } from "@/lib/cron-auth";
import { isPublicHttpUrl } from "@/lib/net-guard";

export const maxDuration = 60;

async function probe(url: string) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": "LinkovneLinkCheck/1.0 (+https://linkovne.com)" },
    });
    return { ok: res.status < 400, status_code: res.status, error: null };
  } catch (e) {
    return {
      ok: false,
      status_code: null,
      error: e instanceof Error ? e.name : "failed",
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function GET(request: NextRequest) {
  // Vercel Cron posiela tuto hlavicku; bez nej endpoint nikto nespusti
  if (!isCronAuthorized(request.headers.get("authorization"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return NextResponse.json(
      { error: "Link checking is not configured." },
      { status: 503 },
    );
  }

  // Service role — cron nema session a musi vidiet naprie vsetkymi profilmi
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    { db: { schema: "linkove" }, auth: { persistSession: false } },
  );

  const { data: blocks } = await supabase
    .from("blocks")
    .select("id, config")
    .eq("type", "link")
    .eq("is_active", true)
    .limit(300);

  let checked = 0;
  let broken = 0;

  for (const b of blocks ?? []) {
    const url = (b.config as { url?: string })?.url ?? "";
    if (!isPublicHttpUrl(url)) continue;

    const result = await probe(url);
    checked++;
    if (!result.ok) broken++;

    await supabase.from("link_health").upsert({
      block_id: b.id,
      ok: result.ok,
      status_code: result.status_code,
      error: result.error,
      checked_at: new Date().toISOString(),
    });
  }

  return NextResponse.json({ checked, broken });
}
