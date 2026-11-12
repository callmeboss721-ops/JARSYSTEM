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
| 6 | Member card carousel | `components/member-card-carousel.md` | Used across 2 source files; dual-club presentation | membership cards | 2 | pending |
| 7 | PIN pad | `components/pin-pad.md` | Used in staff and owner access | native buttons, controlled input callback | 2 | pending |
| 8 | Feedback and states | `components/feedback-states.md` | Used across 6 source files; loading, empty, error, modal | brand icon, Jaguar mark | 2 | pending |
| 9 | Samut Prakan artwork | `components/samut-prakan-art.md` | Used across 2 source files; shared ambient city illustration | inline SVG | 2 | pending |
| 10 | Public poster | `components/public-poster.md` | Used in one product page; responsive shop artwork | supplied image assets | 2 | pending |
| 11 | Form controls | `components/form-controls.md` | Input, Label, Textarea primitives used in app pages | Radix label where applicable | 3 | pending |
| 12 | Primary button | `components/primary-button.md` | Shared shadcn Button implementation used in app UI | class-variance-authority, Radix Slot | 3 | pending |
| 13 | Separator | `components/separator.md` | Used across 4 source files | Radix Separator | 3 | pending |
| 14 | Tooltip | `components/tooltip.md` | Used across 2 source files | Radix Tooltip | 3 | pending |
| 15 | Toggle | `components/toggle.md` | Used by a shared app control | Radix Toggle, class-variance-authority | 4 | pending |
| 16 | Dialog and sheet | `components/dialog-sheet.md` | Dialog and Sheet used in staff/owner flows | Radix Dialog, Vaul | 4 | pending |
| 17 | Toast feedback | `components/toast-feedback.md` | Toast and Toaster used by shared app actions | Radix Toast, Sonner | 4 | pending |
| 18 | Skeleton | `components/skeleton.md` | Used in loading surfaces | CSS animation | 4 | pending |

## Build order

- Chunk 1 — pilot: Brand icon, Jaguar mark, Brand button, Membership cards,
  Rank emblems.
- Chunk 2 — Member card carousel, PIN pad, Feedback and states, Samut Prakan
  artwork, Public poster.
- Chunk 3 — Form controls, Primary button, Separator, Tooltip.
- Chunk 4 — Toggle, Dialog and sheet, Toast feedback, Skeleton.

The pilot is the only chunk implemented before review. Later chunks remain
pending until the user approves the pilot. UI composition names in the source
map is declared above as application-owned, not silently copied into this
product-agnostic component library.
