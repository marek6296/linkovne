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
const { orderProfiles, validProfileOrder } = load("lib/profile-order.ts");

test("saved profile order controls the default without changing the original list", () => {
  const profiles = Object.freeze([
    { id: "first-created", username: "first" },
    { id: "preferred", username: "preferred" },
    { id: "third", username: "third" },
  ]);
  const ordered = orderProfiles(profiles, [
    "preferred",
    "third",
    "first-created",
  ]);
  assert.equal(ordered[0].username, "preferred");
  assert.deepEqual(
    ordered.map(({ id }) => id),
    ["preferred", "third", "first-created"],
  );
  assert.equal(profiles[0].id, "first-created");
});

test("stale profile preferences ignore removed, foreign and duplicate IDs and retain new profiles", () => {
  const profiles = [{ id: "a" }, { id: "b" }, { id: "new" }];
  assert.deepEqual(
    orderProfiles(profiles, ["deleted", "b", "foreign", null, "b", 3]).map(
      ({ id }) => id,
    ),
    ["b", "a", "new"],
  );
  for (const malformed of [undefined, null, "b,a", { first: "b" }]) {
    assert.deepEqual(orderProfiles(profiles, malformed), profiles);
  }
});

test("saving profile order only accepts distinct IDs owned by the signed-in user", () => {
  const owned = ["a", "b", "new"];
  assert.equal(validProfileOrder(["b", "a"], owned), true);
  for (const invalid of [null, [], "a,b", ["a", "a"], ["foreign"], ["a", 2]]) {
    assert.equal(validProfileOrder(invalid, owned), false);
  }
  assert.deepEqual(
    orderProfiles(
      owned.map((id) => ({ id })),
      ["b", "a"],
    ).map(({ id }) => id),
    ["b", "a", "new"],
  );
});

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

test("profile typography uses bounded presets and keeps alignment specific to Spotlight", () => {
  const hero = resolveTheme("classic", { profileLayout: "hero", nameSize: "xl", handleSize: "lg", bioSize: "sm", profileTextAlign: "right" });
  assert.equal(hero.profileNameSize, "3.055rem");
  assert.equal(hero.profileHandleSize, "0.95rem");
  assert.equal(hero.profileBioSize, "0.85rem");
  assert.equal(hero.profileTextAlign, "right");
  for (const layout of ["centered", "compact"]) {
    assert.equal(resolveTheme("classic", { profileLayout: layout, profileTextAlign: "right" }).profileTextAlign, undefined);
  }
  const invalid = resolveTheme("classic", { nameSize: "999", handleSize: "constructor", bioSize: "toString", profileTextAlign: "justify" });
  assert.equal(invalid.profileNameSize, undefined);
  assert.equal(invalid.profileHandleSize, undefined);
  assert.equal(invalid.profileBioSize, undefined);
  assert.equal(invalid.profileTextAlign, undefined);
});

test("Spotlight uses safe cover corners while Portrait retains its chosen shape", () => {
  for (const shape of ["circle", "organic", "rounded"]) {
    assert.equal(resolveTheme("classic", { profileLayout: "hero", avatarShape: shape }).heroRadius, "24px");
  }
  assert.equal(resolveTheme("classic", { profileLayout: "hero", avatarShape: "square" }).heroRadius, "8px");
  assert.equal(resolveTheme("classic", { profileLayout: "centered", avatarShape: "circle" }).avatarRadius, "999px");
});

test("Free can publish explicit Off controls and retains basic profile typography", () => {
  const { designForPlan, lockedDesignFeatures } = load("lib/design-tiers.ts");
  const { PLANS } = load("lib/plans.ts");
  const design = { profileLayout: "hero", nameSize: "lg", handleSize: "sm", bioSize: "lg", profileTextAlign: "center", btnAnimation: "none", avatarFrame: "none", deskBg: "auto", bg: "solid", bgImage: "https://example.com/unused.jpg", avatarRingColor: "#ffffff" };
  assert.deepEqual(lockedDesignFeatures(design, PLANS.free), []);
  const clean = designForPlan(design, PLANS.free);
  assert.equal(clean.nameSize, "lg");
  assert.equal(clean.profileTextAlign, "center");
  assert.equal(clean.avatarFrame, "none");
  assert.equal(clean.btnAnimation, "none");
  assert.equal(clean.bgImage, undefined);
  assert.ok(lockedDesignFeatures({ btnAnimation: "glow", avatarFrame: "double", deskBg: "solid", bg: "image" }, PLANS.free).length === 4);
});

test("shared profile header renders saved typography for every layout", () => {
  const React = require("react");
  const { renderToStaticMarkup } = require("react-dom/server");
  const { ProfileHeader } = load("components/blocks/render.tsx");
  for (const profileLayout of ["hero", "centered", "compact"]) {
    const theme = resolveTheme("classic", {
      profileLayout, nameSize: "lg", handleSize: "xl", bioSize: "sm", profileTextAlign: "right",
    });
    const html = renderToStaticMarkup(React.createElement(ProfileHeader, {
      displayName: "Alex Morgan", username: "alex", bio: "Independent creator",
      avatarUrl: null, theme,
    }));
    assert.ok(html.includes(`font-size:${theme.profileNameSize}`));
    assert.ok(html.includes("font-size:1.1rem"));
    assert.ok(html.includes("font-size:0.85rem"));
    assert.equal(html.includes("text-align:right"), profileLayout === "hero");
  }
});

test("Free template catalogue is Paper and Mono without restricting saved custom layouts", () => {
  const { TEMPLATES } = load("lib/templates.ts");
  const { designForPlan } = load("lib/design-tiers.ts");
  const { PLANS } = load("lib/plans.ts");
  assert.deepEqual(TEMPLATES.filter(t => !t.premium).map(t => t.key).sort(), ["mono", "paper"]);
  assert.equal(designForPlan({profileLayout:"hero",nameSize:"xl",font:"serif"},PLANS.free).profileLayout,"hero");
});

test("profile video is paid and unsafe URLs never reach the renderer", () => {
  const { designForPlan, lockedDesignFeatures } = load("lib/design-tiers.ts");
  const { PLANS } = load("lib/plans.ts");
  const design = {bg:"image", bgVideo:"https://example.com/background.mp4", bgVideoPoster:"https://example.com/poster.jpg", avatarVideo:"https://example.com/avatar.webm", avatarVideoPoster:"https://example.com/photo.jpg"};
  for(const plan of [PLANS.pro, PLANS.business]) assert.equal(resolveTheme("classic",designForPlan(design,plan)).avatarVideo,design.avatarVideo);
  const free = designForPlan(design,PLANS.free);
  assert.equal(free.avatarVideo,undefined); assert.equal(free.bgVideo,undefined);
  assert.ok(lockedDesignFeatures(design,PLANS.free).includes("Profile video"));
  const unsafe=resolveTheme("classic",{bg:"image",bgVideo:"javascript:alert(1)",avatarVideo:"javascript:alert(1)"});
  assert.equal(unsafe.avatarVideo,undefined); assert.equal(unsafe.bgVideo,undefined);
});

test("Free keeps saved per-link motion but cannot add or change it", () => {
  const { hasNewButtonAnimation } = load("lib/design-tiers.ts");
  const old = [{id:"owned",config:{anim:"glow"}}];
  assert.equal(hasNewButtonAnimation(old,old),false);
  assert.equal(hasNewButtonAnimation([{id:"owned",config:{anim:"none"}}],old),false);
  assert.equal(hasNewButtonAnimation([{id:"owned",config:{anim:"pulse"}}],old),true);
  assert.equal(hasNewButtonAnimation([{id:"new",config:{anim:"glow"}}],old),true);
});
