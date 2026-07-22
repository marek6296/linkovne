"use client";

import { useRef, useState } from "react";

/**
 * Nativne video v bloku — ako pozadove video na landingu: autoplay, loop, bez
 * prehravaca. Okraje sa vyblednu cez `edge-fade` (mask-image = priehladnost),
 * takze splynu s AKYMKOLVEK pozadim temy — netreba farbu riesit rucne.
 *
 * Zvuk: prehliadace nepustia autoplay so zvukom, preto video bezi ticho a je
 * tu jemny prepinac (tap-to-unmute). Ked video zvuk nema, tlacidlo je len
 * neskodne. Prepinac zastavi bublanie, aby neaktivoval pripadny odkaz okolo.
 */
export function VideoBlock({ src }: { src: string }) {
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
    <div className="relative">
      <video
        ref={ref}
        src={src}
        className="edge-fade w-full select-none"
        autoPlay
        loop
        muted
        playsInline
      />
      <button
        type="button"
        onClick={toggle}
        aria-label={muted ? "Unmute video" : "Mute video"}
        className="absolute right-3 bottom-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md transition hover:bg-black/60"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-[18px] w-[18px]"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M11 5 6 9H2v6h4l5 4V5z" />
          {muted ? (
            <>
              <path d="m23 9-6 6" />
              <path d="m17 9 6 6" />
            </>
          ) : (
            <>
              <path d="M15.5 8.5a5 5 0 0 1 0 7" />
              <path d="M19 5a9 9 0 0 1 0 14" />
            </>
          )}
        </svg>
      </button>
    </div>
  );
}
