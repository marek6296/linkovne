import { NextResponse, type NextRequest } from "next/server";
import { createPublicClient } from "@/lib/supabase/public";
import { normaliseSource } from "@/lib/channels";
import { detectInApp, escapeToBrowser, nativeDeepLink } from "@/lib/inapp";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Bezpecne vlozenie hodnoty do inline <script>. JSON.stringify neescapuje
 * `<`, takze URL obsahujuca `</script>` by rozbila HTML parser a spustila
 * vlastny skript (stored XSS). Escapujeme < > a U+2028/29 na \uXXXX — vysledok
 * je stale validny JS string literal.
 */
function jsonForScript(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

/**
 * Medzistranka pre navstevnikov z in-app prehliadaca. Skusi natívnu appku,
 * potom system prehliadac, a ked ani jedno nezaberie, ostane viditelne
 * tlacidlo. Ziadny obsah stranky sa tu neprezradi.
 */
function interstitial(
  target: string,
  deepLink: string | null,
  escape: string | null,
) {
  const t = escapeHtml(target);
  const attempts = [deepLink, escape].filter(Boolean) as string[];

  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<meta name="referrer" content="no-referrer">
<title>Opening…</title>
<style>
  :root { color-scheme: light dark }
  body { margin:0; min-height:100dvh; display:grid; place-items:center;
         font: 16px/1.5 ui-sans-serif, system-ui, sans-serif;
         background:#faf9f6; color:#191813; padding:2rem; text-align:center }
  @media (prefers-color-scheme: dark){ body{ background:#0e0e10; color:#f4f4f5 } }
  a.btn { display:inline-block; margin-top:1.25rem; padding:.85rem 1.5rem;
          border-radius:999px; background:#191813; color:#faf9f6;
          text-decoration:none; font-weight:500 }
  @media (prefers-color-scheme: dark){ a.btn{ background:#f4f4f5; color:#0e0e10 } }
  p { opacity:.7; font-size:.9rem }
</style>
</head><body>
<div>
  <p>Opening in your browser…</p>
  <a class="btn" id="go" href="${t}" rel="noopener noreferrer">Continue</a>
</div>
<script>
(function(){
  var attempts = ${jsonForScript(attempts)};
  var target = ${jsonForScript(target)};
  var i = 0;
  function tryNext(){
    if (i < attempts.length) { window.location.href = attempts[i++]; setTimeout(tryNext, 700); }
    else { window.location.href = target; }
  }
  tryNext();
})();
</script>
<noscript><meta http-equiv="refresh" content="0;url=${t}"></noscript>
</body></html>`;
}

/**
 * Link Shield — 18+ gateway. Ukazuje sa VSETKYM navstevnikom rovnako (ziadna
 * detekcia crawlerov, ziadne podvrhavanie obsahu podla toho, kto sa pyta).
 * Cielova URL sa v HTML NENACHADZA — pokracovat sa da iba POST poziadavkou,
 * cize skutocnym kliknutim cloveka. Bot, ktory iba nasleduje odkazy, sa tak
 * k cielovej adrese nedostane a nespoji ju s uctom. Znizuje riziko
 * automatickeho flagovania; nie je to garancia.
 */
function gateway(id: string) {
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<meta name="referrer" content="no-referrer">
<title>Continue</title>
<style>
  :root { color-scheme: light dark;
    --bg:#faf9f6; --card:#ffffff; --ink:#191813; --soft:#6b6862; --line:#e7e4dd }
  @media (prefers-color-scheme: dark){ :root{
    --bg:#0e0e10; --card:#17171a; --ink:#f4f4f5; --soft:#a1a1aa; --line:#26262b } }
  * { box-sizing:border-box }
  body { margin:0; min-height:100dvh; display:grid; place-items:center;
         font: 16px/1.55 ui-sans-serif, system-ui, -apple-system, sans-serif;
         background:var(--bg); color:var(--ink); padding:1.5rem }
  main { width:100%; max-width:26rem; background:var(--card);
         border:1px solid var(--line); border-radius:1.25rem; padding:2rem;
         text-align:center }
  .badge { display:inline-block; font-size:.72rem; font-weight:700;
           letter-spacing:.06em; border:1px solid var(--line); color:var(--soft);
           padding:.3rem .6rem; border-radius:999px }
  h1 { font-size:1.35rem; margin:1.1rem 0 .5rem }
  p { color:var(--soft); font-size:.95rem; margin:0 0 1.5rem }
  button { width:100%; padding:.9rem 1.25rem; border:0; cursor:pointer;
           border-radius:999px; background:var(--ink); color:var(--bg);
           font-weight:600; font-size:1rem }
  .back { display:inline-block; margin-top:1rem; color:var(--soft);
          font-size:.85rem; text-decoration:none }
  .back:hover { color:var(--ink) }
</style>
</head><body>
<main>
  <span class="badge">18+</span>
  <h1>You're leaving to an external site</h1>
  <p>This link may contain content intended for adults. Continue only if you
     are at least 18 years old and agree to view it.</p>
  <form method="POST" action="/r/${escapeHtml(id)}">
    <button type="submit">I'm 18+ — Continue</button>
  </form>
  <a class="back" href="javascript:history.back()">Go back</a>
</main>
</body></html>`;
}

async function resolve(
  id: string,
): Promise<{ url: string; shielded: boolean; lockCode: string | null } | null> {
  const supabase = createPublicClient();

  // Cielova adresa sa berie zo ZVEREJNENEHO snapshotu, nie z draftu — klik
  // teda vedie presne tam, kam viedol odkaz, ktory navstevnik videl.
  const { data } = await supabase.rpc("resolve_link", { p_block_id: id });
  const row = Array.isArray(data) ? data[0] : data;
  const r = row as {
    url?: unknown;
    shielded?: unknown;
    lock_code?: unknown;
  } | null;
  const url = r?.url;

  if (typeof url !== "string" || !/^https?:\/\//i.test(url)) return null;
  return {
    url,
    shielded: r?.shielded === true,
    lockCode: typeof r?.lock_code === "string" ? r.lock_code : null,
  };
}

/**
 * VIP zamok — stranka na zadanie kodu. Cielova URL ani spravny kod tu NIE su.
 * Overuje sa vylucne serverovym POST-om. Rovnaka pre vsetkych navstevnikov.
 */
function lockedPage(id: string, error = false) {
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<meta name="referrer" content="no-referrer">
<title>Locked</title>
<style>
  :root { color-scheme: light dark;
    --bg:#faf9f6; --card:#ffffff; --ink:#191813; --soft:#6b6862; --line:#e7e4dd; --err:#c0392b }
  @media (prefers-color-scheme: dark){ :root{
    --bg:#0e0e10; --card:#17171a; --ink:#f4f4f5; --soft:#a1a1aa; --line:#26262b; --err:#f87171 } }
  * { box-sizing:border-box }
  body { margin:0; min-height:100dvh; display:grid; place-items:center;
         font: 16px/1.55 ui-sans-serif, system-ui, -apple-system, sans-serif;
         background:var(--bg); color:var(--ink); padding:1.5rem }
  main { width:100%; max-width:23rem; background:var(--card);
         border:1px solid var(--line); border-radius:1.25rem; padding:2rem;
         text-align:center }
  .lock { font-size:1.5rem }
  h1 { font-size:1.3rem; margin:.75rem 0 .35rem }
  p { color:var(--soft); font-size:.92rem; margin:0 0 1.25rem }
  input { width:100%; padding:.85rem 1rem; border:1px solid var(--line);
          border-radius:.85rem; background:var(--bg); color:var(--ink);
          font-size:1rem; text-align:center; letter-spacing:.08em }
  button { margin-top:.75rem; width:100%; padding:.9rem 1.25rem; border:0;
           cursor:pointer; border-radius:999px; background:var(--ink);
           color:var(--bg); font-weight:600; font-size:1rem }
  .err { color:var(--err); font-size:.85rem; margin-top:.75rem }
</style>
</head><body>
<main>
  <div class="lock" aria-hidden>🔒</div>
  <h1>VIP link</h1>
  <p>Enter your access code to continue.</p>
  <form method="POST" action="/r/${escapeHtml(id)}">
    <input name="code" autocomplete="off" autofocus placeholder="Access code"
           aria-label="Access code" maxlength="64" />
    <button type="submit">Unlock</button>
    ${error ? '<p class="err">That code isn’t right. Try again.</p>' : ""}
  </form>
</main>
</body></html>`;
}

/** Klik logujeme bez cookies a bez JS — kanal citame z referrera. */
async function logClick(request: NextRequest, id: string) {
  const supabase = createPublicClient();

  const referrerHeader = request.headers.get("referer");
  let referrer: string | null = null;
  let source: string | null = null;
  if (referrerHeader) {
    try {
      const u = new URL(referrerHeader);
      referrer = u.hostname.replace(/^www\./, "");
      source = normaliseSource(u.searchParams.get("s"));
    } catch {
      referrer = null;
    }
  }

  const ua = request.headers.get("user-agent") ?? "";
  const device = /mobile|android|iphone|ipad/i.test(ua) ? "mobile" : "desktop";
  const rawCountry = request.headers.get("x-vercel-ip-country") ?? "";
  const country = /^[A-Z]{2}$/.test(rawCountry) ? rawCountry : null;

  // Zlyhanie logovania nesmie zabranit redirectu.
  await supabase
    .from("clicks")
    .insert({ block_id: id, referrer, device, source, country })
    .then(() => undefined);
}

/** Bezny prehliadac dostane 302/303, in-app prehliadac medzistranku. */
function proceed(target: string, ua: string, status: 302 | 303) {
  if (!detectInApp(ua)) {
    const res = NextResponse.redirect(target, status);
    // Referrer hiding: cielova stranka (Fanvue/OnlyFans) sa nedozvie, ze klik
    // prisiel cez linkovne.com — policy na 3xx odpovedi riadi referrer
    // nasledujuceho hopu. Interny profil->/r hop tym nie je dotknuty.
    res.headers.set("Referrer-Policy", "no-referrer");
    return res;
  }
  return new NextResponse(
    interstitial(target, nativeDeepLink(target), escapeToBrowser(target, ua)),
    {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
        "Referrer-Policy": "no-referrer",
      },
    },
  );
}

// GET: chraneny link ukaze 18+ gateway (bez cielovej URL), inak rovno prejde.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!UUID_RE.test(id)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const link = await resolve(id);
  if (!link) return NextResponse.redirect(new URL("/", request.url));

  const htmlHeaders = {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Robots-Tag": "noindex, nofollow",
  };

  // VIP zamok ma prednost — kym nezada spravny kod, cielova URL sa neodhali.
  if (link.lockCode) {
    return new NextResponse(lockedPage(id), { status: 200, headers: htmlHeaders });
  }

  if (link.shielded) {
    return new NextResponse(gateway(id), { status: 200, headers: htmlHeaders });
  }

  await logClick(request, id);
  return proceed(link.url, request.headers.get("user-agent") ?? "", 302);
}

// POST: sem sa dostane iba potvrdenie z 18+ gateway (klik cloveka). Az tu
// klik logujeme a presmerujeme na cielovu adresu.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!UUID_RE.test(id)) {
    return NextResponse.redirect(new URL("/", request.url), 303);
  }

  const link = await resolve(id);
  if (!link) return NextResponse.redirect(new URL("/", request.url), 303);

  // VIP zamok: kod sa overuje TU, na serveri. Nespravny kod = znova zadanie.
  if (link.lockCode) {
    const form = await request.formData().catch(() => null);
    const code = String(form?.get("code") ?? "").trim();
    if (code !== link.lockCode) {
      return new NextResponse(lockedPage(id, true), {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-store",
          "X-Robots-Tag": "noindex, nofollow",
        },
      });
    }
  }

  await logClick(request, id);
  return proceed(link.url, request.headers.get("user-agent") ?? "", 303);
}
