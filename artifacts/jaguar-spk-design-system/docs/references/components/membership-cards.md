# Membership cards

- Sources: `artifacts/jaguar-house/src/components/brand/loyalty-card.tsx` and
  `artifacts/jaguar-house/src/components/brand/member-card-experience.tsx`
- Source implementation: `loyalty-card.tsx` lines 7–139 for the compact pass,
  141–199 for its local artwork, and `member-card-experience.tsx` lines 36–197
  for front/back face, stamp grid, status panel, QR states and action.
- Source styling: `artifacts/jaguar-house/src/app/globals.css` lines 4035–4180
  (`.collecting-track*`), 4515–4607 (`.member-pass-card*`), 4917–4981 and
  5358–5410 (final pass, stamps and dashboard status). Earlier card CSS is
  superseded by the later final selectors.
- Source assets: `public/brand/card-kratom-2026.webp`,
  `card-cannabis-2026.webp`, `jaguar-card-mark.webp`, `mark-jaguar.svg`,
  `mark-leaf.svg`, and the club-specific coins in `public/ui/stamps/`.
- Public exports: `LoyaltyCard`, `SharedMemberCard`, `LoyaltyProgress`,
  `CollectingTrack`, `LoyaltyCardArtwork`, `MemberCardFaces`, and
  `MemberStatusPanel`.
- API/data: club kind, member code, balance, QR state/retry callback, and
  progress animation key. Kratom and cannabis remain visually distinct while
  sharing card geometry.
- Behavior: ten progress positions with club-specific filled coins and empty
  slots, a reduced-motion-aware reward animation at ten points, QR loading/error
  states, a native accessible 240px QR enlargement dialog on a pure-white
  quiet zone, accessible progress, and a next action only when eligible.
- Dependencies: `qrcode.react`, BrandButton, BrandIcon, and retained card art.
- Direct consumers: `app/card/page.tsx` and
  `app/cannabis-card/page.tsx`; route data and balance logic remain outside
  these visual components.
- No source Storybook story or component-specific test was found.
- Chunk 1; pilot family.
- V3 preview: `CollectingTrack` now renders the ten-slot visual, explicit
  progress/readiness labels, and independent cannabis-green / kratom-gold
  accents. `src/preview/demos/collecting-track.tsx` owns local-only demo
  controls; it does not connect to a member balance or redeem API.
