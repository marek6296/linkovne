# Google visibility and conversion measurement

Goal: Finish the existing USA Google Search trial and make acquisition measurable without tracking creator-page visitors.

Approved scope: Marek requested all proposed Ads, Search Console and website SEO work. Existing Next.js site; no landing redesign, budget increase or paid external services.

- [ ] Audit Ads eligibility, destination, language, networks, dates and bidding. Preserve EUR 0.80/day, EUR 0.50 CPC and Nov 28 end.
- [ ] Create an onboarding-completed Sign-up conversion, one per ad interaction; no guessed purchase event or enhanced customer data.
- [ ] Add consent-gated Google Ads measurement only to our marketing/onboarding pages. Block Google before opt-in; support rejection and withdrawal. Count only a successful server-confirmed onboarding, retain a random event ID for deduplication and exclude profile/custom-domain traffic. Update privacy disclosure.
- [ ] Verify Search Console sitemap, URL inspection and available search queries. Request crawl for relevant unindexed product content.
- [ ] Add a useful AI creator setup guide using current product limits and existing guide/schema/sitemap system. Fix any demonstrated metadata/crawl defects.
- [ ] Test tracking boundaries and conversion deduplication, run existing tests/typecheck/build and live SEO checks. Commit/push only these changes and verify deployment. Update Obsidian records.

Validation: unit tests for consent, URL sanitization, scope and event retry/dedup; browser checks of opt-in/opt-out and actual Google requests; live crawler/metadata checks. Google may take days to index content and conversion status updates asynchronously.
