# Visual/UX verification — 2026-10-30

## Checks

- TypeScript and the Next.js production build are checked after the final UI
  changes.
- Browser viewport matrix: 320, 390, 430, 768 and 1440 CSS pixels for `/`,
  `/login`, `/register`, `/card`, `/redeem`, and both PIN/tools states of `/admin`.
- Browser measurements check horizontal document expansion, overflowing visible
  elements and controls smaller than 44px. Narrow-width fixes include shrinkable
  grids, four-column staff point selection, compact logout actions and wrapping
  Thai reward/activity text.
- Additional UI states: loading, empty, unavailable backend, signed out,
  validation errors, redemption review/sent, point review/success, and staff
  redemption review/confirmation.
- Card UI assertions cover balances 0, 9, 10 and 24: always ten slots, the actual
  balance is displayed, and the existing redeem threshold remains ten.
- Dialog keyboard focus stays inside while tabbing. Field errors retain their
  `aria-describedby` association; keyboard focus is visible.
- UI icons resolve from installed Lucide exports through the shared 18px/1.8
  stroke wrapper; stamp slots use the same outline family. Eight sampled theme
  contrast pairs range from 7.15:1 to 16.93:1.
- The member card and desktop hero reserve labelled CSS-only emblem slots.
  They contain no GLB or claim to be approved logo artwork.
- Source-level comparison checks generated hook calls, mutation payloads,
  invalidation calls, session-hint calls, point gates and the stamp count against
  the pre-redesign version. Backend, contracts, auth helpers, environment
  variables and package manifests were not edited.

## Data safety and limitations

Public screens are checked against the running app without authentication.
Authenticated layouts and confirmation UI are checked only in an isolated
browser with intercepted API responses. A visible **VISUAL TEST — ไม่ใช่ข้อมูลสมาชิกจริง**
label distinguishes these captures. Fixture identifiers are explicitly marked
as visual-only; no member, session, reward, redemption or point transaction is
created in Supabase. Every loyalty API request in that browser is intercepted,
including mutation requests.

These checks validate presentation and client-side interactions, **not** the
actual signed-in server session, database permissions, idempotency under real
concurrency or successful customer transactions. The existing Supabase
permission/connection blocker remains unchanged. This is not a full WCAG audit
or a claim of production readiness. No deployment or publish was performed.
