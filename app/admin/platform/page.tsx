import { createClient } from "@/lib/supabase/server";
import { fmtDateTime, relativeDays } from "@/lib/crm";
import { SITE_DOMAIN } from "@/lib/site";

/**
 * Admin → Platform. Zdravie infrastruktury: klientske domeny a pokazene
 * odkazy (crony ich priebezne kontroluju — tu je prehlad na zasah).
 */

type DomainRow = {
  host: string;
  status: string;
  is_healthy: boolean | null;
  error: string | null;
  last_ok_at: string | null;
  checked_at: string | null;
  created_at: string;
  username: string;
};

type BrokenLink = {
  username: string;
  title: string | null;
  url: string | null;
  status_code: number | null;
  error: string | null;
  checked_at: string | null;
};

type Platform = { domains: DomainRow[]; broken_links: BrokenLink[] };

function domainTone(d: DomainRow): { label: string; cls: string } {
  if (d.status !== "active")
    return { label: d.status, cls: "bg-amber-500/10 text-amber-600" };
  if (d.is_healthy === false)
    return { label: "down", cls: "bg-danger/10 text-danger" };
  return { label: "healthy", cls: "bg-ok/10 text-ok" };
}

export default async function AdminPlatformPage() {
  const supabase = await createClient();
  const { data } = await supabase.rpc("admin_platform");
  const p = (data ?? { domains: [], broken_links: [] }) as Platform;
  const domains = p.domains ?? [];
  const broken = p.broken_links ?? [];
  const domainsDown = domains.filter(
    (d) => d.status === "active" && d.is_healthy === false,
  ).length;

  const stats = [
    { label: "Custom domains", value: domains.length },
    { label: "Domains down", value: domainsDown, danger: domainsDown > 0 },
    { label: "Broken links", value: broken.length, danger: broken.length > 0 },
  ];

  return (
    <div className="space-y-8">
      <section className="grid grid-cols-3 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="card p-5">
            <p className="text-xs font-medium tracking-wide text-soft uppercase">
              {s.label}
            </p>
            <p
              className={`mt-1.5 font-grotesk text-3xl font-bold tabular-nums ${
                s.danger ? "text-danger" : ""
              }`}
            >
              {s.value}
            </p>
          </div>
        ))}
      </section>

      {/* Klientske domeny */}
      <section className="card p-6">
        <h2 className="text-sm font-semibold">Custom domains</h2>
        <p className="mt-1 text-xs text-soft">
          Business feature — client domains pointing at their pages. Health is
          re-checked by cron; a red row means visitors can&apos;t reach the page.
        </p>

        {domains.length === 0 ? (
          <p className="mt-4 text-sm text-faint">No custom domains yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-line text-xs text-faint uppercase">
                <tr>
                  <th className="px-3 py-2 font-medium">Domain</th>
                  <th className="px-3 py-2 font-medium">Page</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Last OK</th>
                  <th className="px-3 py-2 font-medium">Checked</th>
                </tr>
              </thead>
              <tbody>
                {domains.map((d) => {
                  const tone = domainTone(d);
                  return (
                    <tr key={d.host} className="border-b border-line/60">
                      <td className="px-3 py-2.5">
                        <a
                          href={`https://${d.host}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium hover:underline"
                        >
                          {d.host}
                        </a>
                        {d.error && (
                          <p className="max-w-[18rem] truncate text-xs text-danger">
                            {d.error}
                          </p>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-soft">/{d.username}</td>
                      <td className="px-3 py-2.5">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${tone.cls}`}
                        >
                          {tone.label}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-soft">
                        {relativeDays(d.last_ok_at)}
                      </td>
                      <td className="px-3 py-2.5 text-soft">
                        {fmtDateTime(d.checked_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Pokazene linky */}
      <section className="card p-6">
        <h2 className="text-sm font-semibold">Broken links</h2>
        <p className="mt-1 text-xs text-soft">
          Links on client pages that failed the last health check — dead
          destinations hurt their audience and our reputation.
        </p>

        {broken.length === 0 ? (
          <p className="mt-4 text-sm text-faint">
            All monitored links are healthy. 🎉
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-line text-xs text-faint uppercase">
                <tr>
                  <th className="px-3 py-2 font-medium">Page</th>
                  <th className="px-3 py-2 font-medium">Link</th>
                  <th className="px-3 py-2 font-medium">Problem</th>
                  <th className="px-3 py-2 font-medium">Checked</th>
                </tr>
              </thead>
              <tbody>
                {broken.map((b, i) => (
                  <tr key={i} className="border-b border-line/60">
                    <td className="px-3 py-2.5">
                      <a
                        href={`https://${SITE_DOMAIN}/${b.username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium hover:underline"
                      >
                        /{b.username}
                      </a>
                    </td>
                    <td className="max-w-[16rem] px-3 py-2.5">
                      <p className="truncate font-medium">{b.title ?? "—"}</p>
                      <p className="truncate text-xs text-faint">{b.url}</p>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="rounded-full bg-danger/10 px-2.5 py-0.5 text-xs font-medium text-danger">
                        {b.status_code ?? b.error ?? "failed"}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-soft">
                      {fmtDateTime(b.checked_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
