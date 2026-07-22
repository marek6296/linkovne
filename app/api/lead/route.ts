import { NextResponse, type NextRequest } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createPublicClient } from "@/lib/supabase/public";
import { rateLimit, clientIp } from "@/lib/rate-limit";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Posle majitelovi upozornenie na novy lead. Vyzaduje RESEND_API_KEY
 * a SUPABASE_SERVICE_ROLE_KEY (adresu majitela ziska len service role).
 * Bez nich sa ticho preskoci — lead je aj tak v inboxe.
 */
async function notifyOwner(
  profileId: string,
  name: string,
  email: string,
  message: string,
) {
  const resendKey = process.env.RESEND_API_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const from = process.env.LEAD_FROM_EMAIL;
  if (!resendKey || !serviceKey || !from) return;

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    { db: { schema: "linkove" }, auth: { persistSession: false } },
  );

  const { data: profile } = await admin
    .from("profiles")
    .select("username, owner_id")
    .eq("id", profileId)
    .maybeSingle();
  if (!profile) return;

  const { data: owner } = await admin.auth.admin.getUserById(
    profile.owner_id as string,
  );
  const to = owner?.user?.email;
  if (!to) return;

  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "";

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      reply_to: email,
      subject: `New message on ${profile.username}`,
      text: [
        `${name} <${email}> wrote via linkovne.com/${profile.username}:`,
        "",
        message || "(no message)",
        "",
        `Reply directly to this email, or open your inbox: ${site}/dashboard/leads`,
      ].join("\n"),
    }),
  });
}

export async function POST(request: NextRequest) {
  // Kazdy lead posle majitelovi email — bez limitu je to email-bombing vektor.
  const ip = clientIp(request.headers);
  if (!rateLimit(`lead:${ip}`, 5, 10 * 60_000)) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const profileId = String(body.profileId ?? "");
  const blockId = String(body.blockId ?? "");
  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim();
  const message = String(body.message ?? "").trim();

  if (!UUID_RE.test(profileId)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  // Druha vrstva: strop na profil (chrani majitela pred spamom z vela IP).
  if (!rateLimit(`lead:profile:${profileId}`, 20, 60 * 60_000)) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }
  if (!name || name.length > 100) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  if (!EMAIL_RE.test(email) || email.length > 200) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  if (message.length > 2000) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const supabase = createPublicClient();

  // RLS pusti insert len na zverejneny profil.
  const { error } = await supabase.from("leads").insert({
    profile_id: profileId,
    block_id: UUID_RE.test(blockId) ? blockId : null,
    name,
    email,
    message: message || null,
  });

  if (error) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  // Notifikacia je best-effort — lead je uz ulozeny, email ho nesmie zhodit
  await notifyOwner(profileId, name, email, message).catch(() => undefined);

  return NextResponse.json({ ok: true });
}
