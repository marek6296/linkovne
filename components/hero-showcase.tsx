"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { SphereGrid } from "./sphere-grid";
import sphereStyles from "./sphere-showcase.module.css";
import { ProfileHeader, BlockList } from "@/components/blocks/render";
import { resolveTheme } from "@/lib/design";
import { DEMO_PROFILES, type DemoProfile } from "@/lib/demo-profiles";
import styles from "./hero-showcase.module.css";

function ProfileDemo({ person }: { person: DemoProfile }) {
  const theme = resolveTheme("classic", person.design);
  return (
    <div className={styles.profile} style={{ background: theme.page, color: theme.text, fontFamily: theme.font }}>
      <div className={styles.content}>
        <p className={styles.role}>{person.role}</p>
        <ProfileHeader displayName={person.name} username={person.name.toLowerCase().replace(/ /g, "")} bio={person.bio} avatarUrl={person.src} theme={theme} />
        <div className={styles.links} inert><BlockList blocks={person.blocks} theme={theme} profileId="landing-demo" preview /></div>
      </div>
      <span className={styles.brand}>Example profile · made with linkovne</span>
    </div>
  );
}

function ProfileModal({ person, onClose }: { person: DemoProfile; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.current?.showModal();
    return () => { document.body.style.overflow = overflow; previous?.focus(); };
  }, []);
  return createPortal(<dialog ref={dialog} className={sphereStyles.modal} aria-label={`${person.name} — example Linkovne profile`} onCancel={onClose} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div className={sphereStyles.modalCard}>
      <button type="button" className={sphereStyles.close} onClick={onClose} aria-label="Close profile">×</button>
      <ProfileDemo person={person} />
    </div>
  </dialog>, document.body);
}

export function HeroShowcase() {
  const [person, setPerson] = useState<DemoProfile | null>(null);
  return <>
    <SphereGrid images={DEMO_PROFILES} onSelect={selected => setPerson(DEMO_PROFILES.find(profile => profile.id === selected.id) ?? null)} paused={!!person} />
    {person && <ProfileModal person={person} onClose={() => setPerson(null)} />}
  </>;
}
