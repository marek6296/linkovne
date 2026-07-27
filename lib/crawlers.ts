import { detectInApp, isAndroid, isIOS } from "@/lib/inapp";

/**
 * Detekcia známych platform crawlerov / link-preview botov podľa User-Agentu.
 * V Creator/Stealth mode dostane takýto bot čistú „compliant" stránku (len
 * meno, bez fotky, bia a linkov), takže nemá čo označiť — reálny návštevník
 * vidí profil normálne. Doplnok k client-side doťahovaniu obsahu: chytí aj
 * bota, ktorý by JS spustil.
 */
const CRAWLER_RE =
  /facebookexternalhit|facebot|meta-external|instagram|whatsapp|twitterbot|bytespider|tiktok|bytedance|linkedinbot|discordbot|slackbot|telegrambot|googlebot|google-inspectiontool|apis-google|storebot-google|mediapartners-google|bingbot|bingpreview|pinterest|snapchat|redditbot|applebot|skypeuripreview|vkshare|duckduckbot|petalbot|yandex|semrushbot|ahrefsbot|dotbot|embedly|nuzzel|outbrain|w3c_validator|developers\.google\.com\/\+\/web\/snippet/i;

export function isSocialCrawler(userAgent: string | null | undefined): boolean {
  const ua = (userAgent ?? "").trim();
  // Prázdny UA je pre bežný prehliadač netypický → v stealth mode ho radšej
  // považujeme za bota (servneme čistú stránku, bezpečnejšia voľba).
  if (!ua) return true;

  // Instagram/TikTok/Facebook webview obsahuje rovnake platformove slova ako
  // ich link-preview boty. Skutocny mobilny prehliadac aplikacie vsak nesmie
  // dostat crawler-clean stranku: Creator mode ho ma poslat do tej istej
  // „Open externally" brany ako samostatny prepinač.
  if (detectInApp(ua) !== null && (isIOS(ua) || isAndroid(ua))) return false;

  return CRAWLER_RE.test(ua);
}
