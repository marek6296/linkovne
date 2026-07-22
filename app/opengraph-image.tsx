import { ImageResponse } from "next/og";
import { readFileSync } from "fs";
import { join } from "path";

/**
 * Site-level zdielaci nahlad (Open Graph) — logo vycentrovane na bielom 1200×630
 * platne, aby link na linkovne.com mal ostry, spravne velky preview.
 * Profilove stranky maju vlastnu kartu (app/[username]/opengraph-image.tsx),
 * takze tie sa nemenia.
 */
export const alt = "linkovne";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  const buf = readFileSync(join(process.cwd(), "public", "lk-mark.jpg"));
  const src = `data:image/jpeg;base64,${buf.toString("base64")}`;

  // Logo je 787×686 — zachovame pomer, vyska ~470.
  const h = 470;
  const w = Math.round(h * (787 / 686));

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#ffffff",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} width={w} height={h} alt="" />
      </div>
    ),
    { ...size },
  );
}
