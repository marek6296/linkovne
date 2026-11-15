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

test("marketing metadata keeps each page's own canonical and sharing URL", () => {
  const { marketingMetadata } = load("lib/seo.ts");
  const m = marketingMetadata("/guides/agency-link-in-bio", "Agency guide", "A practical guide");
  assert.equal(m.alternates.canonical, "/guides/agency-link-in-bio");
  assert.equal(m.openGraph.url, "https://linkovne.com/guides/agency-link-in-bio");
  assert.equal(m.title.absolute, "Agency guide · linkovne");
});
test("product facts preserve billing periods, domain limits and current profile counts", () => {
  const { productGraph, productFacts } = load("lib/seo.ts");
  const { PLANS } = load("lib/plans.ts");
  const app = productGraph["@graph"].find(x => x["@type"] === "SoftwareApplication");
  assert.equal(productFacts.proProfiles, PLANS.pro.profiles);
  assert.equal(productFacts.businessProfiles, PLANS.business.profiles);
  assert.equal(productFacts.domainPlan, "Business");
  const pro = app.offers.find(x => x.name === "Pro");
  assert.equal(pro.price, "4.99");
  assert.equal(pro.priceSpecification.billingDuration, "P1M");
  assert.equal(app.publisher["@id"], "https://linkovne.com/#organization");
});
test("private and active Creator-mode profiles never enter sitemap candidates", () => {
  const { canIndexPublicProfile } = load("lib/profile-indexing.ts");
  const published = { snapshot: { display_name: "Example" }, is_indexable: true, creator_mode: false, plan: "pro" };
  assert.equal(canIndexPublicProfile(published), true);
  assert.equal(canIndexPublicProfile({ ...published, creator_mode: true }), false);
  assert.equal(canIndexPublicProfile({ ...published, is_indexable: false }), false);
  assert.equal(canIndexPublicProfile({ ...published, snapshot: null }), false);
  assert.equal(canIndexPublicProfile(null), false);
  assert.equal(canIndexPublicProfile({ ...published, creator_mode: true, plan: "free" }), true);
});
test("competitor lookup rejects inherited property names and covers direct creator alternatives", () => {
  const { getCompetitor } = load("lib/compare.ts");
  for (const slug of ["linkme", "allmylinks", "hoobe"]) {
    const competitor = getCompetitor(slug);
    assert.equal(competitor.slug, slug);
    assert.match(competitor.sourceUrl, /^https:\/\//);
    assert.ok(competitor.chooseUs && competitor.chooseThem);
  }
  for (const slug of ["constructor", "toString", "__proto__", "nonexistent"]) {
    assert.equal(getCompetitor(slug), undefined);
  }
});
