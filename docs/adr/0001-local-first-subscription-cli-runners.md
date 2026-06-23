# Local-first execution; research runs spawn subscription-authed agent CLIs via a local worker

The enrichment workspace runs **locally** (not deployed to Vercel, despite `docs/ARCHITECTURE.md` assuming a Vercel + Supabase deployment) specifically so it can spawn long-running agent CLIs that browse the web. Real research is executed by a small dedicated **local worker** process that spawns `cursor-agent`, `codex`, or `claude` headlessly under the operator's **existing subscription logins — no API keys** — behind a pluggable `ResearchRunner` interface.

## Considered options

- **Vercel / serverless** — rejected: cannot host a minutes-long browsing process (~300s ceiling, no persistent process, no `spawn`).
- **Detached spawn from Next route handlers** — rejected: the dev server recycles/reloads route execution and would orphan or kill an in-flight job.
- **Dedicated local worker (chosen)** — survives dev-server reloads, centralizes timeout/cancel/concurrency, and is the natural seam to later swap for a hosted sandbox.

## Consequences

Not deployable as-is, and bound to each subscription's ToS and rate limits (verify with a headless spike before building). A future hosted, multi-user product (the "B" path) would need a sandboxed runner substrate + a durable store, swapping the worker's spawn mechanism rather than rewriting the app.
