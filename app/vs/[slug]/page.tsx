import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Logo } from "@/components/logo";
import { Wordmark } from "@/components/wordmark";
import { COMPETITORS, COMPARE_SLUGS } from "@/lib/compare";
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
  const c = COMPETITORS[slug];
  if (!c) return { title: "Not found" };

  const title = `${BRAND_TITLE} vs ${c.name} — which link in bio tool fits you?`;
  const description = `A feature-by-feature comparison of ${BRAND_TITLE} and ${c.name}: pricing, custom domains, analytics privacy and link protection — so you can pick with your eyes open.`;

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: `/vs/${slug}` },
    openGraph: { title, description, type: "website" },
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
  const c = COMPETITORS[slug];
  if (!c) notFound();

  const hasUnconfirmed = c.rows.some((r) => r.unconfirmed);
  const other = COMPARE_SLUGS.filter((s) => s !== slug).map((s) => COMPETITORS[s]);

  return (
    <div className="min-h-dvh bg-[#f8f5f7]">
      <header className="mx-auto flex w-full max-w-4xl items-center justify-between px-6 py-6">
        <Link href="/" aria-label="Linkovne — home">
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
