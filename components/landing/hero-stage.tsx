"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useReducedMotion } from "motion/react";

export function HeroStage() {
  const host = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!host.current || reduced === null) return;
    setReady(false);
    setFailed(false);
    let cancelled = false;
    let dispose: (() => void) | undefined;
    import("./hero-world").then(({ createHeroWorld }) => createHeroWorld(host.current!, !reduced))
      .then(cleanup => { if (cancelled) cleanup(); else { dispose = cleanup; setReady(true); } })
      .catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; dispose?.(); };
  }, [reduced]);
  return <div className="hero-stage" role="img" aria-label="Animated examples of Linkovne pages for a photographer, musician, influencer, business and athlete">
    {failed && <div className="hero-stage-poster"><Image src="/landing/hero-sofia.webp" alt="Sofia Lane, example creator" fill sizes="(max-width:760px) 80vw, 400px" /></div>}
    <div ref={host} className={`hero-stage-canvas${ready ? " is-ready" : ""}`} aria-hidden="true" />
  </div>;
}
