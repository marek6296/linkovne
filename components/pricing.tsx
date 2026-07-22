import Link from "next/link";
import { PLANS, PLAN_BULLETS } from "@/lib/plans";
import { SquishyBg } from "@/components/squishy";
import { UpgradeButton } from "@/components/upgrade-button";

/**
 * „Squishy" pricing — farebne karty s animovanym pozadim. Cely efekt je cisto
 * CSS (hover + transitions, viz .sq-* v globals.css), takze ziadna zavislost
 * na framer-motion a stranka ostava serverova.
 */

type CardDef = {
  key: "free" | "pro" | "business";
  price: string;
  per?: string;
  blurb: string;
  cta: string;
  bg: string;
  bgId: 1 | 2 | 3;
  popular?: boolean;
};

const CARDS: CardDef[] = [
  {
    key: "free",
    price: "€0",
    blurb: "Get your name and a clean page. See if it moves the needle.",
    cta: "Start free",
    bg: "bg-neutral-800",
    bgId: 1,
  },
  {
    key: "pro",
    price: "€4.99",
    per: "/mo",
    blurb: "For creators who monetise. Every protection, unlocked.",
    cta: "Go Pro",
    bg: "bg-indigo-500",
    bgId: 2,
    popular: true,
  },
  {
    key: "business",
    price: "€14.99",
    per: "/mo",
    blurb: "Run every profile from one login, one dashboard.",
    cta: "Get Business",
    bg: "bg-pink-500",
    bgId: 3,
  },
];

function Card({ def, promoPrice }: { def: CardDef; promoPrice?: string | null }) {
  const plan = PLANS[def.key];
  const bullets = PLAN_BULLETS[def.key].slice(0, 5);

  return (
    <div
      className={`sq-card group relative flex h-[30rem] w-80 shrink-0 flex-col overflow-hidden rounded-2xl p-7 text-white shadow-lg ${def.bg}`}
    >
      <div className="relative z-10 flex-1">
        <span className="inline-block w-fit rounded-full border border-white/25 bg-white/20 px-3 py-0.5 text-sm font-medium backdrop-blur-sm">
          {plan.label}
          {promoPrice ? " · deal" : def.popular ? " · popular" : ""}
        </span>

        <div className="sq-price my-3 origin-top-left font-mono text-6xl leading-[1.05] font-black">
          {promoPrice ? (
            <>
              <span className="mr-2 align-middle text-3xl font-bold text-white/55 line-through">
                {def.price}
              </span>
              {promoPrice}
            </>
          ) : (
            def.price
          )}
          {def.per && (
            <span className="align-top text-2xl font-bold">{def.per}</span>
          )}
        </div>

        <p className="text-[15px] text-white/90">{def.blurb}</p>

        <ul className="mt-4 space-y-1.5 text-sm text-white/85">
          {bullets.map((b) => (
            <li key={b} className="flex gap-2">
              <span aria-hidden>✓</span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </div>

      {def.key === "free" ? (
        <Link
          href="/register"
          className="relative z-20 mt-4 rounded-full border-2 border-white bg-white py-2.5 text-center font-mono font-black uppercase text-neutral-800 transition-all duration-200 hover:bg-transparent hover:text-white"
        >
          {def.cta}
        </Link>
      ) : (
        /* Platene plany idu rovno do Stripe Checkout; neprihlaseneho posle
           UpgradeButton na /register a plan si kupi z dashboardu. */
        <UpgradeButton
          plan={def.key}
          noteClassName="text-white/85"
          className="relative z-20 mt-4 w-full rounded-full border-2 border-white bg-white py-2.5 text-center font-mono font-black uppercase text-neutral-800 transition-all duration-200 hover:bg-transparent hover:text-white"
        >
          {def.cta}
        </UpgradeButton>
      )}

      <SquishyBg id={def.bgId} />
    </div>
  );
}

export function Pricing({
  proPromoPrice,
}: {
  proPromoPrice?: string | null;
}) {
  return (
    <div className="mt-10 flex w-full flex-wrap justify-center gap-5">
      {CARDS.map((def) => (
        <Card
          key={def.key}
          def={def}
          promoPrice={def.key === "pro" ? proPromoPrice : undefined}
        />
      ))}
    </div>
  );
}
