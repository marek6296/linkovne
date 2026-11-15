import { productFacts as f } from "@/lib/seo";

export type Guide = {
  slug: string;
  title: string;
  description: string;
  updated: string;
  answer: string;
  sections: { heading: string; paragraphs: string[]; steps?: string[] }[];
  faqs: { q: string; a: string }[];
};

/** Product-led reference content: visible HTML and machine summaries share these facts. */
export const GUIDES: Guide[] = [
  {
    slug: "link-in-bio-for-models",
    title: "Link in bio for models: a practical setup guide",
    description: "Build a clear link page for your portfolio, social accounts and enquiries. Plan your links, protect private destinations and measure traffic sources.",
    updated: "2026-11-15",
    answer: "A model's link-in-bio page gives visitors one place to find a portfolio, social profiles and contact options. Linkovne provides a free starter page; Pro adds lead forms and gated links, while Business adds custom domains.",
    sections: [
      {
        heading: "Give every visitor a clear next step",
        paragraphs: ["Start with the action you want a new visitor to take: view your portfolio, contact you about work, or find a social channel. Put that action first. A long list of equally prominent buttons makes the visitor decide what matters on your behalf.", "Use recognisable labels such as ‘View my portfolio’ or ‘Work enquiries’. Check the page on a phone before adding the URL to your Instagram or TikTok bio. A visitor should recognise whose page it is and understand where each link leads without opening every destination."],
        steps: ["Create a profile with a consistent name, photo and short bio.", "Add your primary destination first, then supporting social links.", "Use a contact form on Pro or Business if you want enquiries collected in your dashboard.", "Publish the page and open the published URL in a signed-out browser.", "Test every button from a phone, including links opened inside your social apps."],
      },
      {
        heading: "Separate public information from restricted destinations",
        paragraphs: ["Use a confirmation gate when a visitor should make an explicit choice before leaving your page. A VIP link protected by a code serves a different purpose: someone needs the code to unlock that destination. Pro and Business include both tools.", "A confirmation step is not identity verification, and a code should not be treated as a replacement for access control on the destination service. Linkovne does not guarantee that a social platform will accept a page or prevent an account restriction. Keep the page and its destinations consistent with each platform's rules."],
      },
      {
        heading: "Find out which social account sends useful traffic",
        paragraphs: ["Create separate tracked URLs for different accounts, even when both accounts are on Instagram. Give each source a name you will recognise later. For example, label one source ‘instagram_main’ and another ‘instagram_work’; a source parameter can look like ?s=instagram_main.", "Compare visits and link clicks by source in the analytics dashboard. Those counts tell you how visitors use your page. They do not prove that someone bought a subscription or completed an external checkout: revenue attribution needs data from that destination."],
      },
      {
        heading: "Choose the smallest plan that fits your workflow",
        paragraphs: [`Free includes ${f.freeProfiles} page, up to ${f.freeBlocks} blocks and 7-day analytics. Pro costs ${f.proPrice} and supports up to ${f.proProfiles} pages, unlimited blocks, lead forms, an AI page builder and gated links. Business costs ${f.businessPrice} and supports up to ${f.businessProfiles} profiles plus custom domains.`, "Start by making the page useful, then upgrade for a feature you actually need. Connecting a domain requires Business and a domain you own; buying or renewing that domain is separate from the Linkovne subscription."],
      },
    ],
    faqs: [
      { q: "Can I use Linkovne for a modelling portfolio?", a: "Yes. You can link to your portfolio, agencies, social profiles and contact destinations from one page. The Free plan supports basic link, headline, text and social blocks; Pro and Business add more block types and lead forms." },
      { q: "Will a gated link prevent an Instagram restriction?", a: "No. Gates help visitors choose whether to continue. They do not override platform policies or guarantee that a link or account will remain unrestricted." },
      { q: "Can I start without paying?", a: `Yes. Free includes ${f.freeProfiles} page with up to ${f.freeBlocks} blocks and basic analytics. Custom domains require Business.` },
    ],
  },
  {
    slug: "agency-link-in-bio",
    title: "Link-in-bio management for creator agencies",
    description: "Organise multiple creator profiles, name tracked links consistently and choose between Pro and Business without confusing profiles with team seats.",
    updated: "2026-11-15",
    answer: `Linkovne lets an agency manage several creator pages under one login. Pro supports up to ${f.proProfiles} pages at ${f.proPrice}; Business supports up to ${f.businessProfiles} profiles at ${f.businessPrice} and adds custom domains. These limits describe profiles, not team seats or client permission roles.`,
    sections: [
      {
        heading: "One creator, one clear profile",
        paragraphs: ["Give each creator a separate profile with their own public name, image, links and design. This keeps destinations and page analytics easier to interpret. Avoid reusing a single page for unrelated creators: a visitor arriving from one creator's bio should not have to search for the right person.", "Before setting up pages, agree which destinations are approved, who owns the domain, and how changes will be reviewed. Linkovne provides several profiles under one account; it does not turn those profiles into separately permissioned client workspaces. Do not assume a creator can receive restricted dashboard access."],
        steps: ["Make an inventory of the creators and profiles you need to manage.", "Use Pro for up to four pages, or Business for up to ten profiles and custom domains.", "Create each profile with its own branding and approved destinations.", "Review the phone preview, publish, and test each public link.", "Record where each tracked URL is used so future reports remain understandable."],
      },
      {
        heading: "Use a naming system for traffic sources",
        paragraphs: ["Pick a simple convention for each creator's sources: instagram_main, instagram_backup, tiktok_main, or campaign_summer. Use a different tracked URL for each social account when you need to compare them. Reusing one ‘instagram’ source across several accounts loses that distinction.", "Review profile views, link clicks and sources on a regular basis. Look for broken destinations, links people never choose, and accounts sending visitors to the wrong page. Page clicks are a useful operational signal, but they are not the same as paying subscribers, confirmed leads or revenue on another platform."],
      },
      {
        heading: "Decide who controls domains and renewals",
        paragraphs: ["Business supports custom domains, so creators can share an address they own. Agree who purchases and renews each domain before it becomes part of a creator's public identity. A Linkovne subscription does not transfer ownership of a domain to you.", "Multiple domains and health checks can help with a domain becoming unreachable. They do not detect every Instagram or TikTok restriction and cannot guarantee that a shared link will remain allowed. Keep a record of active domains and test the URL actually present in each bio."],
      },
      {
        heading: "Review changes before publishing",
        paragraphs: ["Treat each page as a small customer-facing release. Check the creator's name, destination URLs, contact form and any gated links. Open the published page outside your signed-in editor session to see what a visitor receives.", "If a workflow needs separate staff accounts, granular client roles, more than ten profiles or attribution connected to an external billing system, confirm those requirements with support before choosing a plan. Current profile limits are not a promise of those additional capabilities."],
      },
    ],
    faqs: [
      { q: "How many creator pages does Business include?", a: `Up to ${f.businessProfiles} profiles under one login at ${f.businessPrice}. Pro includes up to ${f.proProfiles} pages at ${f.proPrice}.` },
      { q: "Does Business include separate agency team seats?", a: "The current offer is multiple profiles under one login. Do not interpret profile counts as separate staff seats, role-based access or client permissions." },
      { q: "Can Linkovne show which account generated a sale?", a: "It can show page visits and link clicks by tracked source. It does not verify a purchase on an external service without a separate integration with that service." },
    ],
  },
  {
    slug: "custom-domain-link-in-bio",
    title: "A custom domain for your link-in-bio page",
    description: "Understand custom domains, DNS setup and domain failover for creator pages. Learn what reachability checks can and cannot tell you.",
    updated: "2026-11-15",
    answer: `A custom domain lets you share your own address instead of linkovne.com/yourname. Linkovne includes custom domains on Business (${f.businessPrice}), with up to ${f.businessProfiles} profiles. You buy and renew the domain separately; domain health checks measure reachability, not social-platform acceptance.`,
    sections: [
      {
        heading: "What changes when you use your own domain?",
        paragraphs: ["The public address is part of your brand. With a domain you own, visitors can recognise the address printed in your bio or campaign materials. You also control that domain's registration and can decide where it points in the future.", "A custom domain is an address for your page; it does not automatically improve search rankings, change a social platform's policies or make restricted content acceptable. Use a name you can maintain, keep renewal details current and avoid relying on a domain owned by someone you cannot contact."],
      },
      {
        heading: "Connect the domain without disrupting existing services",
        paragraphs: ["Create and publish your Linkovne profile before connecting the domain. Use the custom-domain settings on Business, and follow the DNS instructions shown for that domain. The exact records depend on the address and its current DNS configuration.", "If your domain already runs a website or receives email, check which records serve those systems before making changes. Do not replace mail records just to connect a page. DNS changes can take time to propagate; verify the public address over HTTPS once the domain status is ready."],
        steps: ["Buy or choose a domain you own and confirm access to its DNS settings.", "Publish the target profile and add the domain in the Business settings.", "Apply only the DNS records requested for the web address.", "Wait for domain verification and HTTPS readiness.", "Test the domain on a phone and from the social app where you will share it.", "Update your bio and keep the domain renewed."],
      },
      {
        heading: "Understand domain health checks and failover",
        paragraphs: ["When you configure several domains and their priority, health monitoring can support failover if a domain becomes unreachable. The purpose is availability: the service checks whether a web address can be reached and can adjust the active domain choice after repeated failures.", "A site may load correctly in a reachability check while a social app still restricts its URL. Domain health monitoring does not identify all such platform blocks. It also cannot rewrite a domain string already pasted into an Instagram bio or printed on a physical card. Keep an operational plan for updating those links when necessary."],
      },
      {
        heading: "Test the visitor's full path",
        paragraphs: ["Open the exact URL you plan to share, including its tracking source. Confirm that the correct creator page appears, the certificate is valid and each destination works. A successful homepage load alone does not prove that a gated link, form or external checkout behaves as intended.", "On Pro and Business, browser-opening tools can help when an in-app browser causes problems. Their behaviour depends on the operating system and app, so test both the normal browser and the social app instead of assuming every visitor will be moved automatically."],
      },
    ],
    faqs: [
      { q: "Which Linkovne plan supports custom domains?", a: `Business, at ${f.businessPrice}. Free and Pro use Linkovne profile URLs. Domain registration and renewal are separate costs.` },
      { q: "Does automatic failover detect an Instagram block?", a: "No. Health monitoring checks domain reachability. A social platform may block a URL even when the domain is reachable." },
      { q: "Will failover update the link already in my bio?", a: "No. A URL you pasted into an external bio stays the same until you change it there. Test the published URL and update your social profile when necessary." },
    ],
  },
];
