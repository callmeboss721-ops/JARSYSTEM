# JAGUAR SPK — BLACK EMERALD & GOLD EDITION

## Convention

### Purpose and status

This is the user-selected, website-wide design brief for JAGUAR SPK. It records visual direction for future work; saving this brief does not itself authorize a redesign, feature build, business-data change, or production release.

The intended direction is **Premium Neon × Urban Streetwear**: preserve the recognizable Jaguar mascot, green glasses, black hoodie, gold crown details, and real storefront identity while making the site easier to scan and use. The result should feel like one brand across the public store, member experience, staff tools, and owner tools—not a stack of promotional posters.

### Product and content direction

- Keep the existing member sign-in, digital cards, QR behavior, points, rewards, staff, and owner flows intact unless a separate request authorizes a functional change.
- Give the home page a clear order: shop identity and verified details, a focused mascot-led hero, then direct paths to products, membership, store information, and contact.
- Use real storefront photos only where they help visitors understand the location. Confirm address, hours, contact details, product claims, and promotions against the JAGUAR SPK knowledge base before displaying them.
- The proposed admin areas—staff details, income and expenses, audit history, daily reports, access settings, backup, and store settings—are future ideas, not claims about existing functionality. Add or advertise them only after they are implemented and verified.
- Use the six phases as a suggested sequence, not an approved task list: brand identity; UI redesign; asset management; admin and security; compliance review; testing.

### Visual direction and implementation boundaries

- Use dark, green, and gold surfaces with a strong hierarchy and restrained glow. Keep text, member status, balances, and actions readable without relying on color alone.
- The proposal's palette (`#91FF00`, `#008A45`, `#FFC400`, `#080E0B`, `#F5F7F5`) is a visual reference, not permission to add hardcoded colors. `artifacts/jaguar-spk-design-system/tokens.json` and the approved Brand ID 2026 semantic tokens remain the implementation source of truth. Any palette change must be made through the design system, not duplicated in the consuming app.
- The proposed Kanit/Prompt and Montserrat font options do not replace the existing approved, self-hosted Bai Jamjuree, IBM Plex Sans Thai, and JetBrains Mono setup. Do not change fonts without a separate explicit decision and coordinated design-system update.
- Build mobile-first and verify narrow screens before desktop. Keep card corners and spacing consistent with tokens; keep controls easy to tap, focus visible, Thai text naturally wrapped, and motion respectful of reduced-motion preferences.
- Use approved logo and mascot assets as separate files, preserve their original proportions with `object-contain`, and avoid using a full character sheet or poster as a page background. Optimized WebP derivatives may be used without replacing or distorting the approved source artwork.
- Apply visual effects selectively: a small glow for important actions, a restrained gold highlight, and short motion only where it helps explain an interaction. Do not use effects to replace clear status text.
- Review legal and age-related requirements before adding or promoting flows for kratom or cannabis products.

## Benefits

- Makes the visual identity consistent across public, member, staff, and owner pages.
- Keeps the original mascot and storefront identity while reducing clutter.
- Gives visitors clear routes to useful information instead of making them interpret a poster collage.
- Protects member, points, QR, sales, inventory, and staff workflows from unintended visual-redesign changes.
- Prevents proposed colors, fonts, admin features, or promotional claims from being mistaken for approved implementation or verified business facts.

## Examples

### Good

- A focused home-page hero uses one approved mascot asset, readable store details, and clear links to membership, products, and contact.
- A redesign consumes existing Brand ID 2026 tokens and shared components while leaving routes, authentication, QR payloads, and points behavior unchanged.
- A proposed report or backup feature is described as future work until a working implementation is verified.

### Bad

- Using a full poster sheet as the page background and repeating every promotional image as a separate section.
- Hardcoding the proposal's hex colors into the app or replacing the existing font system without updating and approving the shared design system.
- Showing sample member balances, product stock, QR status, or admin tools as if they were live.
- Advertising unverified store hours, delivery terms, product benefits, or legal claims based only on text embedded in artwork.

## Real world examples

- [JAGUAR SPK loyalty design guidelines](jaguar-loyalty-design-guidelines.md) — approved Brand ID 2026 usage, accessibility, content accuracy, and feature boundaries.
- [Design-system guidance](../../artifacts/jaguar-spk-design-system/docs/AGENTS.md) — token and component source of truth.
- [Brand ID 2026 source](../../artifacts/jaguar-spk-design-system/docs/references/brand-id-2026-source.md) — palette provenance and approved scope.
- [Home page](../../artifacts/jaguar-house/src/components/brand/welcome.tsx) — current store landing page and contact content.
- [Brand theme](../../artifacts/jaguar-house/src/app/brand-id-2026.css) — current token-driven page styling.
- [JAGUAR SPK knowledge base](../agent-guides/jaguar-spk-knowledge-base.md) — confirmed store facts, system behavior, and asset boundaries.

## Related agreements

- Use the shared JAGUAR SPK design system; do not invent app-local tokens or fonts.
- Preserve routes, API contracts, authentication, QR payloads, points logic, and existing business data during visual work.
- Treat user-provided artwork as visual reference unless its exact text or claim is recorded as approved in the knowledge base.
- Do not treat this brief's proposed admin functions or six phases as implementation approval.

Doc created by 🐢 💨 (Turbotuga™, [Codely](https://codely.com)’s mascot)
