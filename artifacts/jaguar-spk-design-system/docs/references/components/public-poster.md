# Public poster

- Source: `artifacts/jaguar-house/src/components/brand/shop-tools.tsx`
- Source implementation: lines 1–21; client origin and registration QR 6–12,
  print action and instruction content 13–20.
- Source styling: `.print-poster` print layout in
  `artifacts/jaguar-house/src/app/globals.css` lines 507–521.
- Public export: `PublicPoster`.
- Behavior: generates a QR for the public registration URL, shows short signup
  steps, and opens browser print; it is not an image poster.
- Dependencies: `qrcode.react`, browser location and print API.
- Direct consumer: `app/owner/page.tsx` in the poster management view.
- No source Storybook story or component-specific test was found.
- Chunk 2; pending. Keep business-specific poster content in the consuming app.
