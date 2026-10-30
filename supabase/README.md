# Jaguar House existing Supabase integration

Target project: `mbwkwgeznqrccfcpqbhp`. Do not replace it with a new database.

## Current setup blocker

The connected Supabase MCP denied database access. The API connection's saved host
could not resolve. The prepared migration has **NOT been applied** and its schema
assumptions are **NOT yet verified**. Application writes deliberately fail closed.
No seed data, sample balances, or real points changes were made.

## Before enabling real transactions

1. Reconnect the existing Supabase account with access to the target project.
2. Correct the API connector host to the target Supabase project URL. Its
   server-side key must have `service_role` privileges. The supplied public anon
   key alone is deliberately insufficient to credit or deduct points.
3. Inspect existing columns, UUID IDs, status/reason constraints, defaults,
   unique constraints, balance triggers, and RLS. Adapt the prepared migration to
   the existing schema rather than blindly running it. Check for duplicate
   member codes (case-insensitive) and phones before adding unique indexes.
4. Confirm no existing trigger already updates balances from ledger transactions;
   otherwise adapt the functions to avoid double credit/deduction.
5. Apply the reviewed migration to this external database. The migration grants
   RPC execution only to `service_role`; never grant it to `anon`/`authenticated`.
6. Review existing table RLS with the owner before changing it: browser roles
   must not read member phones/codes, insert or alter balances, transactions or
   redemptions. This may affect other apps sharing these tables, so do not
   overwrite their policies without reviewing the impact.
7. Set a non-default `ADMIN_PIN` in Secrets before production. `2468` only works
   with the development API workflow. `SESSION_SECRET` must be at least 32
   characters. No credential belongs in source, public env vars, or the browser.
8. Verify registration, uniqueness, login, session reload/logout, credit (+1 and
   +20), request/confirm, concurrent confirmations, insufficient points,
   authorization failures and cross-site rejection with an approved test member.

## Operational limitations

- Member-code-only login is intentionally weak identity verification. Anyone
  knowing a member's code can access that loyalty account. Keep codes private.
  Staff must check the customer in person before fulfilling a reward.
- Only a non-sensitive session-present flag is remembered in localStorage.
  Authorization lives in signed HttpOnly Secure SameSite cookies.
- Staff confirmation deducts points and records the ledger in one transaction.
  Credit requests have a persistent idempotency key. One pending redemption per
  member prevents oversubscribing points.
- Login and request throttles are currently per-process. Run one API instance,
  or move quotas to a shared store before horizontally scaling.
- Staff cookies expire after two hours; member cookies after 30 days. Logging out
  clears the browser cookie. Immediate revocation of copied cookies would require
  a shared revocable session store; do not treat this as high-assurance auth.
- Connection health: `GET /api/loyalty/health` checks the expected project and RPC
  version, while `/api/healthz` is the lightweight process check.
- No rewards are fabricated. Add/manage actual rewards in the existing database.

## Dependency verification

Registry existence and upstream package names were verified before installation.
New packages are pinned: `next` **15.5.28**, `@tailwindcss/postcss` **4.3.3**,
and `@replit/connectors-sdk` **0.5.0**.
The initial audit found advisories in transitive packages. Fixed versions are
`postcss` **8.5.32**, `body-parser` **2.4.0**, `qs` **6.17.1**, and workspace
`zod` **4.6.7**. The final production dependency audit reported **no known
vulnerabilities**. This is a dependency audit, not a complete security assessment.
