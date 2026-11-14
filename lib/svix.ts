import { createHmac, timingSafeEqual } from "node:crypto";

/** Max. vek webhooku — starsie spravy odmietneme (ochrana pred replay). */
const TOLERANCE_SECONDS = 5 * 60;

/**
 * Overenie podpisu webhooku vo formate Svix (pouziva ho Resend).
 * Podpisuje sa `${svix-id}.${svix-timestamp}.${raw body}` cez HMAC-SHA256,
 * kluc = base64 cast tajomstva za `whsec_`. Hlavicka `svix-signature` moze
 * obsahovat viac podpisov oddelenych medzerou (`v1,<base64>`), staci jeden.
 *
 * Vlastna implementacia namiesto balika `svix`, aby sme nepridavali zavislost
 * kvoli jednej funkcii. Body musi byt RAW text, nie znova serializovany JSON.
 */
export function verifySvixSignature(
  secret: string,
  rawBody: string,
  headers: Headers,
  nowSeconds = Math.floor(Date.now() / 1000),
): boolean {
  const id = headers.get("svix-id");
  const timestamp = headers.get("svix-timestamp");
  const signatureHeader = headers.get("svix-signature");
  if (!id || !timestamp || !signatureHeader) return false;

  const ts = Number(timestamp);
  if (!Number.isFinite(ts) || Math.abs(nowSeconds - ts) > TOLERANCE_SECONDS) {
    return false;
  }

  const key = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const expected = createHmac("sha256", key)
    .update(`${id}.${timestamp}.${rawBody}`)
    .digest();

  return signatureHeader.split(" ").some((part) => {
    const [version, sig] = part.split(",");
    if (version !== "v1" || !sig) return false;
    const given = Buffer.from(sig, "base64");
    return given.length === expected.length && timingSafeEqual(given, expected);
  });
}
