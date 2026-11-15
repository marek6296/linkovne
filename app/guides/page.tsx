import Link from "next/link";
import { Logo } from "@/components/logo";
import { GUIDES } from "@/lib/guides";
import { marketingMetadata } from "@/lib/seo";

export const metadata = marketingMetadata("/guides", "Link-in-bio guides for models & creator agencies", "Practical guides to creator pages, agency workflows, custom domains and traffic sources. Clear setup steps and current Linkovne plan limits.");

export default function Guides() {
  return <div className="min-h-dvh bg-[#f8f5f7]">
    <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
      <Link href="/" aria-label="linkovne home"><Logo className="h-7 w-auto" /></Link>
      <Link href="/register" className="btn-ink">Start free</Link>
    </header>
    <main className="mx-auto max-w-5xl px-6 py-16">
      <p className="font-mono text-sm font-bold text-pink-600 uppercase">Creator resources</p>
      <h1 className="mt-4 max-w-3xl font-grotesk text-4xl font-extrabold tracking-tight sm:text-5xl">Practical guides for models &amp; creator agencies</h1>
      <p className="mt-5 max-w-2xl text-lg leading-relaxed text-soft">Plan a page that visitors understand, keep creator profiles organised, and measure where your traffic comes from.</p>
      <div className="mt-12 grid gap-5 md:grid-cols-3">{GUIDES.map(g => <Link key={g.slug} href={`/guides/${g.slug}`} className="card p-6 transition hover:border-pink-400">
        <h2 className="text-xl font-bold">{g.title}</h2><p className="mt-4 text-sm leading-relaxed text-soft">{g.description}</p><span className="mt-6 block font-medium text-pink-600">Read guide →</span>
      </Link>)}</div>
      <p className="mt-12 text-sm text-soft">Written by Linkovne. These guides describe our own product and its limits. <Link href="/about" className="underline">About Linkovne</Link></p>
    </main>
  </div>;
}
