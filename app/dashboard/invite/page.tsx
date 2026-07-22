import { createClient } from "@/lib/supabase/server";
import { InvitePanel } from "@/components/dashboard/invite-panel";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function InvitePage() {
  const supabase = await createClient();
  // my_referral() cita auth.uid() interne — auth uz strazi layout.
  const { data: ref } = await supabase.rpc("my_referral");

  const data = (ref ?? {}) as {
    code?: string;
    signups?: number;
    rewarded?: number;
    months?: number;
  };
  const url = data.code ? `${SITE_URL}/i/${data.code}` : SITE_URL;

  return (
    <div className="space-y-8">
        <header className="max-w-xl">
          <h1 className="font-grotesk text-3xl font-extrabold tracking-tight">
            Invite friends, earn{" "}
            <span className="text-pink-500">free Pro</span>
          </h1>
          <p className="mt-3 text-soft">
            Share your link. When someone you invite subscribes to a paid plan,
            you get <span className="font-semibold text-ink">3 months of Pro
            free</span> — and it stacks with every friend. Invite four who
            subscribe and you&apos;re on us for a whole year.
          </p>
        </header>

        <InvitePanel
          url={url}
          signups={data.signups ?? 0}
          rewarded={data.rewarded ?? 0}
          months={data.months ?? 0}
        />

        <ol className="max-w-xl space-y-3 text-sm text-soft">
          <Step n={1}>You share your link — anywhere.</Step>
          <Step n={2}>They sign up and build their page.</Step>
          <Step n={3}>
            When they subscribe, 3 months of Pro land in your account
            automatically.
          </Step>
        </ol>
    </div>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink font-mono text-xs font-bold text-paper">
        {n}
      </span>
      <span>{children}</span>
    </li>
  );
}
