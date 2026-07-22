import Link from "next/link";
import type { Metadata } from "next";
import { signUp } from "@/app/auth/actions";
import { AuthForm } from "@/components/auth-form";
import { AuthShell } from "@/components/auth-shell";
import { GoogleButton } from "@/components/google-button";

export const metadata: Metadata = {
  title: "Create your free link in bio page",
  description:
    "Pick your name, add your links and go live in two minutes. Free plan, no card required.",
  alternates: { canonical: "/register" },
};

export default function RegisterPage() {
  return (
    <AuthShell
      bg="bg-indigo-500"
      bgId={2}
      panelTitle="Everything you do, one link."
      panelSubtitle="Your own address, protected links, real analytics. Free to start — pick your name in two minutes."
    >
      <h1 className="font-grotesk text-3xl font-extrabold tracking-tight">
        Create your page
      </h1>
      <p className="mt-1.5 text-soft">
        Free, no card required. You&apos;ll pick your name right after.
      </p>

      <div className="mt-8">
        <GoogleButton label="Continue with Google" />
      </div>

      <div className="my-6 flex items-center gap-3 font-mono text-xs text-faint uppercase">
        <span className="h-px flex-1 bg-line" />
        or
        <span className="h-px flex-1 bg-line" />
      </div>

      <AuthForm
        action={signUp}
        submitLabel="Create account"
        passwordHint="At least 10 characters."
        accent="blue"
      />

      <p className="mt-4 text-center text-xs text-faint">
        By continuing you agree to our{" "}
        <Link href="/terms" className="underline underline-offset-2 hover:text-ink">
          Terms
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="underline underline-offset-2 hover:text-ink">
          Privacy Policy
        </Link>
        .
      </p>

      <p className="mt-6 text-center text-sm text-soft">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-ink underline underline-offset-4"
        >
          Log in
        </Link>
      </p>
    </AuthShell>
  );
}
