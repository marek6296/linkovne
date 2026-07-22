import { NextResponse, type NextRequest } from "next/server";
import QRCode from "qrcode";

const USERNAME_RE = /^[a-z0-9_.]{3,30}$/;

export async function GET(request: NextRequest) {
  const username = (
    request.nextUrl.searchParams.get("u") ?? ""
  ).toLowerCase();
  const download = request.nextUrl.searchParams.get("download") === "1";

  if (!USERNAME_RE.test(username)) {
    return new NextResponse("Invalid username", { status: 400 });
  }

  const target = `${request.nextUrl.origin}/${username}`;

  const svg = await QRCode.toString(target, {
    type: "svg",
    margin: 1,
    width: 400,
    color: { dark: "#191813", light: "#ffffff" },
    errorCorrectionLevel: "M",
  });

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=86400",
      ...(download
        ? {
            "Content-Disposition": `attachment; filename="linkovne-${username}.svg"`,
          }
        : {}),
    },
  });
}
