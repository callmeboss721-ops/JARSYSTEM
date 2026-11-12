# Brand button

- Source: `artifacts/jaguar-house/src/components/brand/brand-button.tsx`
- Source implementation: lines 1–67; art map 4–12, props 14–23, button/link
  rendering 25–67.
- Source styling: `artifacts/jaguar-house/src/app/globals.css` lines 3167–3283
  (`.brand-button`, label, disabled/focus/hover, mobile sizing, reduced motion),
  with landing-specific sizes at 5661–5671.
- Source assets: `public/ui/btn-jaguar.webp`, `btn-leaf.webp`,
  `btn-leaf-cannabis.webp`, `btn-frame.webp`, and `btn-crown.webp`.
- Public exports: `BrandButton`, `BrandButtonArt`.
- API: image treatment, short label, optional href, button type, disabled state,
  click callback, class, and test id.
- Behavior: link or button semantics match the supplied href/type; disabled
  actions remain visibly and semantically disabled.
- Dependencies: retained button artwork.
- Direct consumers: `components/brand/welcome.tsx`, `auth-forms.tsx`, and
  `member-card-experience.tsx`.
- No source Storybook story or component-specific test was found.
- Chunk 1; pilot family.
