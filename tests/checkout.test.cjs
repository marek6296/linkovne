const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
function load(create) {
  const m = { exports: {} };
  const mocks = {
    '@/lib/stripe': { stripe: { checkout: { sessions: { create } } }, PLAN_PRICE: { pro: 'price_pro', business: 'price_business' } },
    '@/lib/site': { SITE_URL: 'https://linkovne.com' },
  };
  const code = ts.transpileModule(fs.readFileSync('lib/checkout.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  new Function('require', 'module', 'exports', code)(key => mocks[key], m, m.exports);
  return m.exports;
}
test('promo and ordinary subscription checkout collect a payment method for future renewals', async () => {
  for (const promotionCodeId of [undefined, 'promo_free_three_months']) {
    let request;
    const api = load(async params => { request = params; return { url: 'https://checkout.stripe.com/test' }; });
    const result = await api.createSubscriptionCheckout({ userId: 'user', plan: 'pro', promotionCodeId });
    assert.ok(result.url);
    assert.equal(request.mode, 'subscription');
    assert.equal(request.payment_method_collection, 'always');
    if (promotionCodeId) { assert.deepEqual(request.discounts, [{ promotion_code: promotionCodeId }]); assert.equal(request.allow_promotion_codes, undefined); }
    else assert.equal(request.allow_promotion_codes, true);
    assert.equal(request.subscription_data.cancel_at, undefined);
  }
});
test('stale-customer retry keeps the promo and mandatory payment method', async () => {
  const calls = [];
  const api = load(async params => { calls.push(params); if (calls.length === 1) throw { code: 'resource_missing' }; return { url: 'https://checkout.stripe.com/retry' }; });
  assert.ok((await api.createSubscriptionCheckout({ userId: 'user', email: 'test@example.com', stripeCustomerId: 'cus_old', plan: 'pro', promotionCodeId: 'promo_free', requirePromo: true })).url);
  assert.equal(calls.length, 2);
  assert.equal(calls[1].customer, undefined);
  assert.equal(calls[1].payment_method_collection, 'always');
  assert.deepEqual(calls[1].discounts, [{ promotion_code: 'promo_free' }]);
});
