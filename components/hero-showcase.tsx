"use client";

import { useState } from "react";
import styles from "./hero-showcase.module.css";

export function HeroShowcase() {
  const [theme, setTheme] = useState(0);
  const [paused, setPaused] = useState(false);
  return (
    <div className={`${styles.scene} ${paused ? styles.paused : ""}`} data-theme={theme}>
      <div className={styles.orbit} aria-hidden="true" />
      <div className={styles.stage}>
        <div className={styles.address}><span>↗</span> linkovne.com/alex <span className={styles.live}>● Published</span></div>
        <div className={styles.phone}>
          <div className={styles.topline}><span>AM®</span><span>↗</span></div>
          <div className={styles.avatar}>a<span>m.</span></div>
          <h2>Alex Morgan</h2>
          <p>Visual creator. Always exploring.</p>
          <div className={styles.socials} aria-label="Example social links"><span>◎</span><span>𝕏</span><span>▷</span></div>
          <div className={`${styles.link} ${styles.featured}`}><span>✳</span><div>Explore my portfolio<small>A little outside the ordinary.</small></div><span>↗</span></div>
          <div className={styles.art}><div className={styles.sculpture} /><span>SELECTED WORK / 026</span><strong>New perspectives.</strong></div>
          <div className={styles.link}><span>↗</span><div>Let’s work together</div><span>↗</span></div>
          <div className={styles.link}><span>♡</span><div>My favourite things</div><span>↗</span></div>
          <div className={styles.brand}>Made with <b>linkovne</b></div>
        </div>
        <div className={styles.note}><span className={styles.check}>✓</span><div>Your world.<br /><strong>One beautiful link.</strong></div></div>
        <div className={styles.custom}><span>✳</span><div>YOUR STYLE<small>Unmistakably you.</small></div></div>
      </div>
      <div className={styles.controls}>
        <span>Make it yours</span>
        {["Cobalt", "Rose", "Forest"].map((name, i) => <button key={name} type="button" aria-label={`${name} theme`} aria-pressed={theme === i} onClick={() => setTheme(i)} className={styles.swatch} style={{ background: ["#a4b5ff", "#edb6cf", "#b9d5a5"][i] }} />)}
        <button type="button" className={styles.pause} onClick={() => setPaused(!paused)} aria-label={paused ? "Play animation" : "Pause animation"}>{paused ? "▶" : "Ⅱ"}</button>
      </div>
      <span className={styles.caption}>Example profile · built from Linkovne blocks</span>
    </div>
  );
}
