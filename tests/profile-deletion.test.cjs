const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");

function setup({ owner = "owner", error = null, deleted = true } = {}) {
  const mutations = [],
    paths = [],
    filters = [];
  const profile = { id: "profile", owner_id: owner, username: "mio" };
  const client = {
    auth: { getUser: async () => ({ data: { user: { id: "owner" } } }) },
    from(table) {
      let deleting = false;
      const query = {
        select() {
          return query;
        },
        eq(key, value) {
          if (deleting) filters.push([key, value]);
          return query;
        },
        delete() {
          deleting = true;
          mutations.push(table);
          return query;
        },
        maybeSingle: async () =>
          deleting
            ? { data: deleted ? { id: "profile" } : null, error }
            : { data: profile },
        then(resolve) {
          resolve({ error });
        },
      };
      return query;
    },
  };
  const source = ts.transpileModule(
    fs.readFileSync("app/dashboard/settings/actions.ts", "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    },
  ).outputText;
  const mod = { exports: {} };
  new Function("require", "module", "exports", source)(
    (name) => {
      if (name === "@/lib/supabase/server")
        return { createClient: async () => client };
      if (name === "next/cache")
        return { revalidatePath: (path) => paths.push(path) };
      if (name === "next/navigation")
        return {
          redirect: (path) => {
            throw new Error(`redirect:${path}`);
          },
        };
      if (name === "@/lib/plans") return {};
      throw new Error(name);
    },
    mod,
    mod.exports,
  );
  const remove = (name) => {
    const form = new FormData();
    if (name !== undefined) form.set("username", name);
    return mod.exports.deleteProfile("profile", undefined, form);
  };
  return { remove, mutations, paths, filters };
}

test("profile deletion requires the current username on the server", async () => {
  for (const name of [undefined, "", "another-profile"]) {
    const s = setup();
    assert.ok((await s.remove(name)).error);
    assert.deepEqual(s.mutations, []);
  }
});
test("a foreign profile cannot be deleted even with a matching name", async () => {
  const s = setup({ owner: "someone-else" });
  await assert.rejects(s.remove("mio"), /redirect:\/dashboard/);
  assert.deepEqual(s.mutations, []);
});
test("failed or unmatched deletion returns an error without redirecting", async () => {
  for (const options of [
    { error: { message: "failed" } },
    { deleted: false },
  ]) {
    const s = setup(options);
    assert.ok((await s.remove("mio")).error);
    assert.deepEqual(s.paths, []);
  }
});
test("confirmed deletion targets one owned profile and invalidates its public page", async () => {
  const s = setup();
  await assert.rejects(s.remove("mio"), /redirect:\/dashboard/);
  assert.deepEqual(s.mutations, ["profiles"]);
  assert.deepEqual(s.filters, [
    ["id", "profile"],
    ["owner_id", "owner"],
  ]);
  assert.ok(s.paths.includes("/mio"));
});
