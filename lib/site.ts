/**
 * Jedine miesto, kde zije nazov znacky a domena.
 * Ked kupime inu domenu, meni sa NEXT_PUBLIC_SITE_DOMAIN a nic ine.
 *
 * Pozn.: Postgres schema `linkove` a Storage bucket `linkove-media` zostavaju
 * pod povodnym nazvom — su interne, navstevnik ich nikdy nevidi, a premenovanie
 * by znamenalo migraciu vsetkych policy, funkcii aj ulozenych suborov.
 */
export const BRAND = "linkovne";
export const BRAND_TITLE = "Linkovne";

/** Ostra domena. Da sa prebit env premennou NEXT_PUBLIC_SITE_DOMAIN.
 *  `|| ` (nie `??`), aby prazdny string z envu spadol na default — inak
 *  `new URL("")` zhodi build kazdej stranky. */
export const SITE_DOMAIN =
  process.env.NEXT_PUBLIC_SITE_DOMAIN?.trim() || "linkovne.com";

/** Plna URL (pre redirecty, napr. Stripe success/cancel). */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() || `https://${SITE_DOMAIN}`;

/** Ako sa adresa profilu ukazuje v UI, napr. "linkovne.com/mia" */
export function profileLabel(username: string) {
  return `${SITE_DOMAIN}/${username}`;
}

/**
 * Zdielacie prefixy — pred meno sa da pridat jeden z tychto znakov a URL stale
 * vedie na ten isty profil (linkovne.com/mia === /@mia === /-mia === /~mia …).
 * Su to vyhradne znaky, ktore sa v mene NIKDY nevyskytuju (username je
 * [a-z0-9_.]), takze nemozu kolidovat s realnym menom. Vdaka tomu si tvorca
 * moze „striedat" adresu v bio a stale to vedie na jednu stranku.
 */
export const ALT_PREFIXES = ["@", "-", "~", "+", "$", "!"] as const;

/** Odstrani volitelny zdielaci prefix zo segmentu adresy ("@mia" → "mia"). */
export function stripAltPrefix(segment: string): string {
  const first = segment.charAt(0);
  return (ALT_PREFIXES as readonly string[]).includes(first)
    ? segment.slice(1)
    : segment;
}
