import { timingSafeEqual } from "node:crypto";

/**
 * Autorizacia cron endpointov (Vercel Cron posiela `Authorization: Bearer CRON_SECRET`).
 *
 * Fail-closed: ak CRON_SECRET nie je nastaveny, endpoint je VZDY zamknuty —
 * zabudnuta env premenna nesmie potichu otvorit cron verejnosti.
 * Porovnanie je timing-safe (dlzkovy rozdiel kryjeme porovnanim digestov).
 */
export function isCronAuthorized(authHeader: string | null): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret || !authHeader) return false;

  const expected = Buffer.from(`Bearer ${secret}`);
  const actual = Buffer.from(authHeader);
  if (expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
}
