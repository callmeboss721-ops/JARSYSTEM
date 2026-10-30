---
name: Supabase connection boundaries
description: Avoid mistaking valid environment variables for a working privileged connector
---

Treat Supabase environment configuration, API connector configuration, and MCP database permissions as independent.

**Why:** A reachable project through configured environment variables did not imply a reachable API connector host or permission to inspect schema through MCP. This produced similar client-facing failures with different underlying causes.

**How to apply:** Check the specific transport used by the app. An unreachable connector host is not a rejected credential or evidence that RLS needs relaxing. Missing RPCs must be inspected with authorized schema access before applying any prepared migration. Never replace privileged server operations with browser-key writes to bypass this boundary.
