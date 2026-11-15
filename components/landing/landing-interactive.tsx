"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/logo";

export function LandingNav() {
  const [open, setOpen] = useState(false);
  const nav = useRef<HTMLElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    function escape(event: KeyboardEvent) {
      if (event.key === "Escape") { setOpen(false); button.current?.focus(); }
    }
    function outside(event: PointerEvent) {
      if (!nav.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("keydown", escape);
    document.addEventListener("pointerdown", outside);
    return () => { document.removeEventListener("keydown", escape); document.removeEventListener("pointerdown", outside); };
  }, [open]);
  return <header className="landing-nav-wrap" ref={nav}>
    <div className="landing-nav">
      <Link href="/" aria-label="Linkovne home"><Logo className="landing-logo" /></Link>
      <nav className="landing-nav-links" aria-label="Main navigation"><a href="#features">Features</a><a href="#pricing">Pricing</a><Link href="/guides">Guides</Link></nav>
      <div className="landing-nav-actions"><Link href="/login" className="landing-login">Log in</Link><Link href="/register" className="landing-button landing-button-small">Start free <span aria-hidden>↗</span></Link><button ref={button} className="landing-menu-button" aria-expanded={open} aria-controls="landing-menu" aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen(!open)}><span aria-hidden>{open ? "×" : "☰"}</span></button></div>
    </div>
    <nav id="landing-menu" className="landing-menu" aria-label="More navigation" hidden={!open} onClick={event => { if ((event.target as HTMLElement).closest("a")) setOpen(false); }}>
      <div><h2>Explore Linkovne</h2><a href="#features">Create your page <span>↗</span></a><a href="#analytics">Analytics <span>↗</span></a><a href="#domains">Custom domains <span>↗</span></a></div>
      <div><h2>Find out more</h2><a href="#pricing">Plans & pricing <span>↗</span></a><Link href="/guides">Creator guides <span>↗</span></Link><Link href="/vs">Compare alternatives <span>↗</span></Link><a href="#faq">Frequently asked questions <span>↗</span></a><Link href="/login">Log in <span>↗</span></Link></div>
    </nav>
  </header>;
}

export function ProfileScene({ editable = false }: { editable?: boolean }) {
  const [color, setColor] = useState("#ffe7f2");
  return <div className={`landing-scene${editable ? " landing-scene-editor" : ""}`}>
    <div className="landing-orb" aria-hidden /><div className="landing-back-card" aria-hidden /><div className="landing-ring" aria-hidden />
    <div className="landing-phone" style={{ backgroundColor: color }}>
      {/* Local fictional demo portrait; not a customer profile. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/demo-portraits/person-0.jpg" alt="Emma Reed, example creator" width="96" height="96" className="landing-avatar" />
      <h3>Emma Reed</h3><p>Style, travel & everyday life.</p>
      <div className="landing-socials" aria-label="Example social channels"><span>ig</span><span>♪</span><span>▶</span></div>
      <div className="landing-profile-link">Shop my favourites <span>↗</span></div><div className="landing-profile-link">The weekly edit <span>↗</span></div><div className="landing-profile-link">Work with me <span>↗</span></div>
      <span className="landing-profile-brand">linkovne</span>
    </div>
    {editable ? <fieldset className="landing-palette"><legend>Pick a colour</legend><div>{[{color:"#ffe7f2",name:"Pink"},{color:"#c9d2ff",name:"Blue"},{color:"#ffedbc",name:"Cream"}].map(c => <button key={c.name} type="button" aria-label={c.name} aria-pressed={c.color===color} onClick={()=>setColor(c.color)} style={{backgroundColor:c.color}} />)}</div></fieldset> : <div className="landing-address">linkovne.com/emma <span aria-hidden>↗</span></div>}
    <div className="landing-orb landing-orb-small" aria-hidden />
  </div>;
}
