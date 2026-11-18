# Toast feedback

- Sources: `src/components/ui/toast.tsx` and `toaster.tsx` in the design-system
  package.
- Public APIs: all source Toast primitives, the mounted Toaster, and its small
  shared useToast reducer/dispatch hook.
- Behavior: preserve Radix live-region, swipe dismissal, action/close affordance,
  and the shared one-toast queue. Keep the stack at the bottom-right on every
  viewport, inset for device safe areas.
- Consumers: package Toaster and package `useToast` hook.
- Dependencies: Radix Toast, class-variance-authority, and source `cn` utility.
- Chunk 4; implemented.
