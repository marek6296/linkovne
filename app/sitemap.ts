import type { MetadataRoute } from "next";
import { createPublicClient } from "@/lib/supabase/public";
import { SITE_URL } from "@/lib/site";
import { COMPARE_SLUGS } from "@/lib/compare";

/**
 * Sitemap — staticke stranky + zverejnene profily, ktore chcu byt v Google
 * (is_indexable). Regeneruje sa raz za hodinu; anon klient vidi cez RLS
 * len published profily, takze drafty sa sem nedostanu.
 */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
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

    const profiles: MetadataRoute.Sitemap = (data ?? []).map((p) => ({
      url: `${SITE_URL}/${p.username}`,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));

    return [...staticPages, ...profiles];
  } catch {
    // DB vypadok nesmie zhodit sitemap — staticke stranky su vzdy k dispozicii.
    return staticPages;
  }
}
