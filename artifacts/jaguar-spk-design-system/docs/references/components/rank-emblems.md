# Rank emblems

- Source: `artifacts/jaguar-house/src/components/brand/rank-emblem.tsx`
- Source implementation: lines 4–27 (ten-name map), 29–47 (image emblem),
  and 49–56 (earned-points tier label).
- Source styling: `artifacts/jaguar-house/src/app/globals.css` lines 2684–2713
  (`.rank-emblem` image fit and tier-specific borders/glows).
- Source assets: ten supplied images under `public/brand/rank-icons/`.
- Public exports: `RankEmblem`, `RankEmblemName`, and `MemberRankLabel`.
- API: rank name, pixel size, optional class, and earned-points value for the
  tier label.
- Behavior: rank artwork is decorative; the adjacent text names the tier.
- Dependencies: retained rank images and the source `gradeFor` threshold
  mapping (`components/brand/loyalty-api.ts`, lines 44–50).
- Direct consumers: `app/card/page.tsx`,
  `app/cannabis-card/page.tsx`, `app/redeem/page.tsx`, and
  `components/brand/welcome.tsx`.
- No source Storybook story or component-specific test was found.
- Chunk 1; pilot family.
