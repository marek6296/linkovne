import { NextResponse, type NextRequest } from "next/server";
import { createPublicClient } from "@/lib/supabase/public";
import { normaliseSource } from "@/lib/channels";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Pocitanie navstev bez cookies a bez externeho vendora.
 * Verejne stranky su ISR-cachovane, takze view sa hlasi z prehliadaca.
 */
export async function POST(request: NextRequest) {
  let body: { profileId?: string; referrer?: string; source?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const profileId = body.profileId ?? "";
  if (!UUID_RE.test(profileId)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const ua = request.headers.get("user-agent") ?? "";
  const device = /mobile|android|iphone|ipad/i.test(ua) ? "mobile" : "desktop";

  // Ukladame len hostname referrera — nie plnu URL s parametrami.
  let referrer: string | null = null;
  if (body.referrer) {
    try {
      referrer = new URL(body.referrer).hostname.replace(/^www\./, "");
    } catch {
      referrer = null;
    }
  }

  const source = normaliseSource(
    typeof body.source === "string" ? body.source : null,
  );

  // Krajina z Vercel edge (ISO-2). Mesto zamerne neukladame — staci krajina.
  const rawCountry = request.headers.get("x-vercel-ip-country") ?? "";
  const country = /^[A-Z]{2}$/.test(rawCountry) ? rawCountry : null;

  const supabase = createPublicClient();
  // RLS pusti insert len pre zverejnene profily.
  await supabase
    .from("page_views")
    .insert({ profile_id: profileId, referrer, device, source, country });

  return NextResponse.json({ ok: true });
}
