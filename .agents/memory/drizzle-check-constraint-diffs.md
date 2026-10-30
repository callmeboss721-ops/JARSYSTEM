---
name: Drizzle check-constraint diffs
description: Schema push can miss changed CHECK expressions when the constraint name stays the same.
---

Do not treat “Changes applied” from Drizzle schema push as proof that a changed
CHECK expression reached the database.

**Why:** On 2026-10-30, the database retained the old member-code CHECK after a
successful push, rejecting newly accepted code formats during development startup.
The live catalogue, rather than the TypeScript schema, revealed the mismatch.

**How to apply:** When changing a CHECK expression, verify its live catalogue
definition and use an explicit migration or a deliberately distinct constraint
name supported by the schema-diff workflow. Do not add corrective DDL to app startup.
