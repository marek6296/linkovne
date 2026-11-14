/** Namespaced UI preference in the signed-in user's metadata, never an ACL. */
export const PROFILE_ORDER_KEY = "linkovne_profile_order";

/** Ignore stale/foreign IDs and append newly created profiles in their original order. */
export function orderProfiles<T extends { id: string }>(
  profiles: readonly T[],
  saved: unknown,
): T[] {
  const remaining = new Map(profiles.map((profile) => [profile.id, profile]));
  const result: T[] = [];
  if (Array.isArray(saved)) {
    for (const id of saved) {
      if (typeof id !== "string") continue;
      const profile = remaining.get(id);
      if (!profile) continue;
      result.push(profile);
      remaining.delete(id);
    }
  }
  return [...result, ...remaining.values()];
}

export function validProfileOrder(
  value: unknown,
  ownedIds: readonly string[],
): value is string[] {
  if (!Array.isArray(value) || value.length === 0 || value.length > 100)
    return false;
  const owned = new Set(ownedIds);
  return (
    new Set(value).size === value.length &&
    value.every((id) => typeof id === "string" && owned.has(id))
  );
}
