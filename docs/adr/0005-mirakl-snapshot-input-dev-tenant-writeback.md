# Mirakl integration scope: snapshot-seeded input, dev-tenant write-back behind explicit approval

**Input:** the catalog is seeded from a real Mirakl **snapshot** — pulled once via the gated `scripts/sync-mirakl-snapshot.mjs` (real authenticated read) — rather than live per-run ingestion. Real Mirakl data, stable across demo runs.

**Output (write-back):** accepted candidates are assembled into a real Mirakl import (CSV, via `server/mirakl-live-sync.ts`) and submitted as a **real authenticated round-trip against the dev tenant** (`seidor-dev.mirakl.net`): POST import → obtain `import_id` → poll real status → display result/reports. Gated behind an explicit in-UI **"Submit to Mirakl" approval click**.

## Why

`AGENTS.md` requires human approval before any Mirakl write/import/publish and notes `SENT` ≠ published. Live per-run ingestion is fragile for a live pitch; production writes are prohibited without separate sign-off. Snapshot-input + dev-tenant-output gives a demo that is **fully real end-to-end but never dangerous**: the operator's explicit click satisfies the approval gate, and the dev tenant scopes the blast radius.

## Consequences

Production write-back remains a separate, later, signed-off step — not reachable from the demo flow. A future live "Import from Mirakl" button is possible but deliberately deferred. The full real arc is: **real products → three real agents investigate → consensus/conflict → human review → real import to the Mirakl dev tenant**.
