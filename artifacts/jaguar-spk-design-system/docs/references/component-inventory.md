# JAGUAR SPK component inventory

Source: the current Jaguar Kratom House workspace app, primarily
`artifacts/jaguar-house/src/components/brand/` and the shared primitives directly
used by its pages.

The visual library includes reusable brand components and the shared control
families used by them. Route-bound compositions such as `Welcome`, `MemberShell`,
`LoginForm`, `StaffBanking`, and `OwnerBanking` remain application-owned because
they include product routes, sessions, API calls, or staff/owner workflows.
Unconsumed shadcn scaffold files are not part of this source inventory.

The source is first-party workspace code; no external component license or
attribution is required. The design system uses its current visual source rather
than claiming a separate upstream component package.

| Rank | Family | Reference | Source evidence | Dependencies | Chunk | Status |
| ---: | --- | --- | --- | --- | --- | --- |
| 1 | Brand icon | `components/brand-icon.md` | Shared glass/Lucide semantic map; 9 direct source consumers | `@thesvg/ui-react`, `lucide-react` | 1 | implemented |
| 2 | Jaguar mark | `components/jaguar-mark.md` | Original uncropped logo; 7 direct source consumers | retained Jaguar logo assets | 1 | implemented |
| 3 | Brand button | `components/brand-button.md` | Landing, login, and member action art; 3 direct consumers | retained button artwork | 1 | implemented |
| 4 | Membership cards | `components/membership-cards.md` | Two shared card implementations; both club routes | QRCode, brand button/icon, retained card artwork | 1 | implemented |
| 5 | Rank emblems | `components/rank-emblems.md` | Ten supplied tier marks; 4 direct source consumers | retained rank artwork | 1 | implemented |
| 6 | Member card carousel | `components/member-card-carousel.md` | Dual-club tabs, horizontal swipe, keyboard selection | React touch handlers and native links | 2 | implemented |
| 7 | PIN pad | `components/pin-pad.md` | Staff/owner PIN entry, clear/backspace, green/gold modes | native buttons, controlled input callback | 2 | implemented |
| 8 | Feedback and states | `components/feedback-states.md` | Loading, empty, error, signed-out and modal states | brand icon/mark and React | 2 | implemented |
| 9 | Samut Prakan artwork | `components/samut-prakan-art.md` | Customer canvas with bridge, skyline, and water lines | inline SVG | 2 | implemented |
| 10 | Public poster | `components/public-poster.md` | QR signup print poster | `qrcode.react` and browser print API | 2 | implemented |
| 11 | Form controls | `components/form-controls.md` | Input, Label, Textarea; mobile text and focus states | Radix Label, source `cn` | 3 | implemented |
| 12 | Primary button | `components/primary-button.md` | Six variants, four sizes, and optional Slot child | CVA, Radix Slot | 3 | implemented |
| 13 | Separator | `components/separator.md` | Field, item, button-group, and sidebar | Radix Separator | 3 | implemented |
| 14 | Tooltip | `components/tooltip.md` | Provider and sidebar tooltips | Radix Tooltip | 3 | implemented |
| 15 | Toggle | `components/toggle.md` | Toggle-group styling and shared state control | Radix Toggle, CVA | 4 | implemented |
| 16 | Dialog and sheet | `components/dialog-sheet.md` | Command dialog and responsive sidebar sheet | Radix Dialog, CVA | 4 | implemented |
| 17 | Toast feedback | `components/toast-feedback.md` | App Toaster, swipe-close, action and live announcements | Radix Toast, source hook | 4 | implemented |
| 18 | Skeleton | `components/skeleton.md` | Sidebar loading placeholder and card/list states | CSS pulse | 4 | implemented |

## Build order

- Chunk 1 — pilot: Brand icon, Jaguar mark, Brand button, Membership cards,
  Rank emblems.
- Chunk 2 — Member card carousel, PIN pad, Feedback and states, Samut Prakan
  artwork, Public poster.
- Chunk 3 — Form controls, Primary button, Separator, Tooltip.
- Chunk 4 — Toggle, Dialog and sheet, Toast feedback, Skeleton.

The user approved the pilot and all four implementation chunks are now included.
UI compositions tied to routes, sessions, API calls, or staff/owner workflows
remain application-owned and are not copied into this reusable library.
