"use client";

import { useRef, useState } from "react";

/**
 * Nativne video v bloku — ako pozadove video na landingu: autoplay, loop, bez
 * prehravaca. Okraje sa vyblednu cez `edge-fade` (mask-image = priehladnost),
 * takze splynu s AKYMKOLVEK pozadim temy — netreba farbu riesit rucne.
 *
 * Zvuk: prehliadace nepustia autoplay so zvukom, preto video vzdy nastartuje
 * ticho. Nezobrazujeme ziadne tlacidlo — zvuk sa da zapnut klikom priamo na
 * video (ak vobec nejaky zvuk ma). Klik zastavi bublanie, aby neaktivoval
 * pripadny odkaz okolo.
 */
export function VideoBlock({ src, controls = false }: { src: string; controls?: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);

  function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const v = ref.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
    if (!v.muted) void v.play().catch(() => {});
  }

  return (
    <video
      ref={ref}
      src={src}
      onClick={controls ? undefined : toggle}
      controls={controls}
      preload="metadata"
      aria-label={muted ? "Tap for sound" : "Mute"}
      className="edge-fade w-full cursor-pointer select-none"
      autoPlay={!controls}
      loop
      muted
      playsInline
    />
  );
}
