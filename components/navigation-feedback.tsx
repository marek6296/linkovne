"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/** Feedback only; Next retains navigation, history, scroll and unsaved-change guards. */
export function NavigationFeedback() {
  const path = usePathname();
  const query = useSearchParams().toString();
  const [waiting, setWaiting] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => { setWaiting(false); clearTimeout(timer.current); }, [path, query]);
  useEffect(() => {
    const reset = () => { setWaiting(false); clearTimeout(timer.current); };
    const click = (event: MouseEvent) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null;
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      const url = new URL(anchor.href, location.href);
      if (url.origin !== location.origin || (url.pathname === location.pathname && url.search === location.search)) return;
      // Restricted to product navigation; public creator links keep their own behaviour.
      if (!document.querySelector(".landing, .auth-shell, .dashboard-studio, .admin-workspace")) return;
      setWaiting(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(reset, 10000);
    };
    document.addEventListener("click", click);
    window.addEventListener("pageshow", reset);
    window.addEventListener("popstate", reset);
    return () => { document.removeEventListener("click", click); window.removeEventListener("pageshow", reset); window.removeEventListener("popstate", reset); clearTimeout(timer.current); };
  }, []);
  return waiting ? <div className="navigation-progress" role="status" aria-label="Loading page"><span /></div> : null;
}
