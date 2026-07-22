import type { Metadata } from "next";
import {
  Bricolage_Grotesque,
  Fraunces,
  Instrument_Sans,
  Instrument_Serif,
  Playfair_Display,
  Space_Mono,
  Manrope,
  Montserrat,
  Raleway,
  Lora,
  Cormorant_Garamond,
  Syne,
} from "next/font/google";
import "./globals.css";
import { BRAND_TITLE, SITE_URL } from "@/lib/site";

// Fonty rozhrania — nacitavaju sa vzdy
const sans = Instrument_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-instrument-sans",
});

const serif = Instrument_Serif({
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin", "latin-ext"],
  variable: "--font-instrument-serif",
});

const display = Fraunces({
  subsets: ["latin", "latin-ext"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
});

// Volitelne fonty pre klientske stranky. preload:false => subor sa stiahne
// az ked ho nejaky profil naozaj pouzije, takze verejne stranky ostanu rychle.
const grotesk = Bricolage_Grotesque({
  subsets: ["latin", "latin-ext"],
  variable: "--font-bricolage",
  preload: false,
});

const classic = Playfair_Display({
  subsets: ["latin", "latin-ext"],
  style: ["normal", "italic"],
  variable: "--font-playfair",
  preload: false,
});

const mono = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-space-mono",
  preload: false,
});

const manrope = Manrope({
  subsets: ["latin", "latin-ext"],
  variable: "--font-manrope",
  preload: false,
});

const montserrat = Montserrat({
  subsets: ["latin", "latin-ext"],
  variable: "--font-montserrat",
  preload: false,
});

const raleway = Raleway({
  subsets: ["latin", "latin-ext"],
  variable: "--font-raleway",
  preload: false,
});

const lora = Lora({
  subsets: ["latin", "latin-ext"],
  variable: "--font-lora",
  preload: false,
});

const cormorant = Cormorant_Garamond({
  weight: ["400", "600", "700"],
  subsets: ["latin", "latin-ext"],
  variable: "--font-cormorant",
  preload: false,
});

const syne = Syne({
  subsets: ["latin", "latin-ext"],
  variable: "--font-syne",
  preload: false,
});

const TITLE = `${BRAND_TITLE} — link in bio on your own domain`;
const DESCRIPTION =
  "All your links on one page, on a domain that's yours. Clean link-in-bio pages, private analytics, link protection and an AI builder. Free to start in two minutes.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    // Podstranky: "Log in · Linkovne" — brand v title, ale nie duplicitny
    template: `%s · ${BRAND_TITLE}`,
  },
  description: DESCRIPTION,
  keywords: [
    "link in bio",
    "bio link",
    "link in bio tool",
    "linktree alternative",
    "link in bio with custom domain",
    "link page for creators",
  ],
  openGraph: {
    type: "website",
    siteName: BRAND_TITLE,
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${serif.variable} ${display.variable} ${grotesk.variable} ${classic.variable} ${mono.variable} ${manrope.variable} ${montserrat.variable} ${raleway.variable} ${lora.variable} ${cormorant.variable} ${syne.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
