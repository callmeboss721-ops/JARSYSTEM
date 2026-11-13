# Brand icon

- Source: `artifacts/jaguar-house/src/components/brand/brand-icon.tsx`
- Source implementation: lines 1–107; glass icon mapping is lines 7–33 and
  48–77, semantic names are lines 35–45, and accessible decorative rendering is
  lines 79–106.
- Source styling: `artifacts/jaguar-house/src/app/globals.css` lines 338–346
  and 5227–5232 (`.brand-icon` and neutral/gold/emerald/danger tones).
- Public exports: `BrandIcon`, `BrandIconName`.
- API: semantic `name`, `size` (default 18), tone, optional class.
- Account access names include `phone`, `memberCode`, and `nickname`; use them
  consistently for the three separate member login methods.
- Behavior: decorative SVG icons are hidden from assistive tech; names and
  accessible labels belong on the surrounding control.
- Dependencies: `@thesvg/ui-react` glass icon exports and `lucide-react` for
  botanical and banking marks.
- Direct consumers: `components/brand/welcome.tsx`,
  `auth-forms.tsx`, `ui.tsx`, `member-shell.tsx`, `app/card/page.tsx`,
  `app/cannabis-card/page.tsx`, `app/redeem/page.tsx`, `app/owner/page.tsx`,
  and `app/staff/page.tsx`.
- No source Storybook story or component-specific test was found.
- Chunk 1; pilot family. Keep glass icon mapping and semantic tones intact.
- V3 preview extension: `src/components/ui/icon-catalog.tsx` supplies the
  searchable/size-selectable 34-icon catalog and 12 signature marks with
  clipboard feedback. This does not alter the existing `BrandIcon` API.
