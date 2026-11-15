import { ADS_FRAME_HTML } from "@/lib/google-ads-frame";

/** Isolated document: destroying the consented iframe also destroys Google's runtime. */
export async function GET() {
  return new Response(ADS_FRAME_HTML, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
      "Referrer-Policy": "no-referrer",
      "Content-Security-Policy": "frame-ancestors 'self'; base-uri 'none'; object-src 'none'",
    },
  });
}
