# Member card carousel

- Source: `artifacts/jaguar-house/src/components/brand/member-card-carousel.tsx`
- Source implementation: lines 1–88; swipe threshold/exclusion rules 14–38,
  keyboard arrows 40–45, and linked club controls 47–85.
- Source styling: `artifacts/jaguar-house/src/app/globals.css` lines 1057–1069
  and final switcher overrides 5323–5352.
- Public export: `MemberCardCarousel`.
- API: active club and child card content.
- Behavior: presents kratom and cannabis card choices with swipe/navigation
  affordances while preserving the active club indication; ignores gestures that
  begin on controls and requires a 56px horizontal swipe.
- Dependencies: React touch/key handlers and standard links. The source uses
  Next navigation; the design-system port uses native links with an optional
  in-preview navigation callback.
- Direct consumers: `app/card/page.tsx` and `app/cannabis-card/page.tsx`.
- No source Storybook story or component-specific test was found.
- Chunk 2; pending.
