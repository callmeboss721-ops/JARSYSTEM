---
name: Loyalty test isolation
description: Keep development loyalty integration tests from colliding with PostgreSQL-persisted IP limits.
---

Login/card route tests must use the explicitly configured `JAGUAR_TEST_DATABASE_URL`; never fall back to `DATABASE_URL`. Use synthetic member identifiers and unique forwarded IPs per run. Remove only the fixture rows and exact rate-limit rows created by the test. Do not clear all security-limit rows; that table may include real recent attempts.

**Why:** loyalty rate limits persist in PostgreSQL, and an implicit database URL could point at real member records. Reusing a preview proxy IP can also make repeated tests fail with 429, while deleting shared limiter rows could weaken protection for real users.

**How to apply:** opt into an isolated database for authenticated route tests, isolate test IPs and identifiers, and let cleanup remove only the fixture business and rate-limit rows.
