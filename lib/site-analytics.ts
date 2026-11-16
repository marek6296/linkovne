import { SITE_DOMAIN } from "@/lib/site";

/**
 * Navstevnost NASHO marketingoveho webu (linkovne.com). Zamerne oddelene od
 * analytiky profilov tvorcov (page_views / clicks) — tam su fanusikovia nasich
 * klientov, tu nasi potencialni zakaznici.
 *
 * Tento subor importuje aj klientsky tracker, preto tu nie je nic serverove.
 */

/** Verejne marketingove stranky, ktore meriame. Profily tvorcov (/[username]),
 *  dashboard, admin, onboarding, /r/ ani reset hesla sem nepatria. */
const TRACKED_PATHS: RegExp[] = [
  /^\/$/,
  /^\/about$/,
  /^\/pricing$/,
  /^\/features$/,
  /^\/guides(\/[a-z0-9-]{1,80})?$/,
  /^\/vs(\/[a-z0-9-]{1,80})?$/,
  /^\/login$/,
  /^\/register$/,
  /^\/forgot$/,
  /^\/safe$/,
  /^\/privacy$/,
  /^\/terms$/,
];

/** Virtualna „stranka" = navstevnik doscrolloval na cennik na landingu. */
export const PRICING_SECTION_PATH = "/#pricing";

/** Odreze koncove lomitko (okrem rootu), aby /about/ a /about boli jedno. */
export function normaliseSitePath(path: string): string {
  const p = path.split(/[?#]/)[0] || "/";
  return p.length > 1 ? p.replace(/\/+$/, "") || "/" : p;
}

export function isTrackedSitePath(path: string | null | undefined): boolean {
  if (!path) return false;
  const p = normaliseSitePath(path);
  return TRACKED_PATHS.some((re) => re.test(p));
}

/** localStorage kluc — zariadenie, kde sa raz otvoril /admin, sa nemeria. */
export const NO_TRACK_KEY = "linkovne:notrack";

// --- server-side klasifikacia (cista funkcia, bez Node API) -------------------

/**
 * Boti, monitoring, headless prehliadace a HTTP kniznice. Vacsina botov JS
 * vobec nespusti (beacon nepride), toto je druha vrstva. Realne prehliadace
 * vratane in-app (Instagram, TikTok…) zacinaju „Mozilla/".
 */
const BOT_RE =
  /bot\b|bot\/|crawl|spider|slurp|scrap|headless|lighthouse|pagespeed|gtmetrix|pingdom|uptime|monitor|preview|validator|curl|wget|python|httpclient|http-client|okhttp|axios|node-fetch|undici|go-http|java\/|libwww|phantomjs|selenium|playwright|puppeteer|electron|facebookexternalhit|embedly|vercel/i;

export function isBotUserAgent(ua: string | null | undefined): boolean {
  const s = (ua ?? "").trim();
  if (s.length < 30 || !s.startsWith("Mozilla/")) return true;
  return BOT_RE.test(s);
}

export function deviceOf(ua: string): "mobile" | "tablet" | "desktop" {
  if (/ipad|tablet|kindle|silk|playbook|(android(?!.*mobile))/i.test(ua))
    return "tablet";
  if (/mobi|iphone|ipod|android|phone/i.test(ua)) return "mobile";
  return "desktop";
}

/** Hrube urcenie prehliadaca — staci na „odkial ludia chodia". Poradie je
 *  dolezite: in-app a Edge/Opera maju v UA aj „Chrome"/„Safari". */
export function browserOf(ua: string): string {
  if (/Instagram/i.test(ua)) return "Instagram app";
  if (/FBAN|FBAV|FB_IAB/i.test(ua)) return "Facebook app";
  if (/musical_ly|BytedanceWebview|TikTok/i.test(ua)) return "TikTok app";
  if (/Edg(e|A|iOS)?\//.test(ua)) return "Edge";
  if (/OPR\/|Opera/.test(ua)) return "Opera";
  if (/SamsungBrowser/.test(ua)) return "Samsung Internet";
  if (/Firefox|FxiOS/.test(ua)) return "Firefox";
  if (/Chrome|CriOS/.test(ua)) return "Chrome";
  if (/Safari/.test(ua)) return "Safari";
  return "Other";
}

/**
 * Z plneho referrera ulozime len hostname. Interna navigacia medzi nasimi
 * marketingovymi strankami = null. Prichod z profilu tvorcu na linkovne.com
 * („Powered by linkovne") = „linkovne.com", aby bol vidno ako zdroj.
 */
export function referrerHost(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  if (!host) return null;
  if (host === SITE_DOMAIN) {
    return isTrackedSitePath(url.pathname) ? null : SITE_DOMAIN;
  }
  return host.slice(0, 120);
}

/**
 * Prisiel z inej NASEJ marketingovej stranky (nova karta, reload, presmerovanie)?
 * Taka navsteva nie je novy prichod zvonku — nema niest zdroj ani sa ratat
 * ako „Direct".
 */
export function isInternalReferrer(raw: string | null | undefined): boolean {
  if (!raw) return false;
  try {
    const url = new URL(raw);
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    return host === SITE_DOMAIN && isTrackedSitePath(url.pathname);
  } catch {
    return false;
  }
}

/**
 * Registracie, ktore mozno porovnat s navstevami: len dni od zaciatku merania.
 * Inak by konverzia v prvom mesiaci delila registracie za 30 dni navstevami
 * za par hodin (napr. 600 %).
 */
export function signupsSinceTracking(
  byDay: { d: string; signups: number }[],
  since: string | null,
): number {
  if (!since) return 0;
  return byDay.reduce((n, day) => (day.d >= since ? n + day.signups : n), 0);
}

/** UTM / kampan: len bezpecne znaky, malymi pismenami. */
export function cleanCampaign(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const v = raw.trim().toLowerCase().slice(0, 64);
  return /^[a-z0-9._+\- ]{1,64}$/.test(v) ? v : null;
}

// --- zoskupenie zdrojov do kanalov (pre admin) -------------------------------

const CHANNEL_RULES: [RegExp, string][] = [
  [/(^|\.)google\.[a-z.]+$|^com\.google\.android/i, "Google"],
  [/(^|\.)bing\.com$/i, "Bing"],
  [/(^|\.)duckduckgo\.com$/i, "DuckDuckGo"],
  [/(^|\.)(yahoo|ecosia|brave|yandex|seznam|qwant|startpage)\./i, "Other search"],
  [/(^|\.)(chatgpt\.com|chat\.openai\.com|openai\.com)$/i, "ChatGPT"],
  [/(^|\.)perplexity\.ai$/i, "Perplexity"],
  [/(^|\.)claude\.ai$/i, "Claude"],
  [/^gemini\.google\.com$|(^|\.)copilot\.microsoft\.com$|(^|\.)you\.com$|(^|\.)phind\.com$/i, "Other AI"],
  [/(^|\.)instagram\.com$|(^|\.)ig\.me$/i, "Instagram"],
  [/(^|\.)tiktok\.com$/i, "TikTok"],
  [/(^|\.)(x|twitter)\.com$|(^|\.)t\.co$/i, "X / Twitter"],
  [/(^|\.)facebook\.com$|(^|\.)fb\.(com|me)$/i, "Facebook"],
  [/(^|\.)threads\.(net|com)$/i, "Threads"],
  [/(^|\.)reddit\.com$|(^|\.)redd\.it$/i, "Reddit"],
  [/(^|\.)youtube\.com$|(^|\.)youtu\.be$/i, "YouTube"],
  [/(^|\.)linkedin\.com$|(^|\.)lnkd\.in$/i, "LinkedIn"],
  [/(^|\.)t\.me$|(^|\.)telegram\.(org|me)$/i, "Telegram"],
  [/(^|\.)(alternativeto\.net|saashub\.com|producthunt\.com|g2\.com|capterra\.com)$/i, "Directories"],
];

/** Jeden riadok zo zdrojov → nazov kanala pre prehlad. */
export function siteChannel(
  referrer: string | null,
  utmSource: string | null,
): string {
  // Badge „Powered by" a marketing widget na profiloch tvorcov
  if (utmSource === "powered-by") return "From creator pages";
  if (utmSource) return `Campaign: ${utmSource}`;
  if (!referrer) return "Direct / unknown";
  if (referrer === SITE_DOMAIN) return "From creator pages";
  for (const [re, label] of CHANNEL_RULES) if (re.test(referrer)) return label;
  return "Other websites";
}
