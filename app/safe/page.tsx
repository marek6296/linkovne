import type { Metadata } from "next";
import Link from "next/link";
import { BRAND_TITLE } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: `Share safely — ${BRAND_TITLE}` },
  description:
    "How to share your links on Instagram & TikTok without getting your link flagged — a practical guide for creators.",
};

function Step({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-4">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink text-sm font-bold text-paper">
        {n}
      </span>
      <div className="min-w-0">
        <h3 className="font-grotesk text-lg font-semibold">{title}</h3>
        <div className="mt-1.5 space-y-2 text-sm leading-relaxed text-soft">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function SafeSharingGuide() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-14">
      <p className="text-xs font-semibold tracking-widest text-faint uppercase">
        Creator guide
      </p>
      <h1 className="mt-2 font-grotesk text-3xl font-bold tracking-tight">
        Share your links without getting flagged
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-soft">
        Instagram and TikTok don&apos;t ban you for being a creator — they react
        to <strong>signals</strong>. Most of staying safe is about how you post,
        not just your link. Here&apos;s the playbook, and how {BRAND_TITLE} helps
        with each part.
      </p>

      <div className="mt-10 space-y-8">
        <Step n={1} title="Turn on Creator mode">
          <p>
            In the editor, open <strong>Protection → Creator mode</strong>. One
            switch shields every link behind a confirmation step (so the real
            URL never sits in your page&apos;s code or link previews), hides your
            page from search, keeps your bio out of crawlers, and opens links in
            the real browser. It&apos;s on Pro &amp; Business.
          </p>
        </Step>

        <Step n={2} title="Use your own custom domain">
          <p>
            On a shared domain, the platform judges your link by what{" "}
            <em>everyone</em> on it does — one flagged user can drag others down.
            Your own domain gives you your own reputation. Keep the name neutral
            (avoid anything that signals adult content in the domain itself).
            Custom domains are on Business.
          </p>
        </Step>

        <Step n={3} title="Never put the raw platform link in your bio">
          <p>
            A direct OnlyFans / Fanvue link in your Instagram bio is the single
            biggest trigger. Always point your bio at your {BRAND_TITLE} page —
            the platform&apos;s scanner follows redirects but can&apos;t click a
            confirmation button, so a shielded link stays clean.
          </p>
        </Step>

        <Step n={4} title="Keep your on-platform content within the rules">
          <p>
            This is ~80% of it. Don&apos;t write &ldquo;OnlyFans&rdquo; in
            captions, avoid flagged hashtags, and keep posts within each
            platform&apos;s guidelines — even if what you link to is explicit.
            No link tool can fix risky on-platform behaviour.
          </p>
        </Step>

        <Step n={5} title="If a link stops working, switch — don't panic">
          <p>
            Shadowbans usually lift in 14–30 days once you stop the trigger. If
            a domain gets throttled, move to a backup domain and give it a few
            days. Keep your page the same — just change the address you share.
          </p>
        </Step>
      </div>

      <div className="mt-12 rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] p-5">
        <p className="text-sm font-semibold text-amber-700">
          An honest note
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-amber-700/90">
          No link-in-bio tool makes you invisible or guarantees you&apos;ll
          never get banned. Platforms track content, behaviour, and account
          history too. These layers meaningfully <em>reduce</em> the risk — they
          don&apos;t remove it. Treat it as a seatbelt, not a force field.
        </p>
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/dashboard" className="btn-ink px-5 py-2.5 text-sm">
          Open the editor
        </Link>
        <Link
          href="/#pricing"
          className="rounded-full border border-line px-5 py-2.5 text-sm font-medium transition hover:border-ink"
        >
          See plans
        </Link>
      </div>
    </main>
  );
}
