---
name: Design reference extraction fallback
description: Handling blocked screenshot extraction for visual references.
---

If designlang or external screenshot tooling cannot capture a reference site after one browser setup attempt, stop repeating installs and use the installed component package or accessible source markup and documentation. Remove temporary browser caches after failed attempts.

**Why:** Repeated browser downloads consumed hundreds of megabytes without fixing a browser-detection or access failure, while the relevant icon library was already installed locally.

**How to apply:** For future UI-reference work, check existing package docs and components first, try capture once, then use local package previews and app screenshots.
