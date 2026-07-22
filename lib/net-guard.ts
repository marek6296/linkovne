/**
 * Ochrana server-side fetchov pred SSRF — blokuje interne ciele (localhost,
 * .local/.internal, metadata endpointy, surove IP/IPv6). Pouziva link-health
 * cron a import rehost.
 */
export function isPublicHttpUrl(raw: string): boolean {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return false;
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return false;

  const host = u.hostname.toLowerCase();
  if (
    host === "localhost" ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    host === "metadata.google.internal"
  ) {
    return false;
  }
  // Priame IP adresy vratane privatnych rozsahov nepustime vobec
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return false;
  if (host.includes(":")) return false; // IPv6 literal
  return host.includes(".");
}
