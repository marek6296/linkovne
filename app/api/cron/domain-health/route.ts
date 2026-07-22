import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isCronAuthorized } from "@/lib/cron-auth";

export const maxDuration = 60;

/** Kolko zlyhani po sebe znamena, ze domena je naozaj mimo. */
const FAIL_THRESHOLD = 3;

type DomainRow = {
  id: string;
  host: string;
  profile_id: string;
  priority: number;
  is_healthy: boolean;
  fail_count: number;
};

async function probe(host: string) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(`https://${host}/`, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": "LinkovneDomainCheck/1.0 (+https://linkovne.com)",
      },
    });
    // 4xx aj 5xx znamenaju, ze navstevnik stranku neuvidi
    return { ok: res.status < 400, status_code: res.status, error: null };
  } catch (e) {
    return {
      ok: false,
      status_code: null,
      error: e instanceof Error ? e.name : "failed",
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function GET(request: NextRequest) {
  if (!isCronAuthorized(request.headers.get("authorization"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return NextResponse.json(
      { error: "Domain checks are not configured." },
      { status: 503 },
    );
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    { db: { schema: "linkove" }, auth: { persistSession: false } },
  );

  const { data: domains } = await supabase
    .from("domains")
    .select("id, host, profile_id, priority, is_healthy, fail_count")
    .eq("status", "active")
    .limit(500);

  const rows = (domains ?? []) as DomainRow[];
  const touchedProfiles = new Set<string>();
  const wentDown: DomainRow[] = [];
  const cameBack: DomainRow[] = [];

  for (const d of rows) {
    const result = await probe(d.host);

    await supabase.from("domain_checks").insert({
      domain_id: d.id,
      ok: result.ok,
      status_code: result.status_code,
      error: result.error,
    });

    if (result.ok) {
      if (!d.is_healthy) cameBack.push(d);
      await supabase
        .from("domains")
        .update({
          is_healthy: true,
          fail_count: 0,
          last_ok_at: new Date().toISOString(),
          checked_at: new Date().toISOString(),
          error: null,
        })
        .eq("id", d.id);
      if (!d.is_healthy) touchedProfiles.add(d.profile_id);
    } else {
      const fails = d.fail_count + 1;
      const nowUnhealthy = fails >= FAIL_THRESHOLD;
      if (nowUnhealthy && d.is_healthy) wentDown.push(d);

      await supabase
        .from("domains")
        .update({
          fail_count: fails,
          is_healthy: !nowUnhealthy,
          checked_at: new Date().toISOString(),
          error: result.error ?? `HTTP ${result.status_code}`,
        })
        .eq("id", d.id);

      if (nowUnhealthy && d.is_healthy) touchedProfiles.add(d.profile_id);
    }
  }

  // Preusporiadanie = failover. Zdrava zaloha sa stane hlavnou domenou.
  for (const profileId of touchedProfiles) {
    await supabase.rpc("reorder_domains", { p_profile: profileId });
  }

  await notify(supabase, wentDown, cameBack).catch(() => undefined);

  return NextResponse.json({
    checked: rows.length,
    down: wentDown.length,
    recovered: cameBack.length,
    failovers: touchedProfiles.size,
  });
}

/** Upozorni majitela, ze domena spadla alebo sa vratila. Best-effort. */
async function notify(
  // Klient je typovany na schemu `linkove`, generovane typy tu nemame
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  down: DomainRow[],
  up: DomainRow[],
) {
  const resendKey = process.env.RESEND_API_KEY;
  const from = process.env.LEAD_FROM_EMAIL;
  if (!resendKey || !from || (down.length === 0 && up.length === 0)) return;

  const all = [...down.map((d) => ({ d, up: false })), ...up.map((d) => ({ d, up: true }))];

  for (const { d, up: recovered } of all) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("username, owner_id")
      .eq("id", d.profile_id)
      .maybeSingle();
    if (!profile) continue;

    const { data: owner } = await supabase.auth.admin.getUserById(
      profile.owner_id as string,
    );
    const to = owner?.user?.email;
    if (!to) continue;

    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        subject: recovered
          ? `${d.host} is back online`
          : `${d.host} stopped responding`,
        text: recovered
          ? `Good news — ${d.host} is answering again and is back in rotation for ${profile.username}.`
          : [
              `${d.host} failed ${FAIL_THRESHOLD} checks in a row and has been taken out of rotation for ${profile.username}.`,
              ``,
              `If you have a backup domain, visitors are already being sent there.`,
              `Check your DNS settings, then hit "Check now" in your settings.`,
            ].join("\n"),
      }),
    });
  }
}
