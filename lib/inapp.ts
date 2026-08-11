/**
 * Odkazy otvorene z Instagramu, TikToku a spol. sa nacitaju vo VNUTORNOM
 * prehliadaci tej aplikacie. Tam sa neprenasaju prihlasenia a cast platobnych
 * tokov zlyha — cize navstevnik, ktory by zaplatil, odide. Tento subor
 * detekuje taky prehliadac a stavia adresy, ktore z neho vyskocia von.
 */

export type InAppBrowser =
  | "instagram"
  | "facebook"
  | "tiktok"
  | "snapchat"
  | "twitter"
  | "linkedin"
  | "pinterest"
  | "reddit"
  | null;

export function detectInApp(userAgent: string): InAppBrowser {
  const ua = userAgent.toLowerCase();
  if (ua.includes("instagram")) return "instagram";
  // FBAN/FBAV = Facebook a Messenger
  if (ua.includes("fban") || ua.includes("fbav") || ua.includes("fb_iab"))
    return "facebook";
  if (ua.includes("bytedance") || ua.includes("musical_ly") || ua.includes("tiktok"))
    return "tiktok";
  if (ua.includes("snapchat")) return "snapchat";
  if (ua.includes("twitter")) return "twitter";
  if (ua.includes("linkedinapp")) return "linkedin";
  if (ua.includes("pinterest")) return "pinterest";
  if (ua.includes("redditapp")) return "reddit";
  return null;
}

export function isIOS(userAgent: string): boolean {
  return /iphone|ipad|ipod/i.test(userAgent);
}

export function isAndroid(userAgent: string): boolean {
  return /android/i.test(userAgent);
}

/**
 * Ak cielova sluzba ma natívnu appku, vratime jej schemu — otvorenie priamo
 * v appke je pre navstevnika najlepsi vysledok (uz je tam prihlaseny).
 */
export function nativeDeepLink(raw: string): string | null {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^www\./, "").toLowerCase();
  const seg = u.pathname.split("/").filter(Boolean);
  const first = seg[0]?.replace(/^@/, "");
  const e = encodeURIComponent;

  if (host === "instagram.com" && first) {
    return `instagram://user?username=${e(first)}`;
  }
  if (host === "youtube.com" && u.searchParams.get("v")) {
    return `vnd.youtube://${u.searchParams.get("v")}`;
  }
  if (host === "youtu.be" && seg[0]) {
    return `vnd.youtube://${seg[0]}`;
  }
  if (host === "open.spotify.com" && seg.length >= 2) {
    return `spotify:${seg[0]}:${seg[1]}`;
  }
  if ((host === "twitter.com" || host === "x.com") && first) {
    return `twitter://user?screen_name=${e(first)}`;
  }
  if (host === "t.me" && seg[0]) {
    return `tg://resolve?domain=${e(seg[0])}`;
  }
  if (host === "snapchat.com" && first) {
    // snapchat.com/add/<user> aj snapchat.com/<user>
    return `snapchat://add/${e(first === "add" ? (seg[1] ?? "") : first)}`;
  }
  if (host === "pinterest.com" && first) {
    return `pinterest://user/${e(first)}`;
  }
  if (host === "twitch.tv" && first) {
    return `twitch://stream/${e(first)}`;
  }
  if (host === "reddit.com" && seg[0]) {
    if (seg[0] === "r" && seg[1]) return `reddit://r/${e(seg[1])}`;
    if ((seg[0] === "u" || seg[0] === "user") && seg[1])
      return `reddit://user/${e(seg[1])}`;
  }
  if (host === "threads.net" && first) {
    return `barcelona://user?username=${e(first)}`;
  }
  if (host === "wa.me" && seg[0]) {
    return `whatsapp://send?phone=${e(seg[0])}`;
  }
  // OnlyFans / Fanvue / Fansly nemaju natívnu appku → deep-link do appky nie je
  // mozny, jediny „utek" je do systemoveho prehliadaca (viz escapeToBrowser*).
  return null;
}

/**
 * Adresa, ktora prinuti system otvorit odkaz mimo in-app prehliadaca.
 * Obe su best-effort — preto sa vzdy pridava aj obycajny odkaz ako zaloha.
 */
export function escapeToBrowser(
  raw: string,
  userAgent: string,
): string | null {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return null;
  }

  // Instagram ma VLASTNU schemu, ktorou appka otvori adresu v EXTERNOM
  // prehliadaci — funguje aj na najnovsom iOS (na rozdiel od x-safari, ktory
  // Instagram zablokoval). Preto ju uprednostnime pred vsetkym ostatnym.
  if (/instagram/i.test(userAgent)) {
    return `instagram://extbrowser/?url=${encodeURIComponent(u.toString())}`;
  }

  if (isIOS(userAgent)) {
    // Ostatne in-app prehliadace na iOS (TikTok, Snapchat…) — best-effort.
    return `x-safari-${u.toString()}`;
  }

  if (isAndroid(userAgent)) {
    const fallback = encodeURIComponent(u.toString());
    // Bez `package=` sa pouzije predvoleny prehliadac namiesto vnutorneho
    return `intent://${u.host}${u.pathname}${u.search}#Intent;scheme=${u.protocol.replace(":", "")};action=android.intent.action.VIEW;S.browser_fallback_url=${fallback};end`;
  }

  return null;
}
