"use client";

import { useEffect } from "react";

/** Progressive enhancement: content is readable before JS and with reduced motion. */
export function LandingScrollReveal() {
  useEffect(() => {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    if (reduced.matches) return;
    const nodes = document.querySelectorAll<HTMLElement>(
      ".landing-feature > div, .spotlight-layout > div, .creator-gallery > h2, .landing-pricing > *, .landing-guide-section > *, .landing-faq, .landing-final-cta > *"
    );
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const node = entry.target as HTMLElement;
        node.classList.remove("scroll-awaiting");
        node.classList.add("scroll-arrived");
        observer.unobserve(node);
      }
    }, { threshold: 0, rootMargin: "0px 0px -40px 0px" });
    for (const node of nodes) {
      // Never hide content already painted in the viewport (including anchor navigation).
      if (node.getBoundingClientRect().top < innerHeight) continue;
      node.classList.add("scroll-awaiting");
      observer.observe(node);
    }
    const revealAll = () => { if (reduced.matches) { observer.disconnect(); nodes.forEach(n => n.classList.remove("scroll-awaiting")); } };
    reduced.addEventListener("change", revealAll);
    return () => { observer.disconnect(); reduced.removeEventListener("change", revealAll); nodes.forEach(n => n.classList.remove("scroll-awaiting", "scroll-arrived")); };
  }, []);
  return null;
}
