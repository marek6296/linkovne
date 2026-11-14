import { NextResponse, type NextRequest } from "next/server";
import { verifySvixSignature } from "@/lib/svix";

export const dynamic = "force-dynamic";

/**
 * Webhook z Resend Inboxes (hello@ / info@ / support@linkovne.com).
 *
 * Pri kazdom prichodzom maili (`inbox.email.received`, smer inbound) posle
 * kratke upozornenie na INBOX_NOTIFY_EMAIL (Gmail). Odpoveda sa v Resende
 * (resend.com/inboxes), aby odpoved odisla z linkovne adresy — preto
 * upozornenie NEMA reply_to na odosielatela.
 *
 * Env: RESEND_API_KEY, RESEND_INBOX_WEBHOOK_SECRET (whsec_… z Resend webhooku),
 * INBOX_NOTIFY_EMAIL, LEAD_FROM_EMAIL (odosielatel upozornenia).
 */

type InboxEmailEvent = {
  type: string;
  data?: {
    inbox_id?: string;
    thread_id?: string;
    email_id?: string;
    thread?: { subject?: string | null; folder?: string };
    email?: {
      direction?: "inbound" | "outbound";
      from?: string;
      to?: string[];
      subject?: string | null;
      attachments?: { filename?: string | null }[];
    };
  };
};

const SNIPPET_MAX = 1500;

/** Text mailu dotiahneme z API — webhook body neobsahuje. Best-effort. */
async function fetchEmailText(
  apiKey: string,
  inboxId: string,
  threadId: string,
  emailId: string,
): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.resend.com/inboxes/${inboxId}/threads/${threadId}/emails/${emailId}`,
      { headers: { Authorization: `Bearer ${apiKey}` } },
    );
    if (!res.ok) return null;
    const email = (await res.json()) as { text?: string | null };
    const text = email.text?.trim();
    if (!text) return null;
    return text.length > SNIPPET_MAX ? `${text.slice(0, SNIPPET_MAX)}…` : text;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const secret = process.env.RESEND_INBOX_WEBHOOK_SECRET;
  const apiKey = process.env.RESEND_API_KEY;
  const notifyTo = process.env.INBOX_NOTIFY_EMAIL;
  const from = process.env.LEAD_FROM_EMAIL;

  // Fail-closed: bez tajomstva nikomu neverime.
  if (!secret) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const rawBody = await request.text();
  if (!verifySvixSignature(secret, rawBody, request.headers)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let event: InboxEmailEvent;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const data = event.data;
  const email = data?.email;
  const relevant =
    event.type === "inbox.email.received" &&
    email?.direction === "inbound" &&
    data?.thread?.folder !== "spam";

  // Na nezaujimave eventy odpovedame 200, inak by ich Resend opakoval.
  if (!relevant || !apiKey || !notifyTo || !from) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  // Poistka proti slucke: upozornenie nesmie ist spat do linkovne inboxu.
  if (/@linkovne\.com\s*>?$/i.test(notifyTo.trim())) {
    console.error("INBOX_NOTIFY_EMAIL must not be a linkovne.com address");
    return NextResponse.json({ ok: true, skipped: true });
  }

  const inboxAddress = email.to?.find((a) => /@linkovne\.com/i.test(a)) ?? "linkovne inbox";
  const subject = email.subject ?? data?.thread?.subject ?? "(no subject)";
  const text =
    data?.inbox_id && data.thread_id && data.email_id
      ? await fetchEmailText(apiKey, data.inbox_id, data.thread_id, data.email_id)
      : null;
  const attachments = (email.attachments ?? [])
    .map((a) => a.filename)
    .filter(Boolean);

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      // Resend pri retry posle ten isty svix-id — nech nevzniknu duplikaty.
      "Idempotency-Key": `inbox-notify-${request.headers.get("svix-id")}`,
    },
    body: JSON.stringify({
      from,
      to: notifyTo,
      subject: `[${inboxAddress}] ${subject}`,
      text: [
        `Nový mail na ${inboxAddress}`,
        `Od: ${email.from ?? "?"}`,
        `Predmet: ${subject}`,
        attachments.length ? `Prílohy: ${attachments.join(", ")}` : null,
        "",
        text ?? "(text sa nepodarilo načítať — pozri v Resende)",
        "",
        "Odpovedz v Resende, aby odpoveď odišla z linkovne adresy:",
        "https://resend.com/inboxes",
      ]
        .filter((line) => line !== null)
        .join("\n"),
    }),
  });

  if (!res.ok) {
    console.error("inbox notify failed:", res.status, await res.text());
    // 500 → Resend webhook skusi znova neskor.
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
