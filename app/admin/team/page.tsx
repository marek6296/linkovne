import { createClient } from "@/lib/supabase/server";
import { AddAdminForm, RemoveAdminButton } from "@/components/admin/team-form";

export const dynamic = "force-dynamic";

type Row = {
  email: string;
  created_at: string;
  has_account: boolean;
  plan: string | null;
};

export default async function TeamPage() {
  const supabase = await createClient();
  const [{ data }, { data: auth }] = await Promise.all([
    supabase.rpc("admin_list_admins"),
    supabase.auth.getUser(),
  ]);

  const admins = (data ?? []) as Row[];
  const me = auth.user?.email?.toLowerCase() ?? "";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-grotesk text-2xl font-bold tracking-tight">Team</h1>
        <p className="mt-1 text-sm text-soft">
          Admins run the operator account — everything unlocked, this panel, and
          the ability to manage clients &amp; discounts. Adding an email here is
          all it takes.
        </p>
      </div>

      <AddAdminForm />

      <div className="overflow-hidden rounded-2xl border border-line bg-surface">
        <div className="border-b border-line px-5 py-3.5">
          <p className="text-sm font-semibold">
            Admins <span className="text-soft">({admins.length})</span>
          </p>
        </div>
        <div className="divide-y divide-line">
          {admins.map((a) => {
            const isMe = a.email.toLowerCase() === me;
            return (
              <div
                key={a.email}
                className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3.5"
              >
                <span className="text-sm font-medium">{a.email}</span>
                {isMe && (
                  <span className="rounded-full bg-ink/[0.06] px-2 py-0.5 text-[11px] font-medium text-soft">
                    you
                  </span>
                )}
                {!a.has_account ? (
                  <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                    no account yet
                  </span>
                ) : a.plan === "admin" ? (
                  <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                    admin plan
                  </span>
                ) : (
                  <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                    plan: {a.plan ?? "—"}
                  </span>
                )}
                <span className="text-xs text-faint">
                  added {new Date(a.created_at).toLocaleDateString()}
                </span>
                <span className="ml-auto">
                  <RemoveAdminButton email={a.email} disabled={isMe} />
                </span>
              </div>
            );
          })}
          {admins.length === 0 && (
            <p className="px-5 py-8 text-center text-sm text-soft">
              No admins yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
