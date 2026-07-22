import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ResetForm } from "@/components/reset-form";
import { Wordmark } from "@/components/wordmark";

export default async function ResetPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Sem sa da dostat len s platnou session z emailoveho odkazu
  if (!user) redirect("/forgot?expired=1");

  return (
    <main className="flex min-h-dvh items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-10 block">
          <Wordmark className="text-xl" />
        </Link>

        <h1 className="font-grotesk font-bold text-3xl tracking-tight">
          Choose a new password
        </h1>
        <p className="mt-1.5 text-soft">Signed in as {user.email}</p>

        <div className="mt-8">
          <ResetForm />
        </div>
      </div>
    </main>
  );
}
