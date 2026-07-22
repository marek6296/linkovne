/**
 * Zdielane prvky „squishy" estetiky (farebne karty s animovanym pozadim).
 * Pouziva ich pricing aj landing (features/CTA), nech to cele sedi do seba.
 * Cely efekt je CSS (viz .sq-* v globals.css) — ziadna zavislost.
 */

export const SQUISHY_BG = [
  "bg-neutral-800",
  "bg-indigo-500",
  "bg-pink-500",
] as const;

const FILL = "rgba(255,255,255,0.13)";

export function SquishyBg({ id }: { id: 1 | 2 | 3 }) {
  if (id === 1) {
    return (
      <svg
        viewBox="0 0 320 384"
        className="sq-svg sq-svg-1 absolute inset-0 z-0 h-full w-full"
        fill="none"
        aria-hidden
      >
        <circle className="sq-shape sq-c1" cx="160.5" cy="114.5" r="101.5" fill={FILL} />
        <ellipse
          className="sq-shape sq-e1"
          cx="160.5"
          cy="265.5"
          rx="101.5"
          ry="43.5"
          fill={FILL}
        />
      </svg>
    );
  }
  if (id === 2) {
    return (
      <svg
        viewBox="0 0 320 384"
        className="sq-svg sq-svg-2 absolute inset-0 z-0 h-full w-full"
        fill="none"
        aria-hidden
      >
        <rect className="sq-shape sq-r1" x="14" width="153" height="153" rx="15" fill={FILL} />
        <rect className="sq-shape sq-r2" x="155" width="153" height="153" rx="15" fill={FILL} />
      </svg>
    );
  }
  return (
    <svg
      viewBox="0 0 320 384"
      className="sq-svg sq-svg-3 absolute inset-0 z-0 h-full w-full"
      fill="none"
      aria-hidden
    >
      <path
        className="sq-shape sq-d1"
        d="M148.893 157.531C154.751 151.673 164.249 151.673 170.107 157.531L267.393 254.818C273.251 260.676 273.251 270.173 267.393 276.031L218.75 324.674C186.027 357.397 132.973 357.397 100.25 324.674L51.6068 276.031C45.7489 270.173 45.7489 260.676 51.6068 254.818L148.893 157.531Z"
        fill={FILL}
      />
      <path
        className="sq-shape sq-d2"
        d="M148.893 99.069C154.751 93.2111 164.249 93.2111 170.107 99.069L267.393 196.356C273.251 202.213 273.251 211.711 267.393 217.569L218.75 266.212C186.027 298.935 132.973 298.935 100.25 266.212L51.6068 217.569C45.7489 211.711 45.7489 202.213 51.6068 196.356L148.893 99.069Z"
        fill={FILL}
      />
      <path
        className="sq-shape sq-d3"
        d="M148.893 40.6066C154.751 34.7487 164.249 34.7487 170.107 40.6066L267.393 137.893C273.251 143.751 273.251 153.249 267.393 159.106L218.75 207.75C186.027 240.473 132.973 240.473 100.25 207.75L51.6068 159.106C45.7489 153.249 45.7489 143.751 51.6068 137.893L148.893 40.6066Z"
        fill={FILL}
      />
    </svg>
  );
}
