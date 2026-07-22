import { ImageResponse } from "next/og";
import { createPublicClient } from "@/lib/supabase/public";
import { SITE_DOMAIN } from "@/lib/site";

export const alt = "Linkovne profile";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const USERNAME_RE = /^[a-z0-9_.]{3,30}$/;

/**
 * Zdielaci nahlad (Open Graph) verejneho profilu. Doteraz sa pouzival len
 * avatar — profil bez avatara nemal ziadny nahlad. Teraz kazdy zdielany link
 * dostane brandovanu kartu: avatar/iniciala + meno + linkovne.com/username.
 */
export default async function OgImage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username: raw } = await params;
  const username = (raw ?? "").toLowerCase();

  let name = username;
  let avatar: string | null = null;
  let bio: string | null = null;

  if (USERNAME_RE.test(username)) {
    try {
      const supabase = createPublicClient();
      const { data } = await supabase.rpc("public_profile", {
        p_username: username,
      });
      const row = Array.isArray(data) ? data[0] : null;
      const snap = row?.snapshot;
      if (snap) {
        name = snap.display_name || username;
        avatar = /^https:\/\//i.test(snap.avatar_url ?? "")
          ? snap.avatar_url
          : null;
        bio = (snap.bio ?? "").slice(0, 90) || null;
      }
    } catch {
      /* fallback na genericku kartu */
    }
  }

  const initial = (name || "L").charAt(0).toUpperCase();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f8f5f7",
          backgroundImage:
            "radial-gradient(900px 500px at 50% -10%, #fde0ec 0%, transparent 60%)",
          fontFamily: "sans-serif",
          padding: 80,
        }}
      >
        {avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatar}
            alt=""
            width={220}
            height={220}
            style={{
              width: 220,
              height: 220,
              borderRadius: 9999,
              objectFit: "cover",
              boxShadow: "0 30px 60px -20px rgba(20,10,20,0.4)",
            }}
          />
        ) : (
          <div
            style={{
              width: 220,
              height: 220,
              borderRadius: 9999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#191813",
              color: "#f8f5f7",
              fontSize: 110,
              fontWeight: 800,
              boxShadow: "0 30px 60px -20px rgba(20,10,20,0.4)",
            }}
          >
            {initial}
          </div>
        )}

        <div
          style={{
            marginTop: 48,
            fontSize: 68,
            fontWeight: 800,
            color: "#191813",
            letterSpacing: -1,
            textAlign: "center",
          }}
        >
          {name}
        </div>

        <div style={{ marginTop: 14, fontSize: 32, color: "#8a5cf6" }}>
          {`${SITE_DOMAIN}/${username}`}
        </div>

        {bio && (
          <div
            style={{
              marginTop: 20,
              fontSize: 26,
              color: "#5c5a52",
              textAlign: "center",
              maxWidth: 760,
            }}
          >
            {bio}
          </div>
        )}

        <div
          style={{
            position: "absolute",
            bottom: 44,
            display: "flex",
            alignItems: "center",
            fontSize: 26,
            color: "#94928a",
          }}
        >
          <span>Made with&nbsp;</span>
          <span style={{ fontWeight: 800, color: "#191813" }}>linkovne</span>
          <span style={{ color: "#ec4899" }}>.</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
