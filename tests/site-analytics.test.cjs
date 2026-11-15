const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const { createRequire } = require("node:module");
const root = path.resolve(__dirname, "..");
const cache = new Map();
// Compile the app's actual TypeScript with its @/ alias; no duplicate test logic.
function load(name) {
  let filename = path.resolve(root, name);
  if (!path.extname(filename))
    filename += fs.existsSync(filename + ".ts") ? ".ts" : ".tsx";
  if (cache.has(filename)) return cache.get(filename).exports;
  const module = { exports: {} };
  cache.set(filename, module);
  const source = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  }).outputText;
  const nodeRequire = createRequire(filename);
  const localRequire = (specifier) =>
    specifier.startsWith("@/")
      ? load(specifier.slice(2))
      : specifier.startsWith(".")
        ? load(path.resolve(path.dirname(filename), specifier))
        : nodeRequire(specifier);
  new Function("require", "module", "exports", source)(
    localRequire,
    module,
    module.exports,
  );
  return module.exports;
}

const sa = load("lib/site-analytics");

const UA = {
  chromeMac:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  iphone:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1",
  instagram:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/22B83 Instagram 356.0.0.28.109 (iPhone15,2; iOS 18_1; en_US)",
  ipad:
    "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  edge:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0",
};

test("site analytics counts only public marketing pages, never creator pages", () => {
  for (const p of ["/", "/about", "/about/", "/vs", "/vs/linktree", "/guides/link-in-bio-for-onlyfans", "/login", "/register", "/forgot", "/safe", "/privacy", "/terms"])
    assert.equal(sa.isTrackedSitePath(p), true, p);
  for (const p of ["/mia", "/dashboard", "/dashboard/analytics", "/admin", "/admin/website", "/onboarding", "/r/abc", "/reset", "/i/CODE", "/redeem/x", "", null])
    assert.equal(sa.isTrackedSitePath(p), false, String(p));
});

test("site analytics drops bots and keeps real (in-app) browsers", () => {
  for (const ua of Object.values(UA)) assert.equal(sa.isBotUserAgent(ua), false, ua);
  for (const ua of [
    "",
    "curl/8.7.1",
    "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
    "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm) Chrome/116.0.1938.76 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/131.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Linux; Android 11; moto g power (2022)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36 Chrome-Lighthouse",
    "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
    "python-requests/2.32.3",
  ])
    assert.equal(sa.isBotUserAgent(ua), true, ua);
});

test("site analytics classifies device and browser", () => {
  assert.equal(sa.deviceOf(UA.chromeMac), "desktop");
  assert.equal(sa.deviceOf(UA.iphone), "mobile");
  assert.equal(sa.deviceOf(UA.ipad), "tablet");
  assert.equal(sa.browserOf(UA.instagram), "Instagram app");
  assert.equal(sa.browserOf(UA.edge), "Edge");
  assert.equal(sa.browserOf(UA.chromeMac), "Chrome");
  assert.equal(sa.browserOf(UA.iphone), "Safari");
});

test("site analytics keeps only the referrer host and spots creator pages", () => {
  assert.equal(sa.referrerHost("https://www.google.com/search?q=link+in+bio"), "google.com");
  assert.equal(sa.referrerHost("https://linkovne.com/vs/linktree"), null);
  assert.equal(sa.referrerHost("https://linkovne.com/"), null);
  assert.equal(sa.referrerHost("https://linkovne.com/mia"), "linkovne.com");
  assert.equal(sa.referrerHost("not a url"), null);
  assert.equal(sa.siteChannel("google.com", null), "Google");
  assert.equal(sa.siteChannel("chatgpt.com", null), "ChatGPT");
  assert.equal(sa.siteChannel("linkovne.com", null), "From creator pages");
  assert.equal(sa.siteChannel(null, "powered-by"), "From creator pages");
  assert.equal(sa.siteChannel(null, "instagram"), "Campaign: instagram");
  assert.equal(sa.siteChannel(null, null), "Direct / unknown");
  assert.equal(sa.cleanCampaign("Instagram"), "instagram");
  assert.equal(sa.cleanCampaign("<script>"), null);
});

test("site analytics treats our own marketing pages as internal, not a new visit", () => {
  assert.equal(sa.isInternalReferrer("https://linkovne.com/vs/linktree"), true);
  assert.equal(sa.isInternalReferrer("https://www.linkovne.com/"), true);
  assert.equal(sa.isInternalReferrer("https://linkovne.com/mia"), false);
  assert.equal(sa.isInternalReferrer("https://www.google.com/"), false);
  assert.equal(sa.isInternalReferrer(""), false);
  assert.equal(sa.isInternalReferrer(null), false);
});

test("site analytics compares signups only with days that were tracked", () => {
  const byDay = [
    { d: "2026-11-13", signups: 2 },
    { d: "2026-11-14", signups: 3 },
    { d: "2026-11-15", signups: 1 },
  ];
  assert.equal(sa.signupsSinceTracking(byDay, "2026-11-15"), 1);
  assert.equal(sa.signupsSinceTracking(byDay, "2026-11-01"), 6);
  assert.equal(sa.signupsSinceTracking(byDay, null), 0);
});
