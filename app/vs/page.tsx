import Link from "next/link";
import { Logo } from "@/components/logo";
import { COMPARE_SLUGS, COMPETITORS } from "@/lib/compare";
import { jsonLd, marketingMetadata } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";

export const metadata = marketingMetadata("/vs", "Linktree & Link.me alternatives for models and agencies", "Compare Linkovne with Linktree, Link.me, Beacons, AllMyLinks and hoo.be. Check creator profiles, custom domains, prices and workflow differences with official sources.");

export default function Comparisons() {
  const graph = { "@context": "https://schema.org", "@type": "CollectionPage", name: "Creator link-in-bio comparisons", url: `${SITE_URL}/vs`, mainEntity: { "@type": "ItemList", itemListElement: COMPARE_SLUGS.map((slug,i) => ({ "@type": "ListItem", position: i+1, name: `Linkovne vs ${COMPETITORS[slug].name}`, url: `${SITE_URL}/vs/${slug}` })) } };
  return <div className="min-h-dvh bg-[#f8f5f7]">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(graph) }} />
    <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6"><Link href="/" aria-label="linkovne home"><Logo className="h-7 w-auto" /></Link><Link href="/register" className="btn-ink">Start free</Link></header>
    <main className="mx-auto max-w-5xl px-6 pt-10 pb-20">
      <p className="font-mono text-sm font-bold tracking-wide text-pink-600 uppercase">Choose your creator-page workflow</p>
      <h1 className="mt-4 max-w-4xl font-grotesk text-4xl leading-tight font-extrabold tracking-tight sm:text-5xl">Linktree and Link.me alternatives for models &amp; creator agencies</h1>
      <p className="mt-6 max-w-3xl text-lg leading-8 text-soft">Looking for a different link-in-bio tool? Compare the work you need to do: publish one page, manage several creators, use your own domain, or run a broader commerce and social toolkit.</p>
      <p className="mt-4 max-w-3xl text-sm leading-7 text-soft">Published by Linkovne. Each comparison links to the provider’s official documentation and shows when it was checked. Prices, currencies and plan scopes differ; unverified details are marked.</p>
      <section className="mt-12 grid gap-5 md:grid-cols-2" aria-label="Compare providers">{COMPARE_SLUGS.map(slug => { const c=COMPETITORS[slug]; return <Link key={slug} href={`/vs/${slug}`} className="card p-7 transition hover:border-pink-400"><h2 className="text-2xl font-bold">Linkovne vs {c.searchName ?? c.name}</h2><p className="mt-4 leading-7 text-soft">{c.blurb}</p><span className="mt-5 inline-block font-medium text-pink-600">Compare features and fit →</span></Link>; })}</section>
      <section className="mt-16 max-w-3xl"><h2 className="font-grotesk text-3xl font-bold">Questions to ask before switching</h2><ol className="mt-6 list-decimal space-y-4 pl-6 leading-8 text-soft"><li>How many creator profiles can you manage, and do you need separate staff logins? Profiles and team seats are different things.</li><li>Do you need a domain you own? Check the plan, registration cost and who controls DNS and renewal.</li><li>Do you need page visits and click sources, or confirmed sales attribution? External purchases need destination data.</li><li>Do you need only a page, or also a store, social publishing and messaging automations? Compare what you will actually use.</li></ol></section>
      <aside className="mt-14 rounded-2xl bg-neutral-900 p-8 text-white"><h2 className="text-2xl font-bold">Try the page before moving your audience</h2><p className="mt-4 max-w-2xl leading-7 text-white/80">Build a free Linkovne page, test your destinations on a phone, then decide whether Pro or Business fits. Keep your existing link working while you review the new page.</p><div className="mt-6 flex flex-wrap gap-5"><Link href="/register" className="rounded-full bg-white px-6 py-3 font-medium text-neutral-900">Create a free page</Link><Link href="/#pricing" className="py-3 underline">Compare Linkovne plans</Link></div></aside>
      <nav className="mt-12 flex flex-wrap gap-6 text-sm underline"><Link href="/guides">Setup guides</Link><Link href="/about">About Linkovne</Link><a href="mailto:support@linkovne.com">Contact support</a></nav>
    </main>
  </div>;
}
