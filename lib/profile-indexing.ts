import { planOf } from "@/lib/plans";

type PublicProfile = {
  snapshot: unknown;
  is_indexable: boolean;
  creator_mode: boolean;
  plan: string | null;
};

/** Mirror public-page noindex rules, including an inactive flag after downgrade. */
export function canIndexPublicProfile(profile: PublicProfile | null | undefined): boolean {
  return !!profile?.snapshot && profile.is_indexable === true &&
    !(profile.creator_mode && planOf(profile.plan).creatorMode);
}
