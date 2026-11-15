# Playful landing — local implementation

Goal: implement the approved pink/cobalt concept on localhost, remove decorative microcopy, use a rectangular navigation with softly rounded corners.

Scope: app/page.tsx and components/landing only. Reuse logo, demo portraits, plan facts, FAQ content, promo behavior and structured data. No changes to clients, editor, authentication or database. No push or deployment until Marek explicitly requests it.

- [x] Build scoped responsive landing, navigation, profile preview and theme selection.
- [x] Integrate existing pricing, FAQ, guides and comparison links.
- [x] Run existing tests and production build; inspect desktop/mobile navigation and layout in browser.
- [x] Leave development server running on localhost:3001; commit locally only.

Visual verification: no horizontal overflow at mobile widths; readable copy; menu keyboard/Escape behavior; reduced-motion support; real local links and preserved pricing anchor.

Validation: 21 existing tests pass, production build passes. Browser checked desktop and 375px mobile, menu open/Escape, Blue palette selection; mobile document width 375px with no horizontal overflow. Local dev server on port 3001.
