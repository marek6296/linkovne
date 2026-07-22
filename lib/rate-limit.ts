/**
 * Jednoduchy in-memory sliding-window rate limiter.
 *
 * Na serverless (Vercel) je pamat per-instancia, takze limit nie je globalne
 * presny — ale zastavi naivne burst spamovanie z jednej IP na teplej instancii
 * bez novej zavislosti. Pre tvrde garancie neskor vymenit za Upstash/KV.
 */

type Window = { count: number; resetAt: number };

const buckets = new Map<string, Window>();

/** Obcasny cleanup, nech mapa nerastie donekonecna. */
function sweep(now: number) {
  if (buckets.size < 10_000) return;
  for (const [k, w] of buckets) {
    if (w.resetAt <= now) buckets.delete(k);
  }
}

/**
 * Vrati true, ak je poziadavka povolena. `key` kombinuj z nazvu endpointu
 * a identity (IP / profil), napr. `lead:1.2.3.4`.
 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  sweep(now);

  const w = buckets.get(key);
  if (!w || w.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (w.count >= limit) return false;
  w.count++;
  return true;
}

/** Klientska IP z Vercel/proxy hlaviciek (prva v x-forwarded-for retazi). */
export function clientIp(headers: Headers): string {
  return (
    headers.get("x-real-ip") ??
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}
