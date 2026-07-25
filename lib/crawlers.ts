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
  return CRAWLER_RE.test(ua);
}
