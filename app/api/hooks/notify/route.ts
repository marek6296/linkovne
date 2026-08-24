import { NextResponse, type NextRequest } from "next/server";
import { timingSafeEqual } from "crypto";
import { formatEventMessage, sendTelegram, type NotifyEvent } from "@/lib/notify";

export const runtime = "nodejs";

/** Konstantny cas — nech sa secret neda uhadnut casovaním. */
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

/**
 * Prijíma udalosti z DB triggera (linkove.notify_account_event) a posiela ich
 * do Telegramu. Chráni ho zdielaný secret (NOTIFY_HOOK_SECRET) — rovnaká hodnota
 * je v linkove.app_config.notify_secret. Kým nie je nastavený, ticho no-op, nech
 * trigger nespamuje chybami.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.NOTIFY_HOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ ok: true, skipped: "not configured" });
  }

  const provided = request.headers.get("x-notify-secret") ?? "";
  if (!safeEqual(provided, secret)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let event: NotifyEvent;
  try {
    event = (await request.json()) as NotifyEvent;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  if (!event || typeof event.type !== "string") {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const message = formatEventMessage(event);
  if (!message) {
    // Typ, ktory nenotifikujeme — v poriadku, len nič neposielame.
    return NextResponse.json({ ok: true, skipped: "no message" });
  }

  const sent = await sendTelegram(message);
  return NextResponse.json({ ok: sent });
}
