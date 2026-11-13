---
name: Vite Radix dependency warmup
description: Avoid mistaking first-load dependency optimization for persistent Radix runtime failures.
---

When a Vite preview first loads newly added lazy Radix modules, dependency optimization can invalidate and reload the page while several screenshots are opening. That transient state may log React hook errors even though the page works after optimization completes.

**Why:** In the design-system preview, Tooltip, Toggle, and Toast initially reported hook errors during concurrent first-load optimization; individual verification after the cache settled was clean.

**How to apply:** When adding Radix families to a Vite artifact, let the initial optimize/reload cycle finish, then verify those routes again before changing React resolution or dependencies.
