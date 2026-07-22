"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { completeOnboarding, claimPendingInvite } from "@/app/onboarding/actions";
import type { RedeemGrant } from "@/app/dashboard/actions";
import { templateByKey } from "@/lib/templates";
import { SITE_DOMAIN } from "@/lib/site";
import { PLANS } from "@/lib/plans";
import { Wordmark } from "@/components/wordmark";
import { SquishyBg } from "@/components/squishy";
import { PlanWelcomeModal } from "@/components/settings/plan-welcome-modal";

const USERNAME_RE = /^[a-z0-9_.]{3,30}$/;
const TOTAL = 3;

// Novy (free) user si vzhlad nevybera — sablony su Pro/Business funkcia (v
// editore su za plan.customDesign). Kazdy zacina na cistom zakladnom vzhlade;
// upgrade neskor odomkne vsetky sablony.
const DEFAULT_TEMPLATE = templateByKey("paper")!;

/** Predajne body Pro — kratke, konkretne, zamerane na to co free nema. */
const PRO_POINTS = [
  "All templates & full design control",
  "Unlimited blocks & every block type",
  "Link gate — shields adult links from bots",
  "Escapes the Instagram in-app browser",
  "No Linkovne branding on your page",
  "30-day analytics, contact forms & AI builder",
];

export function Wizard({
  suggestedName,
  promoPrice,
  hasPendingInvite,
}: {
  suggestedName: string;
  /** Znizena cena Pro z aktivnej promo akcie (napr. "€3.99") — inak null. */
  promoPrice: string | null;
  /** Prisiel cez /i/<code> este pred registraciou — kod caka v cookie. */
  hasPendingInvite: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState(suggestedName);
  const [bio, setBio] = useState("");
  const [promoCode, setPromoCode] = useState("");
  // Vybral si Pro v kroku 2 → po vytvoreni stranky ho posleme do checkoutu.
  const [wantsPro, setWantsPro] = useState(false);

  // Invite kod z linku sa uplatni HNED (nie az na konci onboardingu), aby
  // krok 2 (Pro ponuka) vedel byt preskoceny pre niekoho, kto uz Pro/Business
  // dostane zadarmo. Okno sa ukaze len raz, ked sa naozaj nieco pridelilo.
  const [invitedGrant, setInvitedGrant] = useState<RedeemGrant | null>(null);
  useEffect(() => {
    if (!hasPendingInvite) return;
    claimPendingInvite().then((grant) => {
      if (grant) setInvitedGrant(grant);
    });
    // Spusti sa raz pri nacitani — cookie je aj tak jednorazova.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Krokov je menej, ked uz Pro/Business ponuku netreba ukazovat.
  const visibleSteps = hasPendingInvite ? [1, 3] : [1, 2, 3];
  const stepIndex = visibleSteps.indexOf(step) + 1;

  function next() {
    setError(null);
    if (step === 1) {
      const u = username.trim().toLowerCase();
      if (!USERNAME_RE.test(u)) {
        setError("Use 3–30 characters: lowercase letters, numbers, . or _");
        return;
      }
    }
    const idx = visibleSteps.indexOf(step);
    setStep(visibleSteps[Math.min(visibleSteps.length - 1, idx + 1)]);
  }

  function back() {
    setError(null);
    const idx = visibleSteps.indexOf(step);
    setStep(visibleSteps[Math.max(0, idx - 1)]);
  }

  function pickPlan(pro: boolean) {
    setError(null);
    setWantsPro(pro);
    setStep(3);
  }

  function finish() {
    setError(null);
    startTransition(async () => {
      const res = await completeOnboarding({
        username: username.trim().toLowerCase(),
        template: DEFAULT_TEMPLATE.key,
        displayName,
        bio,
        // Linky si klient poskladas v dashboarde — onboarding drzime kratky.
        links: [],
        socials: [],
        promoCode: promoCode.trim() || undefined,
      });
      if (res.error) {
        setError(res.error);
        // Chyby mena patria do kroku 1
        if (res.error.toLowerCase().includes("address")) setStep(1);
        return;
      }

      // Vybral Pro (a nejde cez invite kod) → rovno do Stripe checkoutu.
      // Stranka uz existuje, takze aj ked platbu zrusi, ma hotovy free ucet.
      if (wantsPro && !promoCode.trim()) {
        try {
          const r = await fetch("/api/stripe/checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ plan: "pro" }),
          });
          const data = (await r.json().catch(() => null)) as {
            url?: string;
          } | null;
          if (r.ok && data?.url) {
            window.location.href = data.url;
            return;
          }
        } catch {}
      }
      router.push("/dashboard");
    });
  }

  const proPriceNum = PLANS.pro.price.replace("/mo", ""); // "€4.99"

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col px-6 py-8">
      {invitedGrant && (
        <PlanWelcomeModal
          granted={invitedGrant}
          onClose={() => setInvitedGrant(null)}
        />
      )}

      {/* Progress */}
      <div className="flex items-center gap-3">
        <Wordmark className="text-lg" />
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-line">
          <div
            className="h-full rounded-full bg-ink transition-all duration-300"
            style={{ width: `${(stepIndex / visibleSteps.length) * 100}%` }}
          />
        </div>
        <span className="text-xs text-faint">
          {stepIndex}/{visibleSteps.length}
        </span>
      </div>

      <div className="flex flex-1 flex-col justify-center py-10">
        {/* STEP 1 — address */}
        {step === 1 && (
          <div>
            <h1 className="font-grotesk text-3xl font-bold tracking-tight">
              Claim your address
            </h1>
            <p className="mt-1.5 text-soft">
              This is the link you&apos;ll put in your bio. You can change it
              later.
            </p>
            <div className="mt-8 flex items-stretch overflow-hidden rounded-xl border border-line bg-surface focus-within:border-ink">
              <span className="flex shrink-0 items-center whitespace-nowrap pr-0.5 pl-4 text-faint">
                {SITE_DOMAIN}/
              </span>
              <input
                autoFocus
                value={username}
                spellCheck={false}
                placeholder="yourname"
                onChange={(e) =>
                  setUsername(e.target.value.toLowerCase().replace(/\s/g, ""))
                }
                onKeyDown={(e) => e.key === "Enter" && next()}
                className="w-full bg-transparent py-3.5 pr-4 pl-0 caret-ink outline-none placeholder:text-faint"
              />
            </div>
          </div>
        )}

        {/* STEP 2 — plan (Pro pitch; Free = skip). Karta ma rovnaky vzhlad ako
            pricing na landingu — indigo „squishy" panel s nasim brandingom. */}
        {step === 2 && (
          <div>
            <h1 className="font-grotesk text-3xl font-bold tracking-tight">
              Protect your page from day one
            </h1>
            <p className="mt-1.5 text-soft">
              Most creators pick Pro — it&apos;s built to keep your links safe
              and your page yours.
            </p>

            <div className="sq-card group relative mt-7 flex flex-col overflow-hidden rounded-2xl bg-indigo-500 p-7 text-white shadow-lg">
              <div className="relative z-10">
                <div className="flex items-start justify-between gap-3">
                  <span className="inline-block w-fit rounded-full border border-white/25 bg-white/20 px-3 py-0.5 text-sm font-medium backdrop-blur-sm">
                    Pro{promoPrice ? " · deal" : " · popular"}
                  </span>
                  <div className="text-right font-mono leading-none font-black">
                    {promoPrice ? (
                      <>
                        <span className="mr-1.5 align-middle text-xl font-bold text-white/50 line-through">
                          {proPriceNum}
                        </span>
                        <span className="text-4xl">{promoPrice}</span>
                      </>
                    ) : (
                      <span className="text-4xl">{proPriceNum}</span>
                    )}
                    <span className="align-top text-base font-bold">/mo</span>
                  </div>
                </div>

                <ul className="mt-5 space-y-2 text-sm text-white/90">
                  {PRO_POINTS.map((p) => (
                    <li key={p} className="flex items-start gap-2.5">
                      <svg
                        viewBox="0 0 24 24"
                        className="mt-0.5 h-4 w-4 shrink-0"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden
                      >
                        <path d="m4.5 12.5 5 5 10-11" />
                      </svg>
                      {p}
                    </li>
                  ))}
                </ul>
              </div>

              <button
                type="button"
                onClick={() => pickPlan(true)}
                className="relative z-20 mt-6 rounded-full border-2 border-white bg-white py-3 text-center font-mono font-black text-neutral-800 uppercase transition-all duration-200 hover:bg-transparent hover:text-white"
              >
                Continue with Pro
              </button>
              <p className="relative z-20 mt-2.5 text-center text-xs text-white/75">
                Cancel anytime · Your page stays either way
              </p>

              <SquishyBg id={2} />
            </div>

            {/* Invite / promo kod — odomkne odmenu bez karty */}
            <div className="mt-4 flex items-center gap-2">
              <input
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                placeholder="Invite or promo code"
                spellCheck={false}
                className="field flex-1 py-2.5 text-sm tracking-wide uppercase placeholder:normal-case"
              />
              {promoCode.trim() && (
                <button
                  type="button"
                  onClick={() => pickPlan(false)}
                  className="btn-line shrink-0 px-4 py-2.5 text-sm"
                >
                  Redeem
                </button>
              )}
            </div>

            <p className="mt-5 text-center">
              <button
                type="button"
                onClick={() => pickPlan(false)}
                className="text-sm text-soft underline underline-offset-4 transition hover:text-ink"
              >
                No thanks — continue with Free
              </button>
            </p>
            <p className="mt-1.5 text-center text-xs text-faint">
              You can upgrade anytime from your dashboard.
            </p>
          </div>
        )}

        {/* STEP 3 — about you */}
        {step === 3 && (
          <div>
            <h1 className="font-grotesk text-3xl font-bold tracking-tight">
              Tell us who you are
            </h1>
            <p className="mt-1.5 text-soft">
              This shows at the top of your page. Links come next — you&apos;ll
              add them in your dashboard.
            </p>

            <div className="mt-6 space-y-3">
              <input
                autoFocus
                value={displayName}
                maxLength={60}
                placeholder="Display name"
                onChange={(e) => setDisplayName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && finish()}
                className="field py-3"
              />
              <textarea
                value={bio}
                rows={3}
                maxLength={160}
                placeholder="Short bio (optional)"
                onChange={(e) => setBio(e.target.value)}
                className="field py-3"
              />
            </div>
          </div>
        )}

        {error && (
          <p role="alert" className="alert-error mt-6">
            {error}
          </p>
        )}
      </div>

      {/* Nav */}
      <div className="flex items-center justify-between">
        {step > 1 ? (
          <button
            type="button"
            onClick={back}
            className="btn-quiet"
          >
            ← Back
          </button>
        ) : (
          <span />
        )}

        {step === 1 && (
          <button type="button" onClick={next} className="btn-ink">
            Continue
          </button>
        )}
        {step === TOTAL && (
          <button
            type="button"
            onClick={finish}
            disabled={pending}
            className="btn-ink disabled:opacity-60"
          >
            {pending
              ? "Building your page…"
              : wantsPro
                ? "Finish & upgrade"
                : "Finish"}
          </button>
        )}
      </div>
    </div>
  );
}
