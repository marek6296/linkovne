import Link from "next/link";
import type { Metadata } from "next";
import { signIn } from "@/app/auth/actions";
import { AuthForm } from "@/components/auth-form";
import { AuthShell } from "@/components/auth-shell";
import { GoogleButton } from "@/components/google-button";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <AuthShell
      bg="bg-pink-500"
      bgId={3}
      panelTitle="Welcome back."
      panelSubtitle="Pick up where you left off — your pages, links and numbers are waiting."
    >
      <h1 className="font-grotesk text-3xl font-extrabold tracking-tight">
        Welcome back
      </h1>
      <p className="mt-1.5 text-soft">Log in to your account.</p>

      {error && (
        <p role="alert" className="alert-error mt-6">
          Couldn&apos;t complete sign-in. Please try again.
        </p>
      )}

      <div className="mt-8">
        <GoogleButton label="Continue with Google" />
      </div>

      <div className="my-6 flex items-center gap-3 font-mono text-xs text-faint uppercase">
        <span className="h-px flex-1 bg-line" />
        or
        <span className="h-px flex-1 bg-line" />
      </div>

      <AuthForm action={signIn} submitLabel="Log in" accent="pink" />

      <p className="mt-4 text-center text-sm">
        <Link
          href="/forgot"
          className="text-soft underline underline-offset-4 hover:text-ink"
        >
          Forgot your password?
        </Link>
      </p>

      <p className="mt-6 text-center text-sm text-soft">
        No account yet?{" "}
        <Link
          href="/register"
          className="font-medium text-ink underline underline-offset-4"
        >
          Create your page
        </Link>
      </p>
    </AuthShell>
  );
}
