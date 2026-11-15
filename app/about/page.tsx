import Link from "next/link";
import { Logo } from "@/components/logo";
import { marketingMetadata, productFacts as f } from "@/lib/seo";

export const metadata = marketingMetadata("/about", "About Linkovne", "Linkovne is a link-in-bio page builder for creators and agencies. Learn what it offers, how plans differ and how to contact support.");
export default function About() {
  return <div className="min-h-dvh bg-[#f8f5f7]">
    <header className="mx-auto flex max-w-4xl items-center justify-between px-6 py-6"><Link href="/" aria-label="linkovne home"><Logo className="h-7 w-auto" /></Link><Link href="/register" className="btn-ink">Start free</Link></header>
    <main className="mx-auto max-w-3xl px-6 py-14">
      <h1 className="font-grotesk text-4xl font-extrabold">About Linkovne</h1>
      <p className="mt-7 text-lg leading-8 text-soft">Linkovne is a link-in-bio page builder for creators, models and agencies. It brings links, social profiles and contact options together on a single page, with tools to manage several creator profiles from one login.</p>
      <h2 className="mt-12 text-2xl font-bold">What you can use it for</h2>
      <ul className="mt-5 list-disc space-y-3 pl-6 leading-7 text-soft"><li>Build and publish a page with your own design and approved destinations.</li><li>Measure page views, clicks and traffic sources with cookie-free page analytics.</li><li>Use lead forms, confirmation gates and code-protected VIP links on Pro and Business.</li><li>Connect a domain you own on Business, with domain reachability monitoring.</li></ul>
      <h2 className="mt-12 text-2xl font-bold">Plans at a glance</h2>
      <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[340px] text-left text-sm"><caption className="sr-only">Current Linkovne monthly plans</caption><thead><tr className="border-b border-line"><th scope="col" className="py-3">Plan</th><th scope="col">Price</th><th scope="col">Profiles</th><th scope="col">Custom domains</th></tr></thead><tbody>{[["Free","€0",f.freeProfiles,"No"],["Pro",f.proPrice,f.proProfiles,"No"],["Business",f.businessPrice,f.businessProfiles,"Yes"]].map(row => <tr key={row[0]} className="border-b border-line">{row.map((cell,i) => i === 0 ? <th scope="row" key={i} className="py-4">{cell}</th> : <td key={i}>{cell}</td>)}</tr>)}</tbody></table></div>
      <p className="mt-5 leading-7 text-soft">Domain registration and renewals are separate. Profile counts are not team seat or client permission limits. <Link href="/#pricing" className="underline">See plan details</Link>.</p>
      <h2 className="mt-12 text-2xl font-bold">Clear expectations</h2><p className="mt-5 leading-8 text-soft">Linkovne does not guarantee social-platform approval, prevent bans or verify purchases on external services. Browser-opening tools depend on the visitor’s device and app. Domain monitoring checks reachability, not whether a platform has restricted a link.</p>
      <h2 className="mt-12 text-2xl font-bold">Get in touch</h2><p className="mt-5 leading-8 text-soft">For product questions, support or corrections, email <a href="mailto:support@linkovne.com" className="underline">support@linkovne.com</a>. Find Linkovne on <a href="https://www.instagram.com/linkovne/" className="underline">Instagram</a>.</p>
      <nav className="mt-10 flex flex-wrap gap-5 text-sm underline"><Link href="/guides">Creator guides</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></nav>
    </main>
  </div>;
}
