"use client";
import { createContext, useContext, useState, type ReactNode } from "react";

const ProfileReady = createContext<(ready: boolean) => void>(() => {});
export const useProfileReady = () => useContext(ProfileReady);

/** Keep the entire protected profile out of view until its client content is laid out. */
export function ProfileLoadBoundary({ pending, children, foreground }: { pending: boolean; children: ReactNode; foreground?: string }) {
  const [ready, setReady] = useState(!pending);
  return <ProfileReady.Provider value={setReady}>
    <div className="profile-load-boundary" data-ready={ready} aria-busy={!ready}>
      {!ready && <div className="profile-load-status" style={{color: foreground}} role="status"><span className="profile-load-spinner" aria-hidden />Loading profile…</div>}
      <div className="profile-load-content" inert={!ready}>{children}</div>
    </div>
  </ProfileReady.Provider>;
}
