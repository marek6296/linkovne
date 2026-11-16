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

Rail visibility follow-up: desktop editor previews now display the actual sliding icon rail rather than forcing the collapsed mobile control. Mobile toggle includes a visible “Social links” label. Verified real localhost public profile rail, isolated desktop preview and mobile open/Escape.

Latest follow-up: Side rail now occupies a dedicated, always-visible right-hand column beside the profile header in both preview and public rendering, including mobile. No viewport-fixed controls, footer overlap or expanding overlay. Long lists scroll within the column; Compact has a shorter rail. Browser-checked Spotlight, Cover and Compact (including long names), mobile overflow and public/preview placement. Cover selection is now visible in Templates for Cover layouts, Content → Profile, and Customise → Photo. Large tile text/icon alignment is centred; image cards retain their own layout. Cover upload uses the existing image upload pipeline; no real-client upload performed during verification.


## Profile motion refresh
- Every public profile, including Free, waits for its header images/font to settle (maximum 1.8 seconds for media) before a 1.1-second shell arrival and 1.15-second classic content arrival. Protected profiles additionally wait for their existing secure fetch. No artificial minimum wait; reduced-motion disables movement. Content animations pause while hidden, so entrance is not consumed during loading.
- Pro entrances: rise (1.35s), dissolve (1.5s), focus (1.35s), 3D unfold (1.45s), side glide (1.3s), curtain (1.45s). Classic remains available to everyone. Changing entrance remounts the presentation layer; Replay entrance repeats it without saving anything.
- Hover uses a separate header layer: lift, cursor-following 3D tilt, cursor spotlight, light sweep, soft zoom, colour reveal, half-turn. Flip now 1.15s and reveal 1.2s. Mouse tracking is rAF-limited and skipped for reduced motion/touch; flip/reveal retain tap/keyboard controls.
- Continuous motion uses a separate outer header layer: float 8s, breathe 10s, pendulum 10s, orbit 12s, levitation 9s. Existing intersection/visibility pause retained. Tilt/lift no longer compete with the entrance transform on profile-content.
- Verified each entrance CSS identity/timing, replay mid-animation state, all continuous durations/running state, pointer-dependent tilt matrix, mobile horizontal bounds, Free fallback and Pro allowlists. No client profile writes during verification.


## Whole-card scope correction
User clarified that motion means the entire outer profile card. ProfileEffects now wraps ProfileShell's main surface (background, controls, header, social rail, links and footer). Header no longer owns a second motion rig. Entrance is on a separate outer arrival wrapper; continuous on motion, hover on effects, and half-turn on turn. Flip hides the entire front accessibly and has a persistent return control. Preview permits the complete card to move without clipping. Verified one rig, whole-card/links/footer ancestry, 180° keyboard toggle/inert sides, mouse tilt, 390px desktop card and mobile bounds.

Layout catalogue order: Portrait, Compact (Free), then Cover, Editorial, Spotlight (Pro). New paid-layout changes are rejected server-side for Free. Existing saved Free Spotlight remains renderable and editable; no profile migration or overwrite. UI publish blocker receives the existing profile layout to preserve grandfathered users.
