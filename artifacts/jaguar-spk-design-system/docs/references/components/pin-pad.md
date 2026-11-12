# PIN pad

- Source: `artifacts/jaguar-house/src/components/brand/pin-pad.tsx`
- Source implementation: lines 1–28; digit map 3, controlled entry 5–27.
- Source styling: `.pin-pad`, `.pin-dots`, and `.pin-key` in
  `artifacts/jaguar-house/src/app/globals.css` lines 1035–1045, plus staff/owner
  hover overrides at 926 and 1508–1509.
- Public export: `PinPad`.
- API: controlled value, change callback, max length, green/gold tone, and
  accessible group label.
- Behavior: numeric entry, clear and backspace controls, max length enforcement,
  accessible labels, and live entry count.
- Dependencies: native buttons and React callback props.
- Direct consumers: `app/staff/page.tsx` and `app/owner/page.tsx`.
- No source Storybook story or component-specific test was found.
- Chunk 2; pending.
