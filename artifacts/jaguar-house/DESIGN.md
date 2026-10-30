# JAGUAR KRATOM HOUSE — YOUNGBOSS

## Intent

A discreet, premium Thai membership experience, not a game or a cyberpunk
dashboard. Customer membership and the staff desk share the same visual system,
but the staff desk has restrained emerald accents and clearly identified tools.
The jaguar identity is an understated broken-ring rosette, never a cartoon head.

## Source of truth

`src/app/globals.css` contains the shared tokens and component styles.
`src/components/brand` contains the reused brand, card, form, shell and state UI.
No separate theme package or additional runtime dependency is required.

| Role | Token / value |
| --- | --- |
| Obsidian canvas | `--bg` / `#05050A` |
| Primary gold | `--gold` / `#E5C04A` |
| Champagne text | `--gold-2` |
| Gunmetal surfaces | `--panel`, `--panel-2` |
| Silver type | `--silver`, `--muted` |
| Decorative dividers | `--line`, `--line-2` |
| Interactive boundaries | `--control-line` |
| Secondary / success | `--emerald`, `--emerald-2` |
| Necessary focus / status | `--cyan` / `#00F0FF` |
| Error | `--danger`, always accompanied by text or an icon |

Legacy `--neon`, `.btn-neon`, and `.btn-gold` names remain presentation aliases
for the primary gold treatment, not different action semantics. `.btn-ghost`
is the secondary gunmetal/outlined treatment. Keep primary submit/confirm
actions consistently gold; emerald distinguishes positive feedback and staff
accents rather than introducing a competing primary action colour.

## Typography and layout

- Bai Jamjuree headings; IBM Plex Sans Thai body; JetBrains Mono for codes and
  numerals. Thai text has comfortable line height and can wrap naturally.
- Inputs and primary actions are at least 48px high; other controls at least
  44px. At narrow widths the staff point picker uses four columns, retaining
  all twenty amounts.
- Mobile authentication begins with the form, not a long marketing hero.
- Member pages retain their bottom navigation; tablet/desktop use the existing
  wider navigation and balanced content columns.
- Grid children can shrink; dynamic reward names and activity descriptions wrap
  rather than silently truncating.
- The membership card shows the actual code and balance, exactly ten rosette
  slots, capped visual progress, and the existing extra-points explanation.

## Icons and brand-asset slots

- Shared UI icons use the installed Lucide React exports through
  `BrandIcon`: 18px by default, 1.8 stroke, outline style, and semantic neutral,
  gold, emerald, danger, or inherited colour. The current package is
  `lucide-react` 0.545.0.
- Use `Users` for members/search, `Sparkles` for points, `Stamp` for progress,
  `Package` for rewards, `ArrowLeftRight` for redemption, `LayoutDashboard`
  for the staff desk, `Plus` for adding points, and `History` for activity.
  `Settings` is available in the shared map, but there is no settings route;
  do not add a navigation item for it without a product requirement.
- `BrandEmblemPlaceholder` is a CSS-only labelled layout slot on the hero and
  member card. Its monogram and embossed-gold treatment are placeholders, not
  approved logo artwork or a loaded GLB. Replace the contents only when an
  approved brand asset exists; preserve the slot dimensions.
- The existing shared house-emblem source remains unchanged. Brand artwork is
  separate from the outline UI-icon system.

## States and motion

Use the shared loading skeletons, error/retry, signed-out and empty components.
Success and pending states include explicit text, not colour alone.
Dialogs have bounded scrolling, labelled close controls, keyboard focus trapping,
and focus restoration. Short entrance/interaction transitions respect reduced
motion; individual slots do not animate in with delayed visibility.

## Functional boundary

This redesign must not imply a working production connection. All existing
API calls, authentication, schema, sessions, validation, cache invalidation,
polling, point thresholds and confirmation flows are preserved. Never populate
screens with fabricated members, balances or rewards as an application fallback.
