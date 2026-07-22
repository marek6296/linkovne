import Link from "next/link";
import { requestPasswordReset } from "@/app/auth/actions";
import { AuthForm } from "@/components/auth-form";
import { Wordmark } from "@/components/wordmark";

export default function ForgotPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-10 block">
          <Wordmark className="text-xl" />
        </Link>

        <h1 className="font-grotesk font-bold text-3xl tracking-tight">Reset password</h1>
        <p className="mt-1.5 text-soft">
          We&apos;ll email you a link to set a new one.
        </p>

        <div className="mt-8">
          <AuthForm
            action={requestPasswordReset}
            submitLabel="Send reset link"
            emailOnly
          />
        </div>

        <p className="mt-8 text-center text-sm text-soft">
          <Link
            href="/login"
            className="font-medium text-ink underline underline-offset-4"
          >
            Back to log in
          </Link>
        </p>
      </div>
    </main>
  );
}
