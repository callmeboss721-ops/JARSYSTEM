# Toast feedback

- Sources: `artifacts/jaguar-house/src/components/ui/toast.tsx` and
  `toaster.tsx`.
- Public APIs: all source Toast primitives, the mounted Toaster, and its small
  shared useToast reducer/dispatch hook.
- Behavior: preserve Radix live-region, swipe dismissal, action/close affordance,
  and the source one-toast queue.
- Consumers: the app-level Toaster; preview actions for success/error variants.
- Dependencies: Radix Toast, class-variance-authority, and source `cn` utility.
- Chunk 4; implemented.
