# Jaguar mark

- Source: `artifacts/jaguar-house/src/components/brand/jaguar-mark.tsx`
- Source implementation: lines 1–32; original logo element and accessible
  title behavior are lines 3–17; decorative paw rosette is lines 20–32.
- Source asset: `public/brand/jaguar-spk-emblem-crisp.webp`; `DESIGN.md`
  identifies `public/brand/jaguar-logo.webp` as the original logo asset.
- Source styling: `artifacts/jaguar-house/src/app/globals.css` lines 348–370
  (`.brand-emblem`) and 4182–4185 (landing logo placement); logo uses contain
  sizing and remains uncropped.
- Public exports: `JaguarMark`, `PawGlyph`.
- API: mark `size`, optional class and accessible title; small decorative paw
  rosette accepts its size.
- Behavior: original mark is rendered with `object-contain`, never cropped or
  redrawn; decorative use is hidden from assistive tech.
- Dependencies: retained original logo artwork.
- Direct consumers: `components/brand/welcome.tsx`, `ui.tsx`,
  `member-shell.tsx`, `app/not-found.tsx`, `pages/not-found.tsx`,
  `app/staff/page.tsx`, and `app/owner/page.tsx`.
- No source Storybook story or component-specific test was found.
- Chunk 1; pilot family.
