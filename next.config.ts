import type { NextConfig } from "next";

/**
 * Security headers pre vsetky routes. CSP zamerne nepridavame (Next inline
 * skripty + Supabase/Stripe by potrebovali ladenie) — doplnit po launchi.
 */
const securityHeaders = [
  // HTTPS only, aj pre subdomeny (Vercel posiela HSTS, ale bez includeSubDomains).
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },
  // Zakaze MIME sniffing (subory sa interpretuju len podla Content-Type).
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Clickjacking ochrana — stranku smie iframovat len nas vlastny origin.
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // Von posielame len origin (nie cele URL s username/query).
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Nepouzivame kameru/mikrofon/polohu — explicitne vypnute.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
