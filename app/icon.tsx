import { ImageResponse } from "next/og";
import { readFileSync } from "fs";
import { join } from "path";

/**
 * Favicon (ikonka v tabe prehliadaca) — logo na bielom, ZAOBLENOM stvorci.
 * Rohy su transparentne, takze na tmavom tabe nevyzera tvrdy hranaty stvorec.
 * Generuje sa dynamicky (next/og), lebo staticky orez rohov nemame cim spravit.
 */
export const size = { width: 256, height: 256 };
export const contentType = "image/png";

export default function Icon() {
  const buf = readFileSync(join(process.cwd(), "public", "lk-mark.jpg"));
  const src = `data:image/jpeg;base64,${buf.toString("base64")}`;

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
          borderRadius: 56, // ~22 % — jemne zaoblenie ako app ikona
          overflow: "hidden",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} width={218} height={190} alt="" />
      </div>
    ),
    { ...size },
  );
}
