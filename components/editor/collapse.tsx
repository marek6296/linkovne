/**
 * Zdielane rozklikavanie pre cely editor — jedna animacia, jeden vzhlad.
 * Pouziva grid-rows 0fr->1fr trik (viz .lk-collapse v globals.css): vyska sa
 * anima hladko bez merania v JS a obsah sa pritom jemne vynori.
 */
export function Collapse({
  open,
  children,
}: {
  open: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`lk-collapse ${open ? "is-open" : ""}`}>
      <div className="lk-collapse-inner">{children}</div>
    </div>
  );
}

/** Sipka, ktora sa plynulo otoci pri otvoreni. */
export function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`h-4 w-4 shrink-0 text-faint transition-transform ${
        open ? "rotate-180" : ""
      }`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
