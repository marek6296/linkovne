/**
 * Monochromaticky Linkovne mark — prstenec s „L" a bodkou (echo loga), cely v
 * `currentColor`, bez pozadia. Vhodny do malych buttonov a badge na akejkolvek
 * teme (dedi farbu textu rodica), na rozdiel od PNG loga s bielym pozadim.
 */
export function LogoMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      {/* Prstenec otvoreny vpravo dole */}
      <circle
        cx="12"
        cy="12"
        r="8.4"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeDasharray="41 12"
        transform="rotate(24 12 12)"
      />
      {/* Monogram L */}
      <path
        d="M9.6 7.1v7.3h5.2"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Bodka pri otvore prstenca */}
      <circle cx="17.7" cy="17.7" r="1.7" fill="currentColor" />
    </svg>
  );
}
