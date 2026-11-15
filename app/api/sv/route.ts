import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { SITE_DOMAIN } from "@/lib/site";
import { clientIp } from "@/lib/rate-limit";
import {
  browserOf,
  cleanCampaign,
  deviceOf,
  isBotUserAgent,
  isInternalReferrer,
  isTrackedSitePath,
  normaliseSitePath,
  PRICING_SECTION_PATH,
  referrerHost,
} from "@/lib/site-analytics";

/**
 * Navstevnost marketingoveho webu linkovne.com (beacon z components/site-tracker).
 * Kratky neutralny nazov /api/sv — adblock zoznamy blokuju /track, /collect…
 *
 * Bez cookies: identita navstevnika je denny hash IP + UA so solou, ktory
 * pocita DB funkcia track_site_visit (IP sa nikde neuklada). Vsetko, co sa
 * nema pocitat, tu ticho zahodime a vratime 204 — beacon odpoved aj tak necita.
 */
const skip = () => new NextResponse(null, { status: 204 });

/** Supabase SSR session cookie (aj rozdelena na .0/.1) = prihlaseny. */
function isLoggedIn(request: NextRequest) {
  return request.cookies
    .getAll()
    .some((c) => c.name.startsWith("sb-") && c.name.includes("-auth-token"));
}

export async function POST(request: NextRequest) {
  // Len ostra produkcia na hlavnej domene. Preview deploye, lokalny vyvoj
  // a klientske vlastne domeny sa nepocitaju.
  if (process.env.VERCEL_ENV !== "production") return skip();
  const host = (request.headers.get("host") ?? "").split(":")[0].toLowerCase();
  if (host !== SITE_DOMAIN) return skip();
  const origin = request.headers.get("origin");
  if (origin && origin !== `https://${SITE_DOMAIN}`) return skip();

  const ua = request.headers.get("user-agent") ?? "";
  if (isBotUserAgent(ua)) return skip();

  // Prihlaseny = existujuci zakaznik alebo admin, nie potencialny klient.
  if (isLoggedIn(request)) return skip();

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return skip();

  // sendBeacon posiela text/plain — parsujeme rucne, s limitom velkosti.
  let body: Record<string, unknown>;
  try {
    const raw = await request.text();
    if (raw.length > 2048) return skip();
    body = JSON.parse(raw);
  } catch {
    return skip();
  }

  const isSection = body.k === "section";
  const rawPath = typeof body.p === "string" ? body.p : "";
  const path = isSection ? rawPath : normaliseSitePath(rawPath);
  if (isSection ? path !== PRICING_SECTION_PATH : !isTrackedSitePath(path)) {
    return skip();
  }

  const rawReferrer = typeof body.r === "string" ? body.r : null;
  // Prichod zvonku nesie zdroj; nova karta / reload z nasej stranky nie.
  const entry =
    body.e === true && !isSection && !isInternalReferrer(rawReferrer);
  const rawCountry = request.headers.get("x-vercel-ip-country") ?? "";

  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
    db: { schema: "linkove" },
    auth: { persistSession: false },
  });

  const { error } = await db.rpc("track_site_visit", {
    p_ip: clientIp(request.headers),
    p_ua: ua.slice(0, 512),
    p_path: path,
    p_kind: isSection ? "section" : "page",
    p_entry: entry,
    p_referrer: entry ? referrerHost(rawReferrer) : null,
    p_utm_source: entry ? cleanCampaign(body.us) : null,
    p_utm_medium: entry ? cleanCampaign(body.um) : null,
    p_utm_campaign: entry ? cleanCampaign(body.uc) : null,
    p_country: /^[A-Z]{2}$/.test(rawCountry) ? rawCountry : null,
    p_device: deviceOf(ua),
    p_browser: browserOf(ua),
  });
  if (error) console.error("[site-visit]", error.message);

  return skip();
}
