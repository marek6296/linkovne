# Profile customisation

Reviewed 2026-11-16. Implementation sources: `lib/plans.ts`, `lib/design-tiers.ts`, `lib/design.ts`, `lib/templates.ts`, editor controls and server save/public rendering paths.

## Current entitlement map

| Setting | Free | Pro | Business |
| --- | --- | --- | --- |
| Portrait, Compact, Spotlight layouts | Yes | Yes | Yes |
| Themes, solid/gradient backgrounds, colours | Yes | Yes | Yes |
| Font families; name, username and bio sizes | Yes | Yes | Yes |
| Spotlight text alignment | Yes | Yes | Yes |
| Photo proportions, size, crop position and basic shapes | Yes | Yes | Yes |
| Basic button styles, shape, size, spacing, text size | Yes | Yes | Yes |
| Image backgrounds | No | Yes | Yes |
| Custom glass/gradient buttons and automatic motion | No | Yes | Yes |
| Photo frames and custom desktop backgrounds | No | Yes | Yes |
| Templates | Paper and Mono | All | All |
| Video profile photo and background | No | Yes | Yes |
| Hide Linkovne branding | No | Yes | Yes |
| Profiles | 1 | 4 | 10 |
| Custom domains | No | No | Yes |

Business shares Pro's visual controls. Existing theme presets may already include effects; the gate applies to custom overrides, not the preset itself. No existing paid entitlement was moved in this iteration. New typography controls are basic customisation, available on all plans.

## Layout behaviour

- Text tab groups independent name/username/bio sizes, then alignment and collapsible font choices.
- Four bounded size presets; invalid saved values fall back to existing defaults. No arbitrary CSS input.
- Spotlight supports left/centre/right. Portrait stays centred and Compact stays beside the avatar. Switching layouts preserves the saved Spotlight alignment for a later return.
- Changing colour themes preserves typography settings. Reset/template selection intentionally resets the design.
- Spotlight offers rounded or square cover corners, not circular/organic crops that would clip identity text. Legacy circle/organic values render safely rounded without destroying the saved avatar shape.
- Cover proportions and height are minimums: long text expands the cover in normal flow. Preview and public pages share ProfileHeader.
- Free publishing ignores inactive paid settings: animation Off, frame None, desktop Auto and a leftover background image after switching to solid. Explicit None remains None after server filtering.

## Follow-up before changing plan packaging

New per-link animations now require Pro on the server as well as in the editor. Existing stored animation values are allowed unchanged for Free profiles; changing to Off is allowed. Glass/gradient per-link style enforcement remains a separate follow-up; this iteration does not change those entitlements.

Template restriction applies to selecting a new preset, not to recognising or stripping an existing saved design. Free keeps all existing basic customisation and all three layouts. Premium template clicks leave the current draft unchanged.

Video is stored in design fields separate from the original photo. MP4/WebM, max 15 seconds and 10 MB; a JPEG poster is generated before upload. Preview and public rendering share the same silent loop component, pausing offscreen, in hidden tabs and for reduced motion. Free server filtering excludes video fields. Upload uses existing authenticated Storage paths; no schema or bucket changes. The player was tested with local media; an actual authenticated Storage upload is still to be verified with a disposable test account.

## Verification

- Regression tests for bounded presets, layout-specific alignment, safe cover corners, Free Off settings and shared header rendering.
- Browser: all three layouts, longest supported bio and a long unbroken name at maximum sizes, 280 px profile content, 390 px mobile editor and desktop.
- Keyboard sliders expose readable size labels; alignment buttons expose pressed state.
- Tested on an isolated temporary UI with synthetic content; no real client drafts or published profiles modified. Temporary route removed after verification.
