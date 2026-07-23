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

  // IP sa da zapisat aj hex/oktalovo/decimalne (0x7f.0.0.1, 0177.0.0.1,
  // 2130706433) — take zapisy prejdu resolverom na 127.0.0.1, ale obisli by
  // dotted-quad regex vyssie. Ak je KAZDY label ciselny/hex, je to IP literal,
  // nie domena (realna domena ma vzdy alfabeticky TLD, napr. `com`, `xn--p1ai`).
  const labels = host.split(".").filter(Boolean);
  const isNumericLabel = (l: string) =>
    /^0x[0-9a-f]+$/.test(l) || /^[0-9]+$/.test(l);
  if (labels.length === 0 || labels.every(isNumericLabel)) return false;

  return host.includes(".");
}
