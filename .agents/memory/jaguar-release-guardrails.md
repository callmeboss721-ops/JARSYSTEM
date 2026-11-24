---
name: JAGUAR release guardrails
description: User-mandated constraints for dependencies, brand assets, and loyalty data during future JAGUAR SPK changes.
---

Do not add Clerk or `http-proxy-middleware` back. Keep installed React and React DOM dependencies on the workspace `catalog:` versions, load the approved Thai/English fonts through `next/font/google`, and use the JAGUAR SPK design-system tokens and approved logo/mascot assets. Never alter existing member, points, sales, reward, stock, or PIN-hash data; preserve API/OpenAPI contracts, QR token payloads, and server-side point calculations.

**Why:** The user explicitly required these constraints while syncing the project for production.

**How to apply:** Check these invariants before dependency, branding, authentication, loyalty, or database changes; never treat a release cleanup as permission to migrate or reset live data.
