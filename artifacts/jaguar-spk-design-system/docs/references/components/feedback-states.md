# Feedback and states

- Source: `artifacts/jaguar-house/src/components/brand/ui.tsx`
- Source implementation: `ui.tsx` lines 8–108; loading states 8–19, retryable
  error/empty/signed-out states 21–63, modal focus/Escape handling 65–108.
- Source styling: `artifacts/jaguar-house/src/app/globals.css` lines 1865–1897
  (loading), 194–201 (modal/backdrop), and 507–521 (print state).
- Public exports: `LoadingSpinner`, `LoadingState`, `ErrorState`, `EmptyState`,
  `SignedOutState`, and `Modal`.
- Behavior: retry callback, optional empty-state action, modal close/escape,
  focus trap and focus restoration.
- Dependencies: BrandIcon, JaguarMark, ReactNode, and standard anchors for the
  source signed-out links.
- Direct consumers: `app/card/page.tsx`, `app/cannabis-card/page.tsx`,
  `app/redeem/page.tsx`, `app/staff/page.tsx`, `app/owner/page.tsx`, and
  `components/brand/banking.tsx`.
- No source Storybook story or component-specific test was found.
- Chunk 2; pending. Keep route-specific signed-out links configurable.
