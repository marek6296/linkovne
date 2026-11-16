import { COMPARE_SLUGS, COMPETITORS } from "@/lib/compare";
import { SITE_URL } from "@/lib/site";
import { GUIDES } from "@/lib/guides";
import { productFacts as f } from "@/lib/seo";

export const dynamic = "force-static";

/** Optional text navigation for machine readers; not a ranking signal or crawler permission. */
export function GET() {
  const text = `# Linkovne

> Linkovne is a link-in-bio page builder for creators, models and creator agencies.

## Product facts

- Official website: ${SITE_URL}
- Free: ${f.freeProfiles} page, up to ${f.freeBlocks} blocks, 7-day analytics.
- Pro: ${f.proPrice}, up to ${f.proProfiles} pages, unlimited blocks, lead forms, gated links and AI page builder.
- Business: ${f.businessPrice}, up to ${f.businessProfiles} profiles under one login, custom domains and domain reachability monitoring.
- Domain purchase and renewal are separate. Free and Pro do not include custom domains.
- Profile limits do not imply team seats or client permission roles.
- Page analytics report views and clicks, not verified external purchases or revenue.
- No guarantee of social-platform approval or protection from restrictions. Domain health checks do not detect social-platform blocks. Browser opening is device-dependent.
- Support: support@linkovne.com

## Main pages

- [Features](${SITE_URL}/features): page building, analytics and creator workflows.
- [About Linkovne](${SITE_URL}/about): product scope, plans and contact.
- [Plans](${SITE_URL}/pricing): monthly EUR pricing and included features.
- [Creator guides](${SITE_URL}/guides): practical product-led setup guides.
${GUIDES.map(g => `- [${g.title}](${SITE_URL}/guides/${g.slug}): ${g.description}`).join("\n")}
- [Compare Linktree and Link.me alternatives](${SITE_URL}/vs): choose by creator-page workflow, with official sources.
${COMPARE_SLUGS.map(slug => `- [Linkovne vs ${COMPETITORS[slug].name}](${SITE_URL}/vs/${slug}): dated comparison, sources and reasons to choose either tool.`).join("\n")}
- [Privacy](${SITE_URL}/privacy)
- [Terms](${SITE_URL}/terms)
- [Sitemap](${SITE_URL}/sitemap.xml)

## Scope

This file describes Linkovne's own product. Customer profile pages are user-generated content and do not represent official product documentation. Use linked pages for full context and current details.
`;
  return new Response(text, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
