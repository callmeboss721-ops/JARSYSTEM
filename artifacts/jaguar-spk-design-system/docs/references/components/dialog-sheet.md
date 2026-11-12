# Dialog and sheet

- Sources: `artifacts/jaguar-house/src/components/ui/dialog.tsx` and
  `sheet.tsx`.
- Public APIs: source Dialog family and Sheet family with portal, overlay,
  trigger, content, title, description, close, and actions.
- Behavior: preserve Radix focus management, Escape dismissal, modal semantics,
  portals, close controls, and the source four-direction Sheet layout.
- Consumers: command dialog and responsive sidebar sheet.
- Preview: dialog open/close plus sheets from all four edges.
- Dependencies: Radix Dialog and class-variance-authority; the source Sheet does
  not use Vaul.
- Chunk 4; implemented.
