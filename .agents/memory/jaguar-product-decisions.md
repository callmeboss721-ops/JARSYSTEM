---
name: Jaguar product decisions
description: Why the React-bootstrapped artifact must retain Next.js
---

The user explicitly selected Next.js 15 when asked to resolve the conflict
between the React+Vite output selection and the written Next.js requirement.

**Why:** The user confirmed Next.js 15, not merely a generic React web app.

**How to apply:** Do not convert the runtime back to Vite because of the artifact
bootstrap type. Preserve Next.js when extending this product.

