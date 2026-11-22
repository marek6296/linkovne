const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
function load(create, extra = {}) {
  const m = { exports: {} };
  const mocks = {
    '@/lib/stripe': { stripe: { checkout: { sessions: { create } }, ...extra }, PLAN_PRICE: { pro: 'price_pro', business: 'price_business' } },
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
    else { assert.equal(request.allow_promotion_codes, undefined); assert.equal(request.discounts, undefined); }
    assert.equal(request.subscription_data.trial_period_days, undefined);
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

test('codes are entered only on our site: Stripe Checkout never shows its own promo field', async () => {
  for (const promotionCodeId of [undefined, 'promo_x']) {
    let request;
    const api = load(async params => { request = params; return { url: 'https://checkout.stripe.com/x' }; });
    await api.createSubscriptionCheckout({ userId: 'user', plan: 'pro', promotionCodeId });
    assert.notEqual(request.allow_promotion_codes, true);
  }
});
test('trial promo (PRO2) adds trial days with the discount and still collects a card', async () => {
  let request;
  const api = load(async params => { request = params; return { url: 'https://checkout.stripe.com/pro2' }; });
  const result = await api.createSubscriptionCheckout({ userId: 'user', email: 'new@example.com', plan: 'pro', promotionCodeId: 'promo_pro2', requirePromo: true, trialDays: 31, firstTimeOnly: true });
  assert.ok(result.url);
  assert.equal(request.subscription_data.trial_period_days, 31);
  assert.deepEqual(request.discounts, [{ promotion_code: 'promo_pro2' }]);
  assert.equal(request.payment_method_collection, 'always');
  assert.equal(request.customer_email, 'new@example.com');
  assert.match(request.custom_text.submit.message, /won't be charged today/);
  assert.match(request.custom_text.submit.message, /31-day free trial/);
});
test('trial days are ignored without a promo code and clamped to sane values', async () => {
  let request;
  const api = load(async params => { request = params; return { url: 'https://checkout.stripe.com/t' }; });
  await api.createSubscriptionCheckout({ userId: 'user', plan: 'pro', trialDays: 31 });
  assert.equal(request.subscription_data.trial_period_days, undefined);
  await api.createSubscriptionCheckout({ userId: 'user', plan: 'pro', promotionCodeId: 'p', trialDays: 400 });
  assert.equal(request.subscription_data.trial_period_days, undefined);
  assert.equal(api.trialDaysFromMetadata({ trial_days: '31' }), 31);
  assert.equal(api.trialDaysFromMetadata({ trial_days: '0' }), null);
  assert.equal(api.trialDaysFromMetadata({ trial_days: '91' }), null);
  assert.equal(api.trialDaysFromMetadata({ trial_days: '3x' }), null);
  assert.equal(api.trialDaysFromMetadata({}), null);
  assert.equal(api.trialDaysFromMetadata(null), null);
});
test('new-customers-only code is refused for a customer with any past subscription', async () => {
  let created = 0;
  const api = load(async () => { created++; return { url: 'https://checkout.stripe.com/no' }; }, { subscriptions: { list: async (q) => { assert.equal(q.status, 'all'); return { data: [{ id: 'sub_old' }] }; } } });
  const result = await api.createSubscriptionCheckout({ userId: 'user', stripeCustomerId: 'cus_old', plan: 'pro', promotionCodeId: 'promo_pro2', requirePromo: true, trialDays: 31, firstTimeOnly: true });
  assert.equal(result.status, 400);
  assert.match(result.error, /new subscribers only/);
  assert.equal(created, 0);
});
test('new-customers-only code works for a stored customer without history', async () => {
  let request;
  const api = load(async params => { request = params; return { url: 'https://checkout.stripe.com/ok' }; }, { subscriptions: { list: async () => ({ data: [] }) } });
  const result = await api.createSubscriptionCheckout({ userId: 'user', stripeCustomerId: 'cus_fresh', plan: 'pro', promotionCodeId: 'promo_pro2', trialDays: 31, firstTimeOnly: true });
  assert.ok(result.url);
  assert.equal(request.customer, 'cus_fresh');
});
test('a Stripe rejection of a first-time code is not retried as a brand-new customer', async () => {
  const calls = [];
  const api = load(async params => { calls.push(params); throw { code: 'promotion_code_restricted', param: 'customer' }; }, { subscriptions: { list: async () => ({ data: [] }) } });
  const result = await api.createSubscriptionCheckout({ userId: 'user', email: 'x@example.com', stripeCustomerId: 'cus_paid_before', plan: 'pro', promotionCodeId: 'promo_pro2', trialDays: 31, firstTimeOnly: true });
  assert.equal(calls.length, 1);
  assert.equal(result.status, 400);
});
