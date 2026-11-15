import Link from "next/link";
import { notFound } from "next/navigation";
import { Logo } from "@/components/logo";
import { GUIDES } from "@/lib/guides";
import { marketingMetadata, jsonLd } from "@/lib/seo";
import { SITE_URL, BRAND_TITLE } from "@/lib/site";

export const dynamicParams = false;
export function generateStaticParams() { return GUIDES.map(g => ({ slug: g.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = GUIDES.find(g => g.slug === slug);
  return guide ? marketingMetadata(`/guides/${slug}`, guide.title, guide.description) : { title: "Guide not found" };
}
export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const g = GUIDES.find(guide => guide.slug === slug);
  if (!g) notFound();
  const url = `${SITE_URL}/guides/${g.slug}`;
  const graph = { "@context": "https://schema.org", "@graph": [
    { "@type": "Article", "@id": `${url}#article`, headline: g.title, description: g.description, datePublished: g.updated, dateModified: g.updated, inLanguage: "en", mainEntityOfPage: url, author: { "@type": "Organization", name: BRAND_TITLE, url: `${SITE_URL}/about` }, publisher: { "@type": "Organization", "@id": `${SITE_URL}/#organization`, name: BRAND_TITLE, url: SITE_URL, logo: { "@type": "ImageObject", url: `${SITE_URL}/lk-mark.jpg` } }, image: `${SITE_URL}/opengraph-image`, },
    { "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Guides", item: `${SITE_URL}/guides` },
      { "@type": "ListItem", position: 3, name: g.title, item: url },
    ] },
    { "@type": "FAQPage", mainEntity: g.faqs.map(f => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
  ] };
  return <div className="min-h-dvh bg-[#f8f5f7]">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(graph) }} />
    <header className="mx-auto flex max-w-4xl items-center justify-between px-6 py-6"><Link href="/" aria-label="linkovne home"><Logo className="h-7 w-auto" /></Link><Link href="/register" className="btn-ink">Start free</Link></header>
    <main className="mx-auto max-w-3xl px-6 pt-8 pb-20">
      <nav aria-label="Breadcrumb" className="text-sm text-soft"><Link href="/">Home</Link> / <Link href="/guides">Guides</Link></nav>
      <article>
        <h1 className="mt-8 font-grotesk text-4xl leading-tight font-extrabold tracking-tight sm:text-5xl">{g.title}</h1>
        <p className="mt-4 text-sm text-soft">By <Link href="/about" className="underline">Linkovne</Link> · Updated <time dateTime={g.updated}>{new Date(`${g.updated}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}</time></p>
        <p className="mt-8 rounded-2xl border border-pink-200 bg-white p-6 text-lg leading-relaxed">{g.answer}</p>
        <nav aria-label="On this page" className="my-10 rounded-2xl border border-line p-6"><p className="mb-3 font-bold">On this page</p><ul className="space-y-2 text-sm">{g.sections.map((s,i) => <li key={s.heading}><a href={`#section-${i+1}`} className="underline decoration-line underline-offset-4">{s.heading}</a></li>)}</ul></nav>
        {g.sections.map((s,i) => <section key={s.heading} id={`section-${i+1}`} className="mt-12 scroll-mt-8">
          <h2 className="font-grotesk text-2xl font-bold">{s.heading}</h2>
          {s.paragraphs.map(p => <p key={p} className="mt-5 text-base leading-8 text-soft">{p}</p>)}
          {s.steps && <ol className="mt-6 list-decimal space-y-3 pl-6 text-base leading-7">{s.steps.map(step => <li key={step}>{step}</li>)}</ol>}
        </section>)}
        <section className="mt-14"><h2 className="font-grotesk text-2xl font-bold">Frequently asked questions</h2>{g.faqs.map(f => <details key={f.q} className="mt-4 rounded-xl border border-line bg-white p-5"><summary className="cursor-pointer font-medium">{f.q}</summary><p className="mt-4 leading-7 text-soft">{f.a}</p></details>)}</section>
      </article>
      <aside className="mt-14 rounded-2xl bg-neutral-900 p-7 text-white"><h2 className="font-grotesk text-2xl font-bold">Put your links in one place</h2><p className="mt-3 leading-7 text-white/80">Start with a free page, then choose Pro or Business for the workflow you need.</p><div className="mt-5 flex flex-wrap gap-5"><Link href="/register" className="rounded-full bg-white px-5 py-3 font-medium text-neutral-900">Create your page</Link><Link href="/#pricing" className="py-3 underline">See plans</Link></div></aside>
      <nav aria-label="Related guides" className="mt-12"><h2 className="text-xl font-bold">Related guides</h2><ul className="mt-4 space-y-3">{GUIDES.filter(other => other.slug !== slug).map(other => <li key={other.slug}><Link href={`/guides/${other.slug}`} className="text-pink-700 underline">{other.title}</Link></li>)}</ul></nav>
      <p className="mt-10 text-sm text-soft">Questions? <a href="mailto:support@linkovne.com" className="underline">Contact support</a>. Compare <Link href="/vs/linktree" className="underline">Linkovne and Linktree</Link>.</p>
    </main>
  </div>;
}
