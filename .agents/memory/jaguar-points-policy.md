---
name: JAGUAR points policy
description: Owner-confirmed purchase earning rules and separate staff bonus credits.
---

Award one kratom point for each cumulative ฿100 of eligible spend and one cannabis point for each cumulative 100 g. Carry each remainder forward without expiry, and keep the two balances and remainders separate. The server calculates awards from actual sale values; never accept a client-supplied point amount.

In the staff POS, kratom quick credits are manual bonuses separate from purchase awards. Cannabis quick actions map +1/+2/+3/+5 points to recording 100/200/300/500 g of actual purchases; do not create arbitrary cannabis credits or misstate grams.

**Why:** YOUNGBOSS replaced the earlier per-bottle/per-gram rules with cumulative ฿100 and 100 g thresholds on 2026-11-12. On 2026-11-24, YOUNGBOSS confirmed that kratom quick credits should be separate bonuses and cannabis quick actions should record actual grams at 100 g per point.

**How to apply:** Preserve historical transactions and balances during any migration. Keep purchase awards server-calculated; validate kratom staff bonuses through an authenticated, idempotent ledger flow without direct client balance writes. Keep cannabis accrual behind the owner-controlled feature flag and tie quick actions to actual purchase grams.
