# Jaguar Kratom House

Thai mobile-first loyalty membership for Jaguar Kratom House, บุญศิริ ซอย 6,
สมุทรปราการ. Product data now uses Replit-managed PostgreSQL. The owner explicitly
approved a fresh database rather than importing the old Supabase data.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (managed workflow supplies PORT)
- `pnpm --filter @workspace/jaguar-house run dev` — Next.js 15 frontend (managed workflow supplies PORT)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required: managed `DATABASE_URL`; `SESSION_SECRET` at least 32 characters.
- Development has separate staff and owner bootstrap PINs. Change them from the
  owner room before operational use; saved PINs use salted scrypt hashes.
- Non-development runtimes require safe `STAFF_PIN` / `OWNER_PIN` bootstrap secrets
  or already-configured PIN hashes. Public development defaults are blocked there.
- Changing a role's PIN invalidates its previous sessions. Owner can replace both
  PINs atomically; staff can change only the staff PIN with the current PIN.

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Web: Next.js 15 App Router, Tailwind CSS 4, React Query generated API hooks
- API: Express 5, signed HttpOnly Secure SameSite cookie sessions
- Product DB: Replit-managed PostgreSQL, Drizzle schema under `lib/db/src/schema`
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (ESM bundle)

## Where things live

- `artifacts/jaguar-house/src/app` — Next.js pages; `globals.css` owns the theme.
- `artifacts/jaguar-house/src/components/brand` — loyalty UI and shared helpers.
- `artifacts/api-server/src/routes/loyalty.ts` — all loyalty API handlers.
- `lib/api-spec/openapi.yaml` — API source of truth; codegen before consuming edits.
- `artifacts/api-server/src/lib/loyalty-store.ts` — server-side transactional store.
- `supabase/` — historical integration notes and unapplied SQL, not the active store.

## Architecture decisions

- Fresh storage was approved. Never fabricate fallback members/rewards/balances.
  Development alone seeds a clearly marked demo member and a demo reward, without
  invented sales. Real rewards are configured explicitly by the owner.
- The old Supabase project/data is untouched; do not attempt an automatic import.
- Member login accepts phone, member code, or nickname; there is no OTP. Staff and
  owner use separate PIN sessions. Do not silently change these auth rules.
- localStorage remembers only a session-present flag; never identity credentials.
- Sales/confirmations run in database transactions with member row locks.
- Repeated sale/redemption request IDs and repeated confirmations do not charge twice.
- Personal QR uses a separate opaque staff-scan token, not the member login code.
- Preserve the existing QR payload and historical point balances when changing UI.

## Product

- Register with Thai mobile phone and a unique 6–8 character member code; letters,
  numbers and internal hyphens are allowed. Staff-created accounts also have a name.
- `/card` shows balance, ten stamps, private QR, latest five point/purchase events and lifetime
  grade: Green initially, Gold at 40 earned, Black VIP at 100 earned.
- Ten points can be redeemed for one eligible item; the specific item and terms are
  set by the owner and must not be guessed in customer-facing copy.
- The visible customer card polls about every two seconds, with reduced-motion-safe
  stamp feedback and a celebration on crossing the ten-point threshold.
- `/redeem` lists active rewards and creates one pending request per member.
- Kratom earns one point per cumulative ฿100 paid; cannabis earns one point per
  cumulative 100 g. Their balances and remaining amounts are separate. Do not
  recalculate historical awards when the policy changes.
- `/staff` has counter, member directory, new-account and staff-PIN tools. Sales
  keep the existing server-calculated pricing/points path; optional private sale-slip
  images do not change sale totals or points. Manual kratom bonus points are separate
  from purchases; cannabis credits correspond to recorded grams.
- `/owner` has separate authentication, Bangkok-day/all-time sales and formula
  reports, member soft deletion, rewards, PIN controls, and a printable shop QR poster.
  Its product catalog is separate from sales and loyalty: categories, reference images,
  stock adjustments, and one-time CSV import must not affect checkout or points.
  Existing stock is unknown until the owner records or imports a count; never display
  an unknown count as zero. CSV imports append only, skip duplicates, and never
  overwrite existing products. No source-site export has been provided yet.
  Closing a member preserves financial and points history. Demo activity is excluded
  from real sales reports. `/admin` redirects to `/owner`; `/admin?desk=staff`
  is the staff-counter compatibility route.
- Pending requests deduct points only when confirmed; direct counter redemption
  is immediate confirmation. Both paths are duplicate-safe.

## User preferences

- Use the approved JAGUAR SPK Brand ID 2026 theme through design-system tokens on
  the storefront, member cards, staff POS, and owner dashboard. Do not hardcode or
  invent app colors.
- Use the supplied JAGUAR logo and approved mascot assets; do not invent a replacement
  seal or character.

## Gotchas

- Supabase connectors/keys are no longer required by the loyalty runtime.
- Apply schema to development only with the Drizzle push command. Publishing
  handles managed production schema changes; no startup DDL or deploy migrations.
- Existing Vite starter files are not the runtime entry; use `src/app`.
- API throttles are in-memory; use one API instance until shared quotas exist.
- Production Next.js needs command serving, not static SPA hosting.
- `node scripts/test-loyalty.mjs` exercises development-only isolated fixtures and
  cleans up afterwards; it requires uncustomized development bootstrap PINs.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
