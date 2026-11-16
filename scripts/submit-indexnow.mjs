import { readdir, readFile } from "node:fs/promises";

// Public proof-of-host file, not a private API credential. No user profiles are submitted.
const origin = "https://linkovne.com";
const files = (await readdir(new URL("../public/", import.meta.url))).filter(name => /^[a-f0-9]{32}\.txt$/.test(name));
if (files.length !== 1) throw new Error("Expected one public IndexNow proof file");
const filename = files[0];
const key = (await readFile(new URL(`../public/${filename}`, import.meta.url), "utf8")).trim();
const proof = await fetch(`${origin}/${filename}`);
if (!proof.ok || (await proof.text()).trim() !== key) throw new Error("Production proof file is not deployed yet");
const sitemap = await fetch(`${origin}/sitemap.xml`);
if (!sitemap.ok) throw new Error(`Sitemap returned ${sitemap.status}`);
const urlList = [...(await sitemap.text()).matchAll(/<loc>([^<]+)<\/loc>/g)]
  .map(match => match[1])
  .filter(value => { const u = new URL(value); return u.origin === origin && (u.pathname === "/" || u.pathname === "/about" || u.pathname === "/pricing" || u.pathname === "/features" || u.pathname === "/guides" || u.pathname === "/vs" || u.pathname.startsWith("/guides/") || u.pathname.startsWith("/vs/")); });
if (urlList.length === 0) throw new Error("No marketing URLs in production sitemap");
for (const url of urlList) {
  const page = await fetch(url);
  if (!page.ok) throw new Error(`Will not submit unavailable URL: ${url} (${page.status})`);
}
if (process.argv.includes("--dry-run")) {
  console.log(JSON.stringify({ host: "linkovne.com", urlList, submitted: false }, null, 2));
} else {
  const response = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST", headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ host: "linkovne.com", key, keyLocation: `${origin}/${filename}`, urlList }),
  });
  if (![200, 202].includes(response.status)) throw new Error(`IndexNow rejected submission: ${response.status} ${(await response.text()).slice(0,300)}`);
  console.log(`IndexNow received ${urlList.length} marketing URLs (HTTP ${response.status}). This is receipt, not confirmed indexing.`);
}
