"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { SphereGrid, type SpherePerson } from "./sphere-grid";
import sphereStyles from "./sphere-showcase.module.css";
import { ProfileHeader, BlockList } from "@/components/blocks/render";
import { resolveTheme, type Design } from "@/lib/design";
import type { Block } from "@/lib/blocks";
import styles from "./hero-showcase.module.css";

const LOOKS: { name: string; bio: string; links: string[]; design: Design }[] = [
  { name: "Elegant", bio: "A considered edit of style, travel & everyday life.", links: ["The summer wardrobe", "Postcards from the coast", "Collaborations & enquiries"], design: { bg: "solid", bgColor: "#ec4899", textColor: "#191813", font: "sans", fontHeading: "serif", btnBg: "#ffffff", btnText: "#191813", btnStyle: "fill", btnBorder: "none", btnShape: "soft", btnShadow: "subtle", btnWeight: "medium", avatarShape: "circle", avatarSize: "lg", avatarFrame: "none", profileLayout: "centered" } },
  { name: "Custom", bio: "Good outfits. Better destinations.", links: ["SHOP MY EDIT", "TRAVEL NOTES", "LET’S MAKE SOMETHING"], design: { bg: "solid", bgColor: "#6366f1", textColor: "#ffffff", font: "sans", fontHeading: "grotesk", btnBg: "#ffffff", btnText: "#191813", btnStyle: "fill", btnShape: "rounded", btnShadow: "hard", avatarShape: "rounded", avatarFrame: "none", profileLayout: "hero" } },
  { name: "Professional", bio: "Content creator & brand partner. Based in Lisbon, working worldwide.", links: ["Selected partnerships", "Media kit & audience", "Book a collaboration"], design: { bg: "solid", bgColor: "#262626", textColor: "#ffffff", font: "sans", fontHeading: "sans", btnBg: "#ffffff", btnText: "#262626", btnStyle: "fill", btnShape: "rounded", btnShadow: "none", avatarShape: "rounded", avatarSize: "md", avatarFrame: "none", profileLayout: "compact" } },
];

function ProfileDemo({ selected, person }: { selected: number; person: SpherePerson }) {
  const look = LOOKS[selected];
  const theme = resolveTheme("classic", look.design);
  const blocks: Block[] = [
    { id: "demo-social", type: "socials", position: 0, is_active: true, config: { items: [{ platform: "instagram", url: "https://instagram.com" }, { platform: "youtube", url: "https://youtube.com" }, { platform: "tiktok", url: "https://tiktok.com" }] } },
    ...look.links.map((title, i): Block => ({ id: `demo-${i}`, type: "link", position: i + 1, is_active: true, config: { title, url: "#", width: selected === 1 && i < 2 ? "half" : "full" } })),
  ];
  return (
    <div className={styles.profile} style={{ background: theme.page, color: theme.text, fontFamily: theme.font }}>
      <div className={styles.content}>
        <ProfileHeader displayName={person.name} username={person.name.toLowerCase().replace(/ /g, "")} bio={look.bio} avatarUrl={person.src} theme={theme} />
        <div className={styles.links} inert><BlockList blocks={blocks} theme={theme} profileId="landing-demo" preview /></div>
      </div>
      <span className={styles.brand}>Example profile · made with linkovne</span>
    </div>
  );
}

const NAMES = ["Emma Reed", "Noah Blake", "Mia Laurent", "Luca Hayes", "Ava Chen", "Leo Martin", "Isla Brooks", "Oliver King", "Chloe Parker", "Ethan Cole", "Zoe Rivera", "James West", "Nina Stone", "Theo Quinn", "Ella Scott", "Max Bennett", "Ruby Lane", "Finn Woods", "Lily Hart", "Alex Moore", "Clara Evans", "Sam Foster", "Amelia Ross", "Oscar Miles"];
const PEOPLE: SpherePerson[] = NAMES.map((name, i) => ({ id: `person-${i}`, name, src: `/demo-portraits/person-${i}.jpg`, look: i % 3 }));
PEOPLE.push({ id: "sofia", name: "Sofia Lane", src: "/sofia-lane.png", look: 0 });

function ProfileModal({ person, onClose }: { person: SpherePerson; onClose: () => void }) {
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
      <ProfileDemo selected={person.look} person={person} />
    </div>
  </dialog>, document.body);
}

export function HeroShowcase() {
  const [person, setPerson] = useState<SpherePerson | null>(null);
  return <>
    <SphereGrid images={PEOPLE} onSelect={setPerson} paused={!!person} />
    {person && <ProfileModal person={person} onClose={() => setPerson(null)} />}
  </>;
}
