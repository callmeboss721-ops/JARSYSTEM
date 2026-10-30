# Jaguar Kratom House

Thai mobile-first loyalty membership for Jaguar Kratom House, Boonkhiri Soi 6,
Samut Prakan. Existing Supabase is the only product database.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (managed workflow supplies PORT)
- `pnpm --filter @workspace/jaguar-house run dev` — Next.js 15 frontend (managed workflow supplies PORT)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required: server-only Supabase API connector pointing to the existing project
  with service-role access; `SESSION_SECRET` at least 32 characters.
- `ADMIN_PIN` must be non-default in production. Development defaults to `2468`.

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Web: Next.js 15 App Router, Tailwind CSS 4, React Query generated API hooks
- API: Express 5, signed HttpOnly Secure SameSite cookie sessions
- Product DB: existing external Supabase; do not use the scaffold's Replit DB
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/jaguar-house/src/app` — Next.js pages; `globals.css` owns the theme.
- `artifacts/jaguar-house/src/components/brand` — loyalty UI and shared helpers.
- `artifacts/api-server/src/routes/loyalty.ts` — all loyalty API handlers.
- `lib/api-spec/openapi.yaml` — API source of truth; codegen before consuming edits.
- `supabase/README.md` — connection setup, review requirements, operational limits.
- `supabase/migrations` — prepared external DB migration, NOT applied blindly.

## Architecture decisions

- No database replacement, fabricated members/rewards/balances, or seed writes.
- Member-code-only login and staff PIN are explicit user requirements; do not
  silently migrate to another auth provider. Explain their security limits.
- localStorage remembers only a session-present flag; never identity credentials.
- Database RPCs are service-role-only and perform credit/confirmation atomically.

## Product

- Register with Thai mobile phone and unique 6–10 alphanumeric member code.
- Login by member code; `/card` displays balance, 10 jaguar stamps, and activity.
- `/redeem` lists real active rewards and creates pending requests.
- `/admin` finds members, adds +1..+20, and confirms pending redemptions.
- Points are deducted only at confirmation, with duplicate-safe transaction logic.

## User preferences

- Dark #050505, neon #00FF9D, gold accents; Thai-first, mobile-first.
- Supabase project: `mbwkwgeznqrccfcpqbhp`.

## Gotchas

- Supabase setup must be verified before real use; consult `supabase/README.md`.
- Never use the public anon key for staff writes or grant browser roles access to
  security-definer loyalty RPCs. Review existing RLS and balance triggers first.
- Existing Vite starter files are not the runtime entry; use `src/app`.
- API throttles are in-memory; use one API instance until shared quotas exist.
- Production Next.js needs command serving, not static SPA hosting.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
