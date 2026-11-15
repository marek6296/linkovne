import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Logo } from "@/components/logo";
import { Wordmark } from "@/components/wordmark";
import { COMPETITORS, COMPARE_SLUGS, getCompetitor } from "@/lib/compare";
import { jsonLd } from "@/lib/seo";
import { BRAND_TITLE, SITE_URL } from "@/lib/site";

export function generateStaticParams() {
  return COMPARE_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const c = getCompetitor(slug);
  if (!c) return { title: "Not found" };

  const title = `${c.searchName ?? c.name} alternative for models & agencies · ${BRAND_TITLE}`;
  const description = `Compare ${BRAND_TITLE} with ${c.searchName ?? c.name}: creator profiles, custom domains, analytics and plan limits. Official sources and clear reasons to choose either tool.`;

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: `/vs/${slug}` },
    openGraph: { title, description, type: "website", url: `${SITE_URL}/vs/${slug}` },
    twitter: { card: "summary_large_image", title, description },
  };
}

function Cell({ value, unconfirmed }: { value: boolean | string; unconfirmed?: boolean }) {
  if (typeof value === "boolean") {
    return (
      <span
        className={value ? "text-ok" : "text-faint"}
        aria-label={value ? "Yes" : "No"}
      >
        {value ? "✓" : "—"}
      </span>
    );
  }
  return (
    <span className="text-sm text-soft">
      {value}
      {unconfirmed && <span className="ml-1 text-faint">*</span>}
    </span>
  );
}

export default async function ComparePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const c = getCompetitor(slug);
  if (!c) notFound();

  const hasUnconfirmed = c.rows.some((r) => r.unconfirmed);
  const other = COMPARE_SLUGS.filter((s) => s !== slug).map((s) => COMPETITORS[s]);

  return (
    <div className="min-h-dvh bg-[#f8f5f7]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd({
        "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Compare alternatives", item: `${SITE_URL}/vs` },
          { "@type": "ListItem", position: 3, name: `${BRAND_TITLE} vs ${c.name}`, item: `${SITE_URL}/vs/${c.slug}` },
        ],
      }) }} />
      <header className="mx-auto flex w-full max-w-4xl items-center justify-between px-6 py-6">
        <Link href="/" aria-label="linkovne — home">
          <Logo className="h-7 w-auto" />
        </Link>
        <Link
          href="/register"
          className="gradient-button gradient-button--pink inline-flex items-center justify-center px-5 py-2.5 text-sm"
        >
          Start free
        </Link>
      </header>

      <main className="mx-auto max-w-4xl px-6 pb-24">
        <nav aria-label="Comparison navigation" className="pt-4 text-sm text-soft"><Link href="/vs" className="underline">← All creator-page comparisons</Link></nav>
        <section className="pt-8 pb-14 text-center sm:pt-14">
          <p className="font-mono text-sm font-bold tracking-wide text-pink-500 uppercase">
            Comparison
          </p>
          <h1 className="mt-3 font-grotesk text-4xl font-extrabold tracking-tight text-balance sm:text-5xl">
            {BRAND_TITLE} vs {c.name}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-soft sm:text-lg">
            {c.blurb}
          </p>
        </section>

        <section className="card overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-left">
            <thead>
              <tr className="border-b border-line">
                <th className="p-4 text-sm font-medium text-soft">Feature</th>
                <th className="p-4 text-sm font-bold text-ink">
                  {BRAND_TITLE}
                </th>
                <th className="p-4 text-sm font-medium text-soft">
                  {c.name}
                </th>
              </tr>
            </thead>
            <tbody>
              {c.rows.map((row) => (
                <tr key={row.feature} className="border-b border-line last:border-0">
                  <td className="p-4 text-sm text-ink">{row.feature}</td>
                  <td className="p-4">
                    <Cell value={row.ours} />
                  </td>
                  <td className="p-4">
                    <Cell value={row.theirs} unconfirmed={row.unconfirmed} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <p className="mt-4 text-xs text-faint">
          {hasUnconfirmed && "* Not independently confirmed at time of writing. "}
          Pricing and features checked against{" "}
          <a
            href={c.sourceUrl}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="underline hover:text-soft"
          >
            {c.sourceLabel}
          </a>{" "}
          on {c.verifiedOn}. Both products change over time — always confirm
          current details on their site before deciding.
        </p>

        {c.additionalSources?.map(source => <p key={source.url} className="mt-3 text-xs text-faint">Additional official source: <a href={source.url} className="underline">{source.label}</a></p>)}
        <p className="mt-4 text-sm text-soft">This comparison is published by Linkovne. Profile counts are not team seats. Prices use each provider’s listed currency; domain registration and plan inclusions differ.</p>

        <section className="mt-12 grid gap-5 sm:grid-cols-2" aria-label="Choose by workflow">
          <div className="card p-6"><h2 className="text-xl font-bold">When to consider Linkovne</h2><p className="mt-4 leading-7 text-soft">{c.chooseUs}</p></div>
          <div className="card p-6"><h2 className="text-xl font-bold">When to consider {c.name}</h2><p className="mt-4 leading-7 text-soft">{c.chooseThem}</p></div>
        </section>
        <section className="mt-16 text-center">
          <h2 className="font-grotesk text-2xl font-bold tracking-tight sm:text-3xl">
            Try {BRAND_TITLE} free — see for yourself
          </h2>
          <p className="mx-auto mt-3 max-w-md text-soft">
            No card required. Your page is live in about two minutes.
          </p>
          <Link
            href="/register"
            className="gradient-button gradient-button--dark gradient-button--blue mt-6 inline-flex items-center justify-center px-7 py-3.5 text-base"
          >
            Start here
          </Link>
        </section>

        {other.length > 0 && (
          <p className="mt-16 text-center text-sm text-faint">
            Also comparing:{" "}
            {other.map((o, i) => (
              <span key={o.slug}>
                {i > 0 && ", "}
                <Link
                  href={`/vs/${o.slug}`}
                  className="underline hover:text-soft"
                >
                  {BRAND_TITLE} vs {o.name}
                </Link>
              </span>
            ))}
          </p>
        )}
      </main>

      <footer className="mx-auto flex max-w-4xl flex-wrap items-center gap-x-5 gap-y-3 px-6 py-8 text-sm text-faint">
        <Wordmark />
        <nav className="ml-auto flex flex-wrap items-center gap-x-5 gap-y-2">
          <Link href="/guides" className="transition hover:text-ink">Creator guides</Link>
          <Link href="/about" className="transition hover:text-ink">About</Link>
          <Link href="/privacy" className="transition hover:text-ink">
            Privacy
          </Link>
          <Link href="/terms" className="transition hover:text-ink">
            Terms
          </Link>
        </nav>
      </footer>
    </div>
  );
}
