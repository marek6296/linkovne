"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import {
  addDomain,
  checkDomain,
  promoteDomain,
  removeDomain,
  type SettingsState,
} from "@/app/dashboard/settings/actions";

type Domain = {
  id: string;
  host: string;
  status: string;
  verification: unknown;
  error: string | null;
  checked_at: string | null;
  priority: number;
  is_healthy: boolean;
  last_ok_at: string | null;
};

type VerificationRecord = { type?: string; domain?: string; value?: string };

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-ink shrink-0">
      {pending ? "Adding…" : "Add domain"}
    </button>
  );
}

function StatusLine({ d }: { d: Domain }) {
  if (d.status === "pending") {
    return <span className="text-soft">Waiting for DNS</span>;
  }
  if (d.status === "error") {
    return <span className="text-danger">{d.error ?? "Error"}</span>;
  }
  if (!d.is_healthy) {
    return (
      <span className="text-danger">
        Not responding{d.error ? ` · ${d.error}` : ""} — traffic moved to your
        backup
      </span>
    );
  }
  return (
    <span className="text-ok">
      {d.priority === 0 ? "Live · primary" : "Live · backup"}
    </span>
  );
}

export function DomainsPanel({
  profileId,
  enabled,
  domains,
}: {
  profileId: string;
  enabled: boolean;
  domains: Domain[];
}) {
  const [state, formAction] = useActionState<SettingsState, FormData>(
    addDomain.bind(null, profileId),
    undefined,
  );

  if (!enabled) {
    return (
      <div className="card flex flex-wrap items-center justify-between gap-3 p-5 text-sm">
        <span className="max-w-md text-soft">
          On a shared domain, one bad actor can get the whole address blocked.
          Your own domain isn&apos;t on anyone else&apos;s list — and a backup
          domain keeps you online if the first one ever stops working.
        </span>
        <Link href="/#pricing" className="btn-ink px-4 py-2 text-sm">
          Get Business
        </Link>
      </div>
    );
  }

  const sorted = [...domains].sort((a, b) => a.priority - b.priority);

  return (
    <div className="space-y-3">
      <form action={formAction} className="flex flex-col gap-3 sm:flex-row">
        <input
          name="host"
          placeholder="links.yoursite.com"
          className="field"
          spellCheck={false}
        />
        <Submit />
      </form>

      {state?.error && <p className="alert-error">{state.error}</p>}
      {state?.ok && (
        <p className="rounded-xl border border-ok/25 bg-ok/5 px-4 py-2.5 text-sm text-ok">
          {state.ok}
        </p>
      )}

      {sorted.length > 1 && (
        <p className="text-xs text-soft">
          We check every domain every 15 minutes. If the primary stops
          answering three checks in a row, your backup takes over
          automatically.
        </p>
      )}

      {sorted.map((d) => {
        const records = Array.isArray(d.verification)
          ? (d.verification as VerificationRecord[])
          : [];
        return (
          <div key={d.id} className="card p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="flex items-center gap-2 font-medium">
                  {d.host}
                  {d.status === "active" && d.priority === 0 && (
                    <span className="rounded-full border border-line px-2 py-0.5 text-[11px] font-medium text-soft">
                      primary
                    </span>
                  )}
                </p>
                <p className="text-xs">
                  <StatusLine d={d} />
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {d.status === "active" && d.priority !== 0 && d.is_healthy && (
                  <form action={promoteDomain.bind(null, d.id)}>
                    <button
                      type="submit"
                      className="rounded-full border border-line px-3.5 py-1.5 text-sm text-soft transition hover:border-ink hover:text-ink"
                    >
                      Make primary
                    </button>
                  </form>
                )}
                <form action={checkDomain.bind(null, d.id)}>
                  <button
                    type="submit"
                    className="rounded-full border border-line px-3.5 py-1.5 text-sm text-soft transition hover:border-ink hover:text-ink"
                  >
                    Check now
                  </button>
                </form>
                <form action={removeDomain.bind(null, d.id)}>
                  <button
                    type="submit"
                    className="rounded-full border border-danger/25 px-3.5 py-1.5 text-sm text-danger transition hover:bg-danger/5"
                  >
                    Remove
                  </button>
                </form>
              </div>
            </div>

            {d.status !== "active" && (
              <div className="mt-4 border-t border-line pt-4 text-sm">
                <p className="font-medium">Add this at your DNS provider</p>
                {records.length > 0 ? (
                  <table className="mt-2 w-full text-left text-xs">
                    <thead className="text-soft">
                      <tr>
                        <th className="pb-1 font-medium">Type</th>
                        <th className="pb-1 font-medium">Name</th>
                        <th className="pb-1 font-medium">Value</th>
                      </tr>
                    </thead>
                    <tbody className="font-mono">
                      {records.map((r, i) => (
                        <tr key={i} className="border-t border-line">
                          <td className="py-1.5 pr-3">{r.type}</td>
                          <td className="py-1.5 pr-3 break-all">{r.domain}</td>
                          <td className="py-1.5 break-all">{r.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="mt-2 font-mono text-xs text-soft">
                    CNAME &nbsp; {d.host} &nbsp; → &nbsp; cname.vercel-dns.com
                  </p>
                )}
                <p className="mt-3 text-xs text-soft">
                  DNS changes can take up to an hour. Hit “Check now” once
                  you&apos;ve added the record.
                </p>
              </div>
            )}
          </div>
        );
      })}

      {sorted.length === 1 && sorted[0].status === "active" && (
        <p className="text-xs text-soft">
          Add a second domain as a backup. If the first one ever stops working,
          we&apos;ll switch to it automatically instead of leaving you offline.
        </p>
      )}
    </div>
  );
}
