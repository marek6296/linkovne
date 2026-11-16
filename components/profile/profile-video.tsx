"use client";
import { useEffect, useRef, type CSSProperties } from "react";

/** Decorative, silent media. Pause offscreen, in background tabs and for reduced motion. */
export function ProfileVideo({ src, poster, className, style }: {
  src: string; poster?: string; className?: string; style?: CSSProperties;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    let visible = false;
    const sync = () => {
      if (visible && !document.hidden && !reduced.matches) void video.play().catch(() => {});
      else video.pause();
    };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); });
    observer.observe(video);
    reduced.addEventListener("change", sync);
    document.addEventListener("visibilitychange", sync);
    return () => { observer.disconnect(); reduced.removeEventListener("change", sync); document.removeEventListener("visibilitychange", sync); video.pause(); };
  }, [src]);
  return <video ref={ref} src={src} poster={poster} muted loop playsInline preload="none" aria-hidden className={className} style={style} />;
}
