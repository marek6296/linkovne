"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/logo";

export function LandingNav({ onLanding = true }: { onLanding?: boolean }) {
  const section = (id: string) => `${onLanding ? "" : "/"}#${id}`;
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
      <nav className="landing-nav-links" aria-label="Main navigation"><a href={section("features")}>Features</a><a href={section("pricing")}>Pricing</a><Link href="/guides">Guides</Link></nav>
      <div className="landing-nav-actions"><Link href="/login" className="landing-login">Log in</Link><Link href="/register" className="landing-button landing-button-small">Start free <span aria-hidden>↗</span></Link><button ref={button} className="landing-menu-button" aria-expanded={open} aria-controls="landing-menu" aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen(!open)}><span aria-hidden>{open ? "×" : "☰"}</span></button></div>
    </div>
    <nav id="landing-menu" className="landing-menu" style={{ maxHeight: "calc(100dvh - 120px)", overflowY: "auto" }} aria-label="More navigation" hidden={!open} onClick={event => { if ((event.target as HTMLElement).closest("a")) setOpen(false); }}>
      <div><h2>Explore Linkovne</h2><a href={section("features")}>Create your page <span>↗</span></a><a href={section("analytics")}>Analytics <span>↗</span></a><a href={section("domains")}>Custom domains <span>↗</span></a></div>
      <div><h2>Find out more</h2><Link href="/pricing">Plans & pricing <span>↗</span></Link><Link href="/features">All features <span>↗</span></Link><Link href="/about">About Linkovne <span>↗</span></Link><Link href="/guides">Creator guides <span>↗</span></Link><Link href="/vs">Compare alternatives <span>↗</span></Link><a href={section("faq")}>Frequently asked questions <span>↗</span></a><Link href="/login">Log in <span>↗</span></Link></div>
    </nav>
  </header>;
}

