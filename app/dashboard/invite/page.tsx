import "@/components/dashboard/workspace.css";
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
    <div className="account-page invite-page">
      <header className="account-heading">
        <div>
          <h1>Invite & earn</h1>
          <p>Share Linkovne and earn Pro when friends subscribe.</p>
        </div>
      </header>
      <div className="invite-overview">
        <section className="invite-reward">
          <span className="account-eyebrow">Your referral reward</span>
          <h2>
            Invite a friend.
            <br />
            Earn 3 months of Pro.
          </h2>
          <p>
            When a friend joins through your link and subscribes to a paid plan,
            you earn three months of Pro. Every qualifying referral adds to your
            reward.
          </p>
          <div className="reward-equation">
            <strong>1</strong>
            <span>paid referral</span>
            <span aria-hidden>→</span>
            <strong>3</strong>
            <span>months of Pro</span>
          </div>
        </section>
        <section className="invite-how">
          <h2>How it works</h2>
          <ol>
            <Step n={1}>
              <strong>Share your invitation</strong>
              <p>Send your personal link to a friend.</p>
            </Step>
            <Step n={2}>
              <strong>They create their page</strong>
              <p>Their signup is linked to your invitation.</p>
            </Step>
            <Step n={3}>
              <strong>They subscribe. You earn.</strong>
              <p>
                Your Pro reward is added automatically after they subscribe to a
                paid plan.
              </p>
            </Step>
          </ol>
        </section>
      </div>
      <InvitePanel
        url={url}
        signups={data.signups ?? 0}
        rewarded={data.rewarded ?? 0}
        months={data.months ?? 0}
      />
    </div>
  );
}
function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li>
      <span className="invite-step-number">{n}</span>
      <div>{children}</div>
    </li>
  );
}
