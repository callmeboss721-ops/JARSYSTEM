---
name: JAGUAR points policy
description: Owner-confirmed purchase earning rules and separate staff bonus credits.
---

Award one kratom point for each cumulative ฿100 of eligible spend and one cannabis point for each cumulative 100 g. Carry each remainder forward without expiry, and keep the two balances and remainders separate. The server calculates purchase awards from actual sale values. Staff quick-credit amounts are manual bonuses separate from purchase awards, not inputs to or replacements for the purchase calculation.

**Why:** YOUNGBOSS replaced the earlier per-bottle/per-gram rules with cumulative ฿100 and 100 g thresholds on 2026-11-12, then confirmed on 2026-11-24 that quick credits should be separate bonuses.

**How to apply:** Preserve historical transactions and balances during any migration. Keep purchase awards server-calculated; validate staff bonus credits through an authenticated, idempotent ledger flow without direct client balance writes. Cannabis accrual stays disabled by default behind an owner-controlled feature flag until legal review is complete.
