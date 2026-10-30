# Jaguar Loyalty Visual Refresh

## Intent
Make the customer loyalty experience and staff desk feel like one polished
Jaguar Kratom House product. Use the supplied reference for richer geometric
ornament and luminous emerald details while keeping the YOUNGBOSS dark-and-gold
direction clear and the real loyalty actions easy to understand.

## Audience and outcome
Members should read their actual balance, ten-stamp progress, available rewards,
and redemption status at a glance. Staff should quickly search a member, add
points, and review or confirm pending redemptions.

## Constraints
- Preserve routes, API calls, auth, schema, point rules, and redemption behavior.
- Keep counts and reward details sourced from live app data; never hardcode the
  illustrative `8/10` or `20` from the reference.
- Do not add scanning, a physical-card workflow, or fabricated products/rewards.
- Use only installed, verified Lucide outline icons through one shared treatment;
  don't draw replacement UI icons or introduce a new icon library.
- Keep the existing house-emblem source unchanged. The member card and hero may
  use an explicitly labelled CSS-only placeholder that reserves future GLB/image
  space; it must not imply a real 3D asset is present.
- Keep the app Thai-readable, keyboard-accessible, responsive, and honest about
  unavailable service data.
- Refine the existing presentation without changing backend or business logic.

## Success checks
- Existing login/register, card, rewards, and staff flows still work.
- No horizontal overflow at 320, 390, 430, 768, or 1440px.
- TypeScript and production build pass; key visual states are reviewed at phone,
  tablet, and desktop widths.
