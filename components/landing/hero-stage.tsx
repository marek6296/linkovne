"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";

export function HeroStage() {
  const host = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!host.current || reduced === null) return;
    let cancelled = false;
    let dispose: (() => void) | undefined;
    import("./hero-world").then(({ createHeroWorld }) => createHeroWorld(host.current!, !reduced))
      .then(cleanup => { if (cancelled) cleanup(); else { dispose = cleanup; setReady(true); } })
      .catch(() => { /* Keep the static example when WebGL is unavailable. */ });
    return () => { cancelled = true; dispose?.(); };
  }, [reduced]);
  return <div className="hero-stage" role="img" aria-label="Animated examples of Linkovne pages for a photographer, musician, influencer, business and athlete">
    {!ready && <div className="hero-stage-fallback"><span>SOFIA<br/>LANE</span><p>Photography & travel</p><div>Explore my work ↗</div><div>Get in touch ↗</div></div>}
    <div ref={host} className="hero-stage-canvas" aria-hidden="true" />
  </div>;
}
