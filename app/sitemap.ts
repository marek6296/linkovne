import type { MetadataRoute } from "next";
import { createPublicClient } from "@/lib/supabase/public";
import { SITE_URL } from "@/lib/site";
import { canIndexPublicProfile } from "@/lib/profile-indexing";
import { GUIDES } from "@/lib/guides";
import { COMPARE_SLUGS } from "@/lib/compare";

/**
 * Sitemap — staticke stranky + zverejnene profily, ktore chcu byt v Google
 * (is_indexable). Regeneruje sa raz za hodinu; anon klient vidi cez RLS
 * len published profily, takze drafty sa sem nedostanu.
 */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/pricing`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE_URL}/features`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/vs`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/about`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/guides`, changeFrequency: "monthly", priority: 0.8 },
    ...GUIDES.map(g => ({ url: `${SITE_URL}/guides/${g.slug}`, lastModified: new Date(`${g.updated}T00:00:00Z`), changeFrequency: "monthly" as const, priority: 0.8 })),
    {
      url: SITE_URL,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/register`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/privacy`,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/terms`,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    // Porovnavacie stranky — vysoka nakupna intencia ("linktree alternative").
    ...COMPARE_SLUGS.map((slug) => ({
      url: `${SITE_URL}/vs/${slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];

  try {
    // Pozn.: anon ma na profiles len column-level SELECT (bez updated_at),
    // takze lastModified vynechavame.
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("profiles")
      .select("username")
      .eq("is_published", true)
      .neq("is_indexable", false)
      .limit(5000);

    // creator_mode has no direct anon column grant. Read the existing public
    // RPC instead of broadening DB access; it also returns the effective plan.
    // Bounded parallel batches keep checks from flooding the public API.
    const profiles: MetadataRoute.Sitemap = [];
    const candidates = data ?? [];
    for (let i = 0; i < candidates.length; i += 10) {
      const batch = await Promise.all(candidates.slice(i, i + 10).map(async (p) => {
        const { data: rows, error } = await supabase.rpc("public_profile", { p_username: p.username });
        const profile = Array.isArray(rows) ? rows[0] : null;
        if (error || !canIndexPublicProfile(profile)) return null;
        return { url: `${SITE_URL}/${p.username}`, changeFrequency: "weekly" as const, priority: 0.6 };
      }));
      for (const profile of batch) if (profile) profiles.push(profile);
    }

    return [...staticPages, ...profiles];
  } catch {
    // DB vypadok nesmie zhodit sitemap — staticke stranky su vzdy k dispozicii.
    return staticPages;
  }
}
