"use client";

import { useEffect, useRef, useState } from "react";
import { ProfileHeader, BlockList } from "@/components/blocks/render";
import { resolveTheme, type Design } from "@/lib/design";
import type { Block } from "@/lib/blocks";
import styles from "./hero-showcase.module.css";

const LOOKS: { name: string; bio: string; links: string[]; design: Design }[] = [
  { name: "Elegant", bio: "A considered edit of style, travel & everyday life.", links: ["The summer wardrobe", "Postcards from the coast", "Collaborations & enquiries"], design: { bg: "solid", bgColor: "#ec4899", textColor: "#191813", font: "sans", fontHeading: "serif", btnBg: "#ec4899", btnText: "#191813", btnStyle: "outline", btnBorder: "thin", btnShape: "pill", btnShadow: "none", avatarShape: "circle", avatarSize: "lg", avatarFrame: "none", profileLayout: "centered" } },
  { name: "Custom", bio: "Good outfits. Better destinations.", links: ["SHOP MY EDIT", "TRAVEL NOTES", "LET’S MAKE SOMETHING"], design: { bg: "solid", bgColor: "#6366f1", textColor: "#ffffff", font: "sans", fontHeading: "grotesk", btnBg: "#ffffff", btnText: "#191813", btnStyle: "fill", btnShape: "rounded", btnShadow: "hard", avatarShape: "rounded", avatarFrame: "none", profileLayout: "hero" } },
  { name: "Professional", bio: "Content creator & brand partner. Based in Lisbon, working worldwide.", links: ["Selected partnerships", "Media kit & audience", "Book a collaboration"], design: { bg: "solid", bgColor: "#262626", textColor: "#ffffff", font: "sans", fontHeading: "sans", btnBg: "#ffffff", btnText: "#262626", btnStyle: "fill", btnShape: "rounded", btnShadow: "none", avatarShape: "rounded", avatarSize: "md", avatarFrame: "none", profileLayout: "compact" } },
];

function ProfileDemo({ selected }: { selected: number }) {
  const look = LOOKS[selected];
  const theme = resolveTheme("classic", look.design);
  const blocks: Block[] = [
    { id: "demo-social", type: "socials", position: 0, is_active: true, config: { items: [{ platform: "instagram", url: "https://instagram.com" }, { platform: "youtube", url: "https://youtube.com" }, { platform: "tiktok", url: "https://tiktok.com" }] } },
    ...look.links.map((title, i): Block => ({ id: `demo-${i}`, type: "link", position: i + 1, is_active: true, config: { title, url: "#", width: selected === 1 && i < 2 ? "half" : "full" } })),
  ];
  return (
    <div className={styles.profile} style={{ background: theme.page, color: theme.text, fontFamily: theme.font }}>
      <div className={styles.content}>
        <ProfileHeader displayName="Sofia Lane" username="sofia" bio={look.bio} avatarUrl="/sofia-lane.png" theme={theme} />
        <div className={styles.links} inert><BlockList blocks={blocks} theme={theme} profileId="landing-demo" preview /></div>
      </div>
      <span className={styles.brand}>sofia’s corner of the internet / linkovne</span>
    </div>
  );
}

export function HeroShowcase() {
  const [selected, setSelected] = useState(0);
  const [paused, setPaused] = useState(false);
  const [moving, setMoving] = useState(false);
  const [reduced, setReduced] = useState(true);
  const [visible, setVisible] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => setReduced(preference.matches);
    const updateVisibility = () => setPageVisible(!document.hidden);
    updateMotion();
    updateVisibility();
    preference.addEventListener("change", updateMotion);
    document.addEventListener("visibilitychange", updateVisibility);
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.2 });
    if (root.current) observer.observe(root.current);
    return () => {
      preference.removeEventListener("change", updateMotion);
      document.removeEventListener("visibilitychange", updateVisibility);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (paused || moving || reduced || !visible || !pageVisible) return;
    const timer = window.setInterval(() => setMoving(true), 5200);
    return () => window.clearInterval(timer);
  }, [paused, moving, reduced, visible, pageVisible]);

  return (
    <section ref={root} className={styles.showcase} aria-label="Linkovne profile designs">
      <div className={styles.deck} data-moving={moving}>
        {LOOKS.map((look, index) => {
          const position = (index - selected + LOOKS.length) % LOOKS.length;
          return <div key={look.name} className={styles.card} data-position={position} aria-hidden={position !== 0} inert={position !== 0}
            onAnimationEnd={(event) => {
              if (event.target !== event.currentTarget || position !== 0 || !moving) return;
              setSelected(current => (current + 1) % LOOKS.length);
              setMoving(false);
            }}>
            <ProfileDemo selected={index} />
          </div>;
        })}
        <div className={styles.motionControls}>
          <button type="button" disabled={moving} onClick={() => { if (reduced) setSelected(current => (current + 1) % LOOKS.length); else setMoving(true); }} aria-label="Show next profile design">↗</button>
          {!reduced && <button type="button" onClick={() => setPaused(!paused)} aria-label={paused ? "Play profile animation" : "Pause profile animation"} aria-pressed={paused}>{paused ? "▷" : "Ⅱ"}</button>}
        </div>
      </div>
    </section>
  );
}
