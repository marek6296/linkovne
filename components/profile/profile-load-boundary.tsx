"use client";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";

const ProfileReady = createContext<(ready: boolean) => void>(() => {});
export const useProfileReady = () => useContext(ProfileReady);

/** Public arrival is independent of Pro effects; protect content until its layout/media are ready. */
export function ProfileLoadBoundary({ pending, children, foreground }: { pending: boolean; children: ReactNode; foreground?: string }) {
  const [contentReady, setContentReady] = useState(!pending);
  const [ready, setReady] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!contentReady) { setReady(false); return; }
    let cancelled = false;
    let frame = 0;
    let timer: ReturnType<typeof setTimeout>;
    const photos = Array.from(root.current?.querySelectorAll<HTMLImageElement>(".profile-header-main img") ?? []);
    const assets = Promise.allSettled([...photos.map(photo => photo.decode()), document.fonts.ready]);
    // Slow or broken media must never prevent visitors reaching the links.
    Promise.race([assets, new Promise(resolve => { timer = setTimeout(resolve, 1800); })]).then(() => {
      if (cancelled) return;
      clearTimeout(timer);
      frame = requestAnimationFrame(() => { if (!cancelled) setReady(true); });
    });
    return () => { cancelled = true; clearTimeout(timer); cancelAnimationFrame(frame); };
  }, [contentReady]);
  return <ProfileReady.Provider value={setContentReady}>
    <div ref={root} className="profile-load-boundary" data-ready={ready} aria-busy={!ready}>
      {!ready && <div className="profile-load-status" style={{color: foreground}} role="status"><span className="profile-load-spinner" aria-hidden />Loading profile…</div>}
      <div className="profile-load-content" inert={!ready}>{children}</div>
    </div>
  </ProfileReady.Provider>;
}
