"use client";

import { useEffect, useRef, useState } from "react";
import { ProfileHeader, BlockList } from "@/components/blocks/render";
import { resolveTheme } from "@/lib/design";
import { templateByKey } from "@/lib/templates";
import type { Block } from "@/lib/blocks";
import styles from "./hero-showcase.module.css";

const LOOKS = [
  { name: "Editorial", template: "paper", layout: "centered", detail: "Serif type · soft corners · a timeless portrait", color: "#f4f1ea" },
  { name: "Studio", template: "mono", layout: "compact", detail: "Cobalt canvas · clean type · links in a grid", color: "#2548ef" },
  { name: "Cover", template: "mono", layout: "hero", detail: "Full-width photo · clean type · bold links", color: "#d1bba5" },
] as const;

function ProfileDemo({ selected }: { selected: number }) {
  const look = LOOKS[selected];
  const template = templateByKey(look.template)!;
  const theme = resolveTheme(template.theme, { ...template.design, ...(selected === 1 ? { bgColor: "#2548ef", textColor: "#ffffff", btnBg: "#ffffff", btnText: "#1835b5", font: "sans" as const, fontHeading: "sans" as const, btnShape: "rounded" as const, avatarShape: "rounded" as const, avatarFrame: "none" as const, avatarRing: false } : {}), profileLayout: look.layout });
  const blocks: Block[] = [
    { id: "demo-social", type: "socials", position: 0, is_active: true, config: { items: [{ platform: "instagram", url: "https://instagram.com" }, { platform: "youtube", url: "https://youtube.com" }, { platform: "tiktok", url: "https://tiktok.com" }] } },
    ...["The summer edit", "My travel diary", "Work with me"].map((title, i): Block => ({ id: `demo-${i}`, type: "link", position: i + 1, is_active: true, config: { title, url: "#", width: selected === 1 && i < 2 ? "half" : "full" } })),
  ];
  return (
    <div className={styles.profile} style={{ background: theme.page, color: theme.text, fontFamily: theme.font }}>
      <div className={styles.content}>
        <ProfileHeader displayName="Sofia Lane" username="sofia" bio="Personal style. Places worth saving." avatarUrl="/sofia-lane.png" theme={theme} />
        <div className={styles.links} inert><BlockList blocks={blocks} theme={theme} profileId="landing-demo" preview /></div>
      </div>
      <span className={styles.brand}>sofia’s corner of the internet / linkovne</span>
    </div>
  );
}

export function HeroShowcase() {
  const [selected, setSelected] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
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
    if (paused || hovered || reduced || !visible || !pageVisible) return;
    const timer = window.setInterval(() => setSelected(current => (current + 1) % LOOKS.length), 5500);
    return () => window.clearInterval(timer);
  }, [paused, hovered, reduced, visible, pageVisible]);

  return (
    <section ref={root} className={styles.showcase} aria-label="Linkovne profile designs" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <div className={styles.deck}>
        {LOOKS.map((look, index) => (
          <div key={look.name} className={styles.card} data-position={(index - selected + LOOKS.length) % LOOKS.length} aria-hidden={index !== selected} inert>
            <ProfileDemo selected={index} />
          </div>
        ))}
        <div className={styles.motionControls}>
          <button type="button" onClick={() => { setPaused(true); setSelected(current => (current + 1) % LOOKS.length); }} aria-label="Show next profile design">↗</button>
          {!reduced && <button type="button" onClick={() => setPaused(!paused)} aria-label={paused ? "Play profile animation" : "Pause profile animation"} aria-pressed={paused}>{paused ? "▷" : "Ⅱ"}</button>}
        </div>
      </div>
    </section>
  );
}
