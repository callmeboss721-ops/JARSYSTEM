# Feedback and states

- Source: `artifacts/jaguar-house/src/components/brand/ui.tsx`
- Source styling: loading, state, dialog, backdrop and error selectors in
  `artifacts/jaguar-house/src/app/globals.css`.
- Public exports: `LoadingSpinner`, `LoadingState`, `ErrorState`, `EmptyState`,
  `SignedOutState`, and `Modal`.
- Behavior: retry callback, optional empty-state action, modal close/escape,
  focus trap and focus restoration.
- Dependencies: BrandIcon, JaguarMark, ReactNode, and a sign-in link in the
  app-specific signed-out variant.
- Source consumer count: 6 files. Chunk 2; pending. Keep route-specific signed-out
  links app-owned when porting the reusable state primitives.
