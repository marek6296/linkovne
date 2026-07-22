"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlanWelcomeModal } from "@/components/settings/plan-welcome-modal";
import type { RedeemGrant } from "@/app/dashboard/actions";

/**
 * Uvitacie okno po prichode na /dashboard?upgraded=1 — spolocny signal pre
 * dva rozdielne toky (invite link cez /i/<code> aj uspesny Stripe checkout).
 * Plan uz je v tomto momente ulozeny v DB, takze staci nacitat aktualny stav
 * uctu (viz dashboard/page.tsx) a zobrazit rovnaky modal ako pri promo kode.
 */
export function UpgradedWelcome({
  granted,
  cleanUrl,
}: {
  granted: RedeemGrant;
  /** URL bez ?upgraded=1 — nech refresh stranky uz modal znova neukaze. */
  cleanUrl: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(true);

  function close() {
    setOpen(false);
    router.replace(cleanUrl, { scroll: false });
  }

  if (!open) return null;
  return <PlanWelcomeModal granted={granted} onClose={close} />;
}
