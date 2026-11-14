"use client";

import { useState } from "react";
import Link from "next/link";
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

export function HeroShowcase() {
  const [selected, setSelected] = useState(0);
  const look = LOOKS[selected];
  const template = templateByKey(look.template)!;
  const theme = resolveTheme(template.theme, { ...template.design, ...(selected === 1 ? { bgColor: "#2548ef", textColor: "#ffffff", btnBg: "#ffffff", btnText: "#1835b5", font: "sans" as const, fontHeading: "sans" as const, btnShape: "rounded" as const, avatarShape: "rounded" as const, avatarFrame: "none" as const, avatarRing: false } : {}), profileLayout: look.layout });
  const blocks: Block[] = [
    { id: "demo-social", type: "socials", position: 0, is_active: true, config: { items: [{ platform: "instagram", url: "https://instagram.com" }, { platform: "youtube", url: "https://youtube.com" }, { platform: "tiktok", url: "https://tiktok.com" }] } },
    ...["The summer edit", "My travel diary", "Work with me"].map((title, i): Block => ({ id: `demo-${i}`, type: "link", position: i + 1, is_active: true, config: { title, url: "#", width: selected === 1 && i < 2 ? "half" : "full" } })),
  ];
  return (
    <section className={styles.showcase} aria-label="Explore Linkovne profile styles">
      <div className={styles.toolbar}><span>ONE CREATOR. YOUR WAY.</span><span>0{selected + 1} / 03</span></div>
      <div className={styles.display}>
        <div className={styles.browser}>
          <div className={styles.viewport}>
            <div key={look.name} className={styles.profile} style={{ background: theme.page, color: theme.text, fontFamily: theme.font }}>
              <div className={styles.content}>
                <ProfileHeader displayName="Sofia Lane" username="sofia" bio="Personal style. Places worth saving." avatarUrl="/sofia-lane.png" theme={theme} />
                <div className={styles.links} inert><BlockList blocks={blocks} theme={theme} profileId="landing-demo" preview /></div>
              </div>
              <span className={styles.brand}>sofia’s corner of the internet / linkovne</span>
            </div>
          </div>
        </div>
      </div>
      <div className={styles.options} role="group" aria-label="Choose a profile style">
        {LOOKS.map((item, index) => <button key={item.name} type="button" aria-pressed={selected === index} onClick={() => setSelected(index)} className={styles.option}><span className={styles.sample} style={{ background: item.color }} aria-hidden="true">{index === 0 ? "Aa" : index === 1 ? "Aa" : "↗"}</span><span>{item.name}</span><span className={styles.tick} aria-hidden="true">{selected === index ? "✓" : ""}</span></button>)}
      </div>
      <p className={styles.detail} aria-live="polite">{look.detail}</p>
      <div className={styles.bottom}><span>Real layouts. Made in Linkovne.</span><Link href="/register">Make it yours <span aria-hidden="true">↗</span></Link></div>
    </section>
  );
}
