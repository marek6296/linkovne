import Link from "next/link";
import { Logo } from "@/components/logo";
import { BRAND_TITLE } from "@/lib/site";

/**
 * Jednotny obal pre pravne stranky (Privacy, Terms). Cisty, citatelny layout —
 * hlavicka s logom, obsah v prose sirke, footer s krizovymi linkami.
 */
export function LegalShell({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-[#f8f5f7]">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-6 py-6">
        <Link href="/" aria-label={`${BRAND_TITLE} — home`}>
          <Logo className="h-7 w-auto" />
        </Link>
        <Link href="/" className="text-sm text-soft transition hover:text-ink">
          ← Back
        </Link>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-8">
        <h1 className="font-grotesk text-3xl font-extrabold tracking-tight sm:text-4xl">
          {title}
        </h1>
        <p className="mt-2 text-sm text-faint">Last updated: {updated}</p>

        <div className="legal mt-8">{children}</div>
      </main>

      <footer className="mx-auto max-w-3xl px-6 py-10 text-sm text-faint">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-6">
          <Link href="/privacy" className="transition hover:text-ink">
            Privacy
          </Link>
          <Link href="/terms" className="transition hover:text-ink">
            Terms
          </Link>
          <a
            href="mailto:report@linkovne.com"
            className="transition hover:text-ink"
          >
            Report content
          </a>
          <span className="ml-auto">
            © {new Date().getFullYear()} {BRAND_TITLE}
          </span>
        </div>
      </footer>
    </div>
  );
}
