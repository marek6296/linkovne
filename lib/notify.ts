import { SITE_URL } from "@/lib/site";

/**
 * Admin notifikacie. Payload chodi z DB triggera (linkove.notify_account_event)
 * cez /api/hooks/notify. Formatovanie je ciste (testovatelne), odosielanie cita
 * token z env — token NIE je nikde v repozitari ani v DB.
 */
export type NotifyEvent = {
  id?: number;
  type: string;
  from_plan?: string | null;
  to_plan?: string | null;
  meta?: Record<string, unknown> | null;
  account_id?: string | null;
  email?: string | null;
  username?: string | null;
  created_at?: string | null;
};

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function cap(s?: string | null): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : "";
}

/** meta.amount je v centoch → „4.99 EUR". */
function money(meta?: Record<string, unknown> | null): string | null {
  const a = meta?.amount;
  const c = (typeof meta?.currency === "string" ? meta.currency : "eur") || "eur";
  if (typeof a === "number") return `${(a / 100).toFixed(2)} ${c.toUpperCase()}`;
  return null;
}

/**
 * Telegram HTML sprava pre jednu udalost. Vrati null pre typy, ktore
 * nenotifikujeme (napr. neznamy typ) — tie sa ticho preskocia.
 */
export function formatEventMessage(e: NotifyEvent): string | null {
  const who = e.username || e.email || "unknown";
  const emailTail = e.email && e.username ? ` (${e.email})` : "";
  const to = cap(e.to_plan);
  const amt = money(e.meta);

  let head: string | null;
  switch (e.type) {
    case "signup":
      head = "🎉 <b>New signup</b>";
      break;
    case "plan_upgrade":
      head = `⬆️ <b>Upgrade → ${esc(to)}</b>`;
      break;
    case "plan_downgrade":
      head = `⬇️ <b>Downgrade → ${esc(to)}</b>`;
      break;
    case "payment_succeeded":
      head = `✅ <b>Payment received${amt ? ` · ${esc(amt)}` : ""}</b>`;
      break;
    case "payment_failed":
      head = "⚠️ <b>Payment FAILED</b>";
      break;
    case "subscription_canceled":
      head = "🛑 <b>Subscription canceled</b>";
      break;
    case "plan_expired":
      head = "⌛ <b>Plan expired → Free</b>";
      break;
    case "discount_applied": {
      const code =
        (typeof e.meta?.coupon === "string" && e.meta.coupon) ||
        (typeof e.meta?.promotion_code === "string" && e.meta.promotion_code) ||
        "";
      head = `🏷️ <b>Discount applied${code ? ` · ${esc(String(code))}` : ""}</b>`;
      break;
    }
    case "admin_change":
      head = `👤 <b>Plan set by admin → ${esc(to)}</b>`;
      break;
    case "admin_added":
      head = "👑 <b>Made an admin</b>";
      break;
    case "admin_removed":
      head = "🚫 <b>Removed as admin → Free</b>";
      break;
    default:
      head = null;
  }
  if (!head) return null;

  const link = e.account_id
    ? `\n${SITE_URL}/admin/clients/${e.account_id}`
    : "";
  return `${head}\n${esc(who)}${esc(emailTail)}${link}`;
}

/** Pošle správu do Telegramu. Token a chat id sú iba v env (Vercel). */
export async function sendTelegram(text: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (!token || !chatId) return false;
  try {
    const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
      signal: AbortSignal.timeout(8000),
    });
    return r.ok;
  } catch {
    return false;
  }
}
