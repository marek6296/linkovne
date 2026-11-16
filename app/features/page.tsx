import Link from "next/link";
import { LandingNav } from "@/components/landing/landing-interactive";
import { marketingMetadata, productFacts as f } from "@/lib/seo";
import "@/components/landing/landing.css";

export const metadata = marketingMetadata("/features", "Link-in-bio features for creators & agencies", "Explore Linkovne profiles, page design, link analytics, gated links and Business custom domains. Find the right tools for your creator workflow.");
const features = [
  { title: "Your links, your page", text: "Bring your social accounts and approved destinations together on one page. Choose a template, add your own images and customise your page design. Start with a free profile.", href: "/guides/link-in-bio-for-models", link: "Plan your creator page" },
  { title: "Visits, clicks and traffic sources", text: "See how people reach your page and which links they open. Use separate tracked URLs for main and backup social accounts. Creator-page analytics are cookie-free; link clicks do not verify sales on external platforms.", href: "/guides/agency-link-in-bio", link: "Organise traffic sources" },
  { title: "Multiple profiles in one account", text: `Keep each creator's identity and destinations separate. Pro supports up to ${f.proProfiles} profiles and Business up to ${f.businessProfiles}. These are pages under one login, not separate team seats or client permissions.`, href: "/guides/agency-link-in-bio", link: "Read the agency guide" },
  { title: "Custom domains on Business", text: "Share a domain you own instead of a Linkovne address. Business includes custom-domain connection and reachability monitoring. Register and renew the domain separately. Monitoring does not detect every social-platform restriction.", href: "/guides/custom-domain-link-in-bio", link: "Understand custom domains" },
  { title: "Gated links and contact forms", text: "Pro and Business add confirmation gates, code-protected links and lead forms. Use clear labels so visitors understand where a link leads. Gates do not override platform policies or guarantee protection from bans.", href: "/pricing", link: "Compare included features" },
  { title: "Tools for AI creator workflows", text: "Give each virtual persona a recognisable page, clear content disclosures and its own tracked sources. The AI page builder helps draft a page; Linkovne does not generate AI models or their images.", href: "/guides/link-in-bio-for-ai-creators", link: "Read the AI creator guide" },
];
export default function FeaturesPage() {
  return <div className="landing min-h-dvh pt-6"><LandingNav onLanding={false} /><main className="landing-width py-20">
    <h1 className="landing-section-title" style={{ fontSize: "clamp(40px,4.8vw,68px)", fontWeight: 750, letterSpacing: "-.045em", lineHeight: 1.04 }}>One place for your creator links</h1>
    <p className="mx-auto mt-5 max-w-2xl text-center text-lg leading-8 text-soft">Build a page people recognise, keep your creator profiles organised, and see where your traffic comes from.</p>
    <div className="mt-14 grid gap-6 md:grid-cols-2">{features.map(feature => <section key={feature.title} className="rounded-3xl border border-line bg-white p-8"><h2 style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-.025em", lineHeight: 1.25 }}>{feature.title}</h2><p className="mt-4 leading-8 text-soft">{feature.text}</p><Link href={feature.href} className="mt-5 inline-block font-medium underline underline-offset-4">{feature.link} →</Link></section>)}</div>
    <nav aria-label="Get started" className="mt-14 flex flex-wrap justify-center gap-5"><Link href="/register" className="landing-button landing-button-blue">Create your free page</Link><Link href="/pricing" className="landing-button">See plans & pricing</Link></nav>
    <nav aria-label="More information" className="mt-12 flex flex-wrap justify-center gap-6 text-sm underline"><Link href="/about">About Linkovne</Link><Link href="/vs">Compare alternatives</Link><Link href="/guides">Creator guides</Link><Link href="/privacy">Privacy</Link></nav>
  </main></div>;
}
