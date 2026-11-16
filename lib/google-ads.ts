/** Marketing measurement only. No identifiers from creator profiles or auth URLs. */
export const ADS_CONSENT_KEY = "linkovne:ads-consent";
export const ADS_CONSENT_EVENT = "linkovne:ads-consent-change";
export const ADS_CONVERSION_EVENT = "linkovne:creator-created";
const PENDING_KEY = "linkovne:ads-pending";
const SENT_KEY = "linkovne:ads-sent";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
type Store = Pick<Storage, "getItem" | "setItem" | "removeItem">;
export function adsPageAllowed(host: string, path: string): boolean {
  return host === "linkovne.com" && /^(\/|\/(about|pricing|features|guides|vs)(\/[a-z0-9-]+)?|\/(register|login|onboarding|privacy|terms))$/.test(path);
}
export function hasAdsConsent(raw: string | null): boolean {
  try { const v = JSON.parse(raw || "null"); return v?.version === 1 && v.choice === "granted"; } catch { return false; }
}
export function adsPageLocation(raw: string): string {
  const u = new URL(raw);
  const safe = new URL(u.origin + u.pathname);
  for (const key of ["gclid", "wbraid", "gbraid"]) {
    const value = u.searchParams.get(key);
    if (value && /^[a-zA-Z0-9_.~-]{1,512}$/.test(value)) safe.searchParams.set(key, value);
  }
  return safe.href;
}
export function queueConversion(store: Store, id: string): void {
  if ((UUID.test(id) || /^[a-f0-9]{64}$/.test(id)) && store.getItem(SENT_KEY) !== id) store.setItem(PENDING_KEY, id);
}
export function pendingConversion(store: Store): string | null {
  const id = store.getItem(PENDING_KEY);
  return id && (UUID.test(id) || /^[a-f0-9]{64}$/.test(id)) && store.getItem(SENT_KEY) !== id ? id : null;
}
export function acknowledgeConversion(store: Store, id: string): void {
  store.setItem(SENT_KEY, id); store.removeItem(PENDING_KEY);
}
/** Called only after the server confirms first-profile creation. Never blocks onboarding. */
export async function recordCreatorConversion(id?: string): Promise<void> {
  if (!id || typeof window === "undefined") return;
  try {
    if (!hasAdsConsent(localStorage.getItem(ADS_CONSENT_KEY))) return;
    queueConversion(sessionStorage, id);
    window.dispatchEvent(new Event(ADS_CONVERSION_EVENT));
    // Give the already-consented tag time to send before Stripe or dashboard navigation.
    await new Promise<void>(resolve => window.setTimeout(resolve, 1200));
  } catch { /* Storage disabled: the product still works. */ }
}
