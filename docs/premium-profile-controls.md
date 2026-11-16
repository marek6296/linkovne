# Premium profile controls

Approved direction, 2026-11-16: translate Design Lab 01–09 into composable Pro/Business controls, not replacement client profiles.

- Composition: existing Portrait/Compact/Spotlight plus Cover and Editorial. Creator Grid uses paired links with full-width media, preserving block order and individual widths.
- Surface: default, soft depth, glass, dark contact. Editable caption below the profile header. No invented statistics or availability.
- Motion: separate entrance, hover lift/tilt, header colour reveal or half-turn; gentle automatic float/breathe. Flip keeps links outside its two faces. Reduced motion and keyboard/touch access.
- Social block: Classic, Dock, Pop and Side rail presentations independent of platform/colour. Every supported platform plus custom URL, label and icon. Rail slides from the desktop edge and becomes a scrollable floating menu on mobile; preview contains it inside its own surface. Pro gates in UI and server; existing Free data unchanged.
- Button treatment: existing controls plus soft-depth treatment and tile layout. Unlimited blocks on paid plans remain supported.
- Share one renderer for preview and public pages, bounded values and HTTPS media. Keep JSON storage compatibility; no DB migration or client data mutation during tests.

Verification: entitlement regression tests, actual header/block render tests, local isolated test profile for interaction/geometry/mobile, TypeScript. No production deployment in this task.

Implementation: nine premium presets under Templates; composable controls in Customise → Layout; Socials → Presentation. A dev-only `/design-lab/studio` uses the actual renderer and controls with local state. It cannot save client data. Cover upload is disabled there; use the authenticated editor for actual uploads.

Verified locally: 46 automated tests, TypeScript, all nine looks at 390px, long names in Cover/Editorial/Spotlight, reveal origin compared to the actual image centre, flip keyboard activation with links remaining outside, all 12 supported social destinations, contained mobile menu, Escape and desktop portal. No live profile writes or uploads performed. Additional rail blocks fall back to Dock to prevent floating controls colliding.
