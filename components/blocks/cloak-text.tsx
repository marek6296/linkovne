"use client";

import { useEffect, useState } from "react";

/**
 * Text, ktorý sa vloží do DOM až po mount (client-side). V SSR HTML — teda aj
 * pre crawlery/link-preview boty, ktoré JS nespúšťajú — nie je vôbec prítomný.
 * Reálny návštevník (s JS) ho po hydratácii vidí normálne. Používa sa v
 * Creator/Stealth mode na „cloak" bia pred detekciou platformy.
 */
export function CloakText({ text }: { text: string }) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  return ready ? <>{text}</> : null;
}
