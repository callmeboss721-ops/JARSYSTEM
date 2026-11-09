---
name: Banking operations
description: Owner-managed daily receiving accounts and staff-recorded transfer ledger.
---

The owner configures bank accounts and selects the receiving account for each Bangkok business day. Staff records incoming and outgoing transfers. The user selected this ownership split: “เจ้าของตั้งค่า พนักงานบันทึก”.

The daily receiving limit is treated as a warning threshold rather than a hard block: a transfer that already happened must remain recordable, with an over-limit state shown clearly.

**Why:** The user asked to manage the account used today, its number, holder name and limit, plus incoming/outgoing transfers. Rejecting a real transfer after it occurred would make the ledger inaccurate.

**How to apply:** Keep account setup and daily account selection owner-only; keep transfer entry behind staff authentication; calculate the business day in Asia/Bangkok. Preserve an audit trail if correction or reversal tools are added later.
