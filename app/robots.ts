import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * robots.txt — verejne stranky indexovat, appku a API nie.
 * Profily s vypnutym is_indexable maju vlastny noindex v metadata,
 * tu ich blokovat netreba (a ani nemozno — su to dynamicke cesty).
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/dashboard",
          "/admin",
          "/api/",
          "/onboarding",
          "/auth/",
          "/reset",
          "/forgot",
          "/r/",
          "/i/",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
