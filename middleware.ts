import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SITE_DOMAIN } from "@/lib/site";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

const PROTECTED = ["/dashboard", "/onboarding", "/admin"];

/** Hostitelia, na ktorych bezi samotna aplikacia (nie klientske domeny). */
function isAppHost(host: string) {
  return (
    host.startsWith("localhost") ||
    host.endsWith(".vercel.app") ||
    host === SITE_DOMAIN ||
    host === `www.${SITE_DOMAIN}`
  );
}

/**
 * Klientska domena → jeho stranka. Prepis je transparentny: navstevnik vidi
 * vlastnu domenu, nie /username.
 */
async function rewriteCustomDomain(request: NextRequest) {
  const host = (request.headers.get("host") ?? "").split(":")[0].toLowerCase();
  if (!host || isAppHost(host)) return null;

  const path = request.nextUrl.pathname;
  // Klik a beacon musia fungovat aj na klientskej domene
  if (
    path.startsWith("/r/") ||
    path.startsWith("/api/") ||
    path.startsWith("/_next/")
  ) {
    return null;
  }
  if (path !== "/") return null;

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/profile_for_host`,
    {
      method: "POST",
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        "Content-Type": "application/json",
        "Content-Profile": "linkove",
      },
      body: JSON.stringify({ p_host: host }),
      // Middleware bezi pri kazdom requeste — cache setri DB
      next: { revalidate: 300 },
    },
  );
  if (!res.ok) return null;

  const username = await res.json();
  if (typeof username !== "string" || !username) return null;

  const url = request.nextUrl.clone();
  url.pathname = `/${username}`;
  return NextResponse.rewrite(url);
}

export async function middleware(request: NextRequest) {
  // www → hlavna domena (kanonicka URL)
  const host = (request.headers.get("host") ?? "").split(":")[0].toLowerCase();
  if (host === `www.${SITE_DOMAIN}`) {
    const url = request.nextUrl.clone();
    url.host = SITE_DOMAIN;
    return NextResponse.redirect(url, 308);
  }

  const custom = await rewriteCustomDomain(request);
  if (custom) return custom;

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Nutne volat getUser() — refreshne expirovany token a zapise nove cookies.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  if (!user && PROTECTED.some((p) => path.startsWith(p))) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  if (user && (path === "/login" || path === "/register")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  // /r/ vynechane — redirect endpoint nepotrebuje session a musi byt rychly
  matcher: ["/((?!_next/static|_next/image|favicon.ico|r/|.*\\.(?:svg|png|jpg|webp)$).*)"],
};
