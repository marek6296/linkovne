import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isPublicHttpUrl } from "@/lib/net-guard";

export const maxDuration = 30;

/**
 * Iba znama link-in-bio hostitelia. Zaroven to riesi SSRF — user nemoze
 * poslat server na internu adresu.
 */
const ALLOWED_HOSTS = new Set([
  "linktr.ee",
  "www.linktr.ee",
  "link.me",
  "www.link.me",
  "beacons.ai",
  "www.beacons.ai",
  "bio.link",
  "www.bio.link",
]);

/** Odkazy samotnej platformy, ktore do importu nepatria. */
const JUNK = [
  "linktr.ee",
  "link.me",
  "beacons.ai",
  "bio.link",
  "apps.apple.com",
  "play.google.com",
  "/privacy",
  "/terms",
  "/report",
  "/cookie",
  "javascript:",
  "mailto:support",
];

type Found = { title: string; url: string; thumb?: string };

/** Frazy samotnej platformy — do profilu ich nikdy nepustime. */
const BRAND_NOISE = [
  /linktr\.?ee/i,
  /link\.me/i,
  /beacons/i,
  /bio\.link/i,
  /make your link do more/i,
  /one link (for all|to rule them all)/i,
  /the only link you'?ll ever need/i,
  /all your links in one place/i,
];

/** Bio: vlastny text ano, boilerplate platformy nie. */
function cleanBio(raw: string): string {
  const v = decode(raw).trim();
  if (!v) return "";
  if (BRAND_NOISE.some((re) => re.test(v))) return "";
  return v.slice(0, 300);
}

/** Meno: bez vodiaceho @ a bez „ | Linktree" príveskov. */
function cleanName(raw: string): string {
  let v = decode(raw).trim();
  v = v.replace(
    /\s*[|•·\-—]\s*(linktr\.?ee|link\.me|beacons|bio\.link).*$/i,
    "",
  );
  v = v.replace(/^@+/, "");
  return v.slice(0, 60);
}

/** Avatar: len https a nie generericky logo/og obrazok platformy. */
function cleanAvatar(raw: string): string {
  const v = (raw ?? "").trim();
  if (!/^https:\/\//i.test(v)) return "";
  if (/og[-_]?image|\/meta\/|default.*avatar|linktree.*(logo|meta)/i.test(v))
    return "";
  return v;
}

/** Link.me obrazky su relativne cesty — plnu URL postavime cez ich media CDN.
 *  Platformove ikonky (style/icons/…) preskocime — to nie su realne fotky. */
function lmImage(path?: unknown): string {
  const p = String(path ?? "").trim();
  if (!p) return "";
  if (/^https?:\/\//i.test(p)) return p;
  if (/^style\/icons\//i.test(p)) return "";
  return `https://media.link.me/_resize/image/width=512,quality=90,format=webp/images/${p.replace(/^\/+/, "")}`;
}

/** Thumbnail odkazu (fotka na buttone) — string alebo objekt {url}. */
function pickThumb(l: Record<string, unknown>): string | undefined {
  const t = l.thumbnail ?? l.image ?? l.imageUrl ?? l.picture;
  if (typeof t === "string" && /^https?:\/\//i.test(t)) return t;
  if (t && typeof t === "object") {
    const u = (t as { url?: unknown }).url;
    if (typeof u === "string" && /^https?:\/\//i.test(u)) return u;
  }
  return undefined;
}

function isJunk(url: string, title: string) {
  const u = url.toLowerCase();
  if (JUNK.some((j) => u.includes(j))) return true;
  if (!/^https?:\/\//i.test(url)) return true;
  if (!title.trim()) return true;
  return false;
}

function decode(s: string) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .trim();
}

function meta(html: string, prop: string): string | null {
  const re = new RegExp(
    `<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']+)["']`,
    "i",
  );
  const m = html.match(re);
  return m ? decode(m[1]) : null;
}

/** Linktree aj Link.me vkladaju obsah stranky do __NEXT_DATA__ (oba su Next.js),
 *  ale s inou strukturou — preto dve vetvy. */
function fromNextData(
  html: string,
): { links: Found[]; name?: string; bio?: string; avatar?: string } | null {
  const m = html.match(
    /<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/i,
  );
  if (!m) return null;
  try {
    const json = JSON.parse(m[1]);
    const page = json?.props?.pageProps ?? {};

    // ── Link.me ── pageProps.profile.webLinks[].links[].linkValue (vnorene skupiny)
    const profile = page.profile as Record<string, unknown> | undefined;
    if (
      profile &&
      (Array.isArray(profile.webLinks) || Array.isArray(profile.infoLinks))
    ) {
      const groups = [
        ...((profile.webLinks as unknown[]) ?? []),
        ...((profile.infoLinks as unknown[]) ?? []),
      ] as Record<string, unknown>[];

      const links: Found[] = [];
      for (const g of groups) {
        const groupTitle = String(g.title ?? "").trim();
        const inner = Array.isArray(g.links)
          ? (g.links as Record<string, unknown>[])
          : [];
        // Skupina bez vnorenych linkov moze drzat url priamo.
        if (inner.length === 0 && g.linkValue) {
          links.push({ title: groupTitle, url: String(g.linkValue).trim() });
          continue;
        }
        for (const l of inner) {
          const url = String(l.linkValue ?? l.url ?? "").trim();
          if (!url) continue;
          const title = (groupTitle || String(l.faceValue ?? "").trim()).slice(
            0,
            80,
          );
          const thumb = lmImage(l.linkImage);
          links.push(thumb ? { title, url, thumb } : { title, url });
        }
      }

      const first = String(profile.firstName ?? "").trim();
      const last = String(profile.lastName ?? "").trim();
      const name =
        [first, last].filter(Boolean).join(" ") ||
        String(profile.username ?? "");
      return {
        links: links.filter((l) => l.url && l.title),
        name: name || undefined,
        bio: String(profile.bio ?? "") || undefined,
        avatar: profile.isDefaultProfilePicture
          ? undefined
          : lmImage(profile.profileImage) || undefined,
      };
    }

    // ── Linktree ── pageProps.account.links / pageProps.links
    const account = page.account ?? {};
    const raw = page.links ?? account.links ?? [];
    if (!Array.isArray(raw)) return null;

    const links: Found[] = raw
      .map((l: Record<string, unknown>) => ({
        title: String(l.title ?? l.name ?? "").trim(),
        url: String(l.url ?? l.link ?? "").trim(),
        thumb: pickThumb(l),
      }))
      .filter((l: Found) => l.url && l.title);

    return {
      links,
      name: account.pageTitle ?? account.username ?? undefined,
      bio: account.description ?? undefined,
      avatar:
        account.profilePictureUrl ??
        account.avatarUrl ??
        account.image ??
        undefined,
    };
  } catch {
    return null;
  }
}

/** Zaloha pre stranky, ktore JSON nevkladaju — vytiahneme <a> odkazy. */
function fromAnchors(html: string): Found[] {
  const out: Found[] = [];
  const re = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null && out.length < 100) {
    const url = decode(m[1]);
    const title = decode(m[2].replace(/<[^>]*>/g, " ").replace(/\s+/g, " "));
    if (!isJunk(url, title)) out.push({ title: title.slice(0, 80), url });
  }
  return out;
}

const BUCKET = "linkove-media";

/**
 * Prehostuje importovany obrazok k nam do Storage — nech profilovka a fotky
 * linkov nezavisia od cudzej CDN (link.me servuje avatary ako docasne `tmp-`
 * subory) a ostanu natrvalo. Best-effort: pri akejkolvek chybe vrati povodnu
 * URL, takze import sa nikdy nerozbije.
 */
async function rehost(
  url: string,
  userId: string,
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<string> {
  // SSRF guard — obrazkova URL z cudzieho profilu nesmie mierit do nasej siete.
  if (!isPublicHttpUrl(url)) return url;
  try {
    const r = await fetch(url, {
      signal: AbortSignal.timeout(8000),
      headers: { "User-Agent": "LinkovneImporter/1.0 (+https://linkovne.com)" },
    });
    if (!r.ok) return url;
    const ct = (r.headers.get("content-type") ?? "").toLowerCase();
    if (!ct.startsWith("image/")) return url;
    const buf = new Uint8Array(await r.arrayBuffer());
    if (buf.byteLength < 100 || buf.byteLength > 5_000_000) return url;
    const ext = ct.includes("webp")
      ? "webp"
      : ct.includes("png")
        ? "png"
        : ct.includes("gif")
          ? "gif"
          : "jpg";
    const path = `${userId}/import-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, buf, { contentType: ct });
    if (error) return url;
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;
  } catch {
    return url;
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  let body: { url?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }

  const raw = String(body.url ?? "").trim();
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;

  let target: URL;
  try {
    target = new URL(withProtocol);
  } catch {
    return NextResponse.json({ error: "That isn't a valid link." }, { status: 400 });
  }

  if (!ALLOWED_HOSTS.has(target.hostname.toLowerCase())) {
    return NextResponse.json(
      { error: "We can import from Linktree, Link.me, Beacons and bio.link." },
      { status: 400 },
    );
  }

  let html: string;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    const res = await fetch(target.toString(), {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": "LinkovneImporter/1.0 (+https://linkovne.com)",
        Accept: "text/html",
      },
    });
    clearTimeout(timer);
    if (!res.ok) {
      return NextResponse.json(
        { error: "That page couldn't be opened. Is it public?" },
        { status: 422 },
      );
    }
    // Strop na velkost, nech nam nikto neposle 100 MB
    html = (await res.text()).slice(0, 2_000_000);
  } catch {
    return NextResponse.json(
      { error: "Couldn't reach that page." },
      { status: 502 },
    );
  }

  const structured = fromNextData(html);
  const candidates = structured?.links?.length
    ? structured.links
    : fromAnchors(html);

  // Deduplikacia podla URL, zachovanie poradia
  const seen = new Set<string>();
  const links = candidates
    .filter((l) => !isJunk(l.url, l.title))
    .filter((l) => {
      const k = l.url.toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .slice(0, 30);

  if (links.length === 0) {
    return NextResponse.json(
      { error: "Couldn't find any links on that page." },
      { status: 422 },
    );
  }

  // Prehostime obrazky k nam (avatar + fotky linkov) — paralelne, best-effort.
  const avatarUrl = cleanAvatar(structured?.avatar ?? "");
  const [avatar_url, hostedLinks] = await Promise.all([
    avatarUrl ? rehost(avatarUrl, user.id, supabase) : Promise.resolve(""),
    Promise.all(
      links.map(async (l) =>
        l.thumb ? { ...l, thumb: await rehost(l.thumb, user.id, supabase) } : l,
      ),
    ),
  ]);

  return NextResponse.json({
    profile: {
      display_name: cleanName(structured?.name ?? meta(html, "og:title") ?? ""),
      // Zamerne BEZ og:description fallbacku — to je vzdy boilerplate platformy
      // („Linktree. Make your link do more."). Berieme len skutocne bio usera.
      bio: cleanBio(structured?.bio ?? ""),
      // BEZ og:image fallbacku — to je vzdy Linktree-generovana brandovana karta.
      // Berieme len skutocnu profilovku usera, prehostenu k nam.
      avatar_url,
    },
    links: hostedLinks,
  });
}
