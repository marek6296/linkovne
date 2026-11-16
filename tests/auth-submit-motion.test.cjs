const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const mod = { exports: {} };
const source = ts.transpileModule(fs.readFileSync('lib/auth-submit-motion.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
new Function('module', 'exports', source)(mod, mod.exports);
const { submitAfterFill } = mod.exports;

test('auth request starts only after the button fill finishes', async () => {
  let finish;
  const finished = new Promise(resolve => { finish = resolve; });
  let calls = 0;
  const result = submitAfterFill({ animate: () => ({ finished }) }, false, async () => { calls++; return 'signed-in'; });
  await Promise.resolve();
  assert.equal(calls, 0);
  finish();
  assert.equal(await result, 'signed-in');
  assert.equal(calls, 1);
});

test('reduced motion and unsupported animation never delay authentication', async () => {
  for (const [fill, reduced] of [[{ animate: () => { throw Error('must not animate'); } }, true], [null, false], [{}, false]]) {
    assert.equal(await submitAfterFill(fill, reduced, async () => 'done'), 'done');
  }
});

test('leaving during the fill cancels the pending auth request', async () => {
  let calls = 0;
  const fill = { animate: () => ({ finished: Promise.reject(new Error('cancelled')) }) };
  assert.equal(await submitAfterFill(fill, false, async () => { calls++; }), undefined);
  assert.equal(calls, 0);
});

test('server errors remain available to the form after the animation', async () => {
  const fill = { animate: () => ({ finished: Promise.resolve() }) };
  assert.deepEqual(await submitAfterFill(fill, false, async () => ({ error: 'Incorrect email or password.' })), { error: 'Incorrect email or password.' });
});
