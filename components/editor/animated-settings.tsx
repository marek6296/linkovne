"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";

/** One live set of controls: resize its container without duplicating inputs or focus. */
export function AnimatedSettings({ children, view, className }: {
  children: ReactNode;
  view: string;
  className?: string;
}) {
  const content = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number>();
  const reduced = useReducedMotion();
  useLayoutEffect(() => {
    const node = content.current;
    if (!node) return;
    const measure = () => setHeight(node.getBoundingClientRect().height);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [view]);

  return (
    <motion.div initial={false} animate={{ height: height ?? "auto" }}
      transition={{ duration: reduced ? 0 : .38, ease: [.22, 1, .36, 1] }}
      className="overflow-hidden">
      <motion.div ref={content} key={view} className={className}
        initial={reduced ? false : { opacity: 0, y: 7 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduced ? 0 : .32, ease: [.22, 1, .36, 1] }}>
        {children}
      </motion.div>
    </motion.div>
  );
}
