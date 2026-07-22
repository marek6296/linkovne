import Link from "next/link";
import { Wordmark } from "@/components/wordmark";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <h1 className="font-grotesk font-bold text-4xl tracking-tight">
        This page doesn&apos;t <em>exist</em>.
      </h1>
      <p className="mt-3 text-soft">
        Maybe the address is still free — and it could be yours.
      </p>
      <Link href="/register" className="btn-ink mt-8">
        Claim your name
      </Link>
      <Link href="/" className="mt-10">
        <Wordmark className="text-sm text-faint" />
      </Link>
    </main>
  );
}
