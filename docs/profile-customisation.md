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
| Image-based premium templates | Preview only | Yes | Yes |
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

Individual link-block animation and glass/gradient overrides are gated in editor controls, but `saveBlocks` and public block rendering do not apply the page-design plan sanitizer to those fields. Existing saved overrides can therefore survive a downgrade. This audit records the discrepancy; this typography change does not introduce a new server restriction that could change existing client pages. Resolve it together with the next entitlement decision and use a shared block-config sanitizer for save and public rendering.

## Verification

- Regression tests for bounded presets, layout-specific alignment, safe cover corners, Free Off settings and shared header rendering.
- Browser: all three layouts, longest supported bio and a long unbroken name at maximum sizes, 280 px profile content, 390 px mobile editor and desktop.
- Keyboard sliders expose readable size labels; alignment buttons expose pressed state.
- Tested on an isolated temporary UI with synthetic content; no real client drafts or published profiles modified. Temporary route removed after verification.
