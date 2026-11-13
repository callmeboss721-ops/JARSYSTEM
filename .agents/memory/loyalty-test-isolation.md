---
name: Loyalty test isolation
description: Keep development loyalty integration tests from colliding with PostgreSQL-persisted IP limits.
---

Run the loyalty integration test directly against the local API and use a unique, test-only forwarded IP plus unique login identifiers per run. Do not clear all security-limit rows to reset a test; that table may include real recent attempts.

**Why:** loyalty rate limits persist in PostgreSQL. Repeated test runs through the same preview proxy can reuse its observed client IP and make registration tests fail with 429, while deleting shared limiter rows could weaken protection for real users.

**How to apply:** start the API workflow, target its local test port, isolate the test IP and identifiers, and let the test fixture cleanup remove only fixture business data.
