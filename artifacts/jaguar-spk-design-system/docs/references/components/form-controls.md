# Form controls

- Sources: `artifacts/jaguar-house/src/components/ui/input.tsx`,
  `label.tsx`, and `textarea.tsx`.
- Public APIs: ref-forwarding Input, Label, and Textarea primitives.
- Behavior: preserve native form semantics, disabled/focus states, peer-disabled
  labels, and the source 16px mobile text size that prevents iOS zoom.
- Sources: `input.tsx`, `label.tsx`, `textarea.tsx`; form uses include the
  shared sidebar, field/form, and input-group consumers.
- Preview: default, required, invalid, disabled, checkbox, and multiline states.
- Dependencies: Radix Label, class-variance-authority, and source `cn` utility.
- Chunk 3; implemented.
