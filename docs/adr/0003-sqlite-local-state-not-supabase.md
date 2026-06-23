# SQLite for local state, deliberately not the Supabase migration

State (products, candidates, evidence, jobs, settings, overrides) moves from the single `data/demo-state.json` file to **SQLite** (`better-sqlite3`), with `server/store.ts` keeping its current exported signatures so the swap is contained to one module.

## Why

Introducing the local **Worker** (ADR 0001) created a second OS process writing state concurrently with the Next server. Two processes doing read-modify-write on one JSON file corrupt it — survivable in tests only because of `--test-concurrency=1`, not survivable in a live demo. SQLite gives ACID multi-process safety while staying a single portable file with zero infrastructure, preserving the local-first property of ADR 0001. It also retires the `concurrency-1` test constraint.

## Note for future readers

`supabase/migrations/0001_initial.sql` exists and describes the *aspirational hosted* schema. It is intentionally **not** wired up — Postgres would require running infrastructure, contradicting local-first. Activate Supabase only when building the hosted multi-user product (the "B" path in ADR 0001), not as a "fix" for the local demo.
