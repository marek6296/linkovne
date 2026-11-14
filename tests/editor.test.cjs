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
const { normaliseSource, trackingSlug, cleanTrackedLinks } =
  load("lib/channels.ts");
const { buildTrafficRows } = load("lib/traffic.ts");
const { createDraftSaveQueue } = load("lib/draft-save-queue.ts");
const { resolveTheme } = load("lib/design.ts");

test("tracking sources are validated without silently truncating distinct campaigns", () => {
  assert.equal(normaliseSource(" Instagram "), "instagram");
  assert.equal(normaliseSource("instagram-personal"), "instagram-personal");
  assert.equal(normaliseSource("x".repeat(25)), null);
  assert.equal(normaliseSource("bad source<script>"), null);
  assert.equal(trackingSlug("Instagram · Štúdio"), "instagram-studio");
});
test("saved links reject duplicates and malformed input and enforce the limit", () => {
  assert.deepEqual(
    cleanTrackedLinks([
      { label: " Personal ", source: "ig-personal" },
      { label: "Duplicate", source: "ig-personal" },
      { label: "bad", source: "bad source" },
      null,
    ]),
    [{ label: "Personal", source: "ig-personal" }],
  );
  assert.equal(
    cleanTrackedLinks(
      Array.from({ length: 60 }, (_, i) => ({
        label: "Campaign",
        source: `campaign-${i}`,
      })),
    ).length,
    50,
  );
});
test("several Instagram accounts stay separate in analytics, even with the same display name", () => {
  const links = [
    { label: "Instagram", source: "ig-personal" },
    { label: "Instagram", source: "ig-studio" },
  ];
  const rows = buildTrafficRows(
    [{ source: "ig-personal" }, { source: "ig-studio" }],
    [{ source: "ig-studio" }],
    links,
  );
  assert.equal(rows.length, 2);
  assert.equal(
    rows.find((row) => row.label === "Instagram (ig-studio)").clicks,
    1,
  );
  assert.equal(
    rows.find((row) => row.label === "Instagram (ig-personal)").clicks,
    0,
  );
});
test("an in-flight draft finishes before the newest snapshot; intermediate snapshots never overwrite it", async () => {
  const queue = createDraftSaveQueue();
  const writes = [];
  let release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  const first = queue.enqueue(queue.invalidate(), async () => {
    writes.push("first-start");
    await gate;
    writes.push("first-end");
  });
  await Promise.resolve();
  const stale = queue.enqueue(queue.invalidate(), async () => {
    writes.push("stale");
  });
  const latest = queue.enqueue(queue.invalidate(), async () => {
    writes.push("latest");
  });
  release();
  await Promise.all([first, stale, latest]);
  assert.deepEqual(writes, ["first-start", "first-end", "latest"]);
});
test("a failed save can be retried and an invalidated revision cannot mark a newer draft saved", async () => {
  const queue = createDraftSaveQueue();
  const old = queue.invalidate();
  await assert.rejects(
    queue.enqueue(old, async () => {
      throw new Error("offline");
    }),
  );
  const next = queue.invalidate();
  assert.equal(queue.isCurrent(old), false);
  let saved = false;
  await queue.enqueue(next, async () => {
    saved = true;
  });
  assert.equal(saved, true);
});
test("explicit opaque button styles clear inherited glass blur", () => {
  const { THEMES } = load("lib/themes.ts");
  const glass = Object.keys(THEMES).find((key) => THEMES[key].btnBackdrop);
  assert.ok(glass, "a theme with backdrop exists");
  assert.equal(
    resolveTheme(glass, { btnStyle: "fill" }).btnBackdrop,
    undefined,
  );
  assert.equal(
    resolveTheme(glass, { btnStyle: "glass" }).btnBackdrop,
    "blur(10px)",
  );
});
test("hero and compact avatars retain bounded geometry across shapes, sizes and aspect ratios", () => {
  const React = require("react");
  const { renderToStaticMarkup } = require("react-dom/server");
  const { ProfileHeader } = load("components/blocks/render.tsx");
  const { AVATAR_SHAPES, AVATAR_SIZES, AVATAR_ASPECTS } = load("lib/design.ts");
  for (const shape of Object.keys(AVATAR_SHAPES))
    for (const size of Object.keys(AVATAR_SIZES))
      for (const aspect of Object.keys(AVATAR_ASPECTS)) {
        const base = {
          avatarShape: shape,
          avatarSize: size,
          avatarAspect: aspect,
        };
        const props = {
          displayName: "A long profile name",
          username: "creator",
          bio: "A long bio ".repeat(25),
          avatarUrl: "https://example.com/photo.jpg",
        };
        const hero = renderToStaticMarkup(
          React.createElement(ProfileHeader, {
            ...props,
            theme: resolveTheme("classic", { ...base, profileLayout: "hero" }),
          }),
        );
        assert.ok(!hero.includes("border-radius:999px"));
        const compact = renderToStaticMarkup(
          React.createElement(ProfileHeader, {
            ...props,
            theme: resolveTheme("classic", {
              ...base,
              profileLayout: "compact",
            }),
          }),
        );
        assert.ok(compact.includes("width:min(38%,"));
        assert.ok(compact.includes("aspect-ratio:"));
        assert.ok(!compact.includes("NaN"));
      }
});

test("reordering sections keeps their contents together in either direction", () => {
  const { reorderBlocks } = load("lib/reorder-blocks.ts");
  const blocks = ["a", "a1", "b", "b1", "c", "c1"].map((id, position) => ({
    id,
    position,
    type: id.length === 1 ? "headline" : "link",
    config: { isSection: id.length === 1 },
    is_active: true,
  }));
  const ids = (items) => items.map((item) => item.id);
  assert.deepEqual(ids(reorderBlocks(blocks, "a", "b")), [
    "b",
    "b1",
    "a",
    "a1",
    "c",
    "c1",
  ]);
  assert.deepEqual(ids(reorderBlocks(blocks, "c", "a1")), [
    "c",
    "c1",
    "a",
    "a1",
    "b",
    "b1",
  ]);
  assert.equal(reorderBlocks(blocks, "a", "a1"), blocks);
  assert.equal(reorderBlocks(blocks, "missing", "a"), blocks);
});
