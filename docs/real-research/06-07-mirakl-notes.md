# Phase 6 (snapshot input) + Phase 7 (write-back) — notes (2026-06-23)

## Phase 6 — Mirakl snapshot input
- `server/mirakl-snapshot.ts`: header-driven, tolerant parser (`parseSemicolonCsv`) + mapper
  (`mapSnapshotRowToProduct` / `loadSnapshotProducts`) turning a real Mirakl snapshot into
  ProductRecord baselines, with category→schema inference. `readLatestSnapshot` finds the newest
  capture in `data/mirakl/snapshots/`.
- `server/store.ts#importProducts(products)` seeds the catalog from any product set (keeps
  settings/overrides; candidates/evidence start empty).
- `pnpm import:snapshot [path]` (scripts/import-snapshot.mjs) maps + seeds; errors clearly if no
  snapshot exists, pointing at the gated `pnpm sync:mirakl --live-read-approved`.
- Tested with a synthetic snapshot (`tests/mirakl-snapshot.test.mjs`, 5 tests) — no creds needed.
- Capturing a REAL snapshot is operator-gated: needs `MIRAKL_OPERATOR_API_KEY` and the
  `--live-read-approved` flag (AGENTS.md). Not run here (no creds; gated).

## Phase 7 — Mirakl dev-tenant write-back
- `submitMiraklAttributeSync` (POST import → import_id → poll status) already existed; Phase 7
  hardened + wired it:
  - **Dev-tenant hard guard** `assertDevTenant`: refuses any host not matching `*-dev.mirakl.net`
    (or localhost). Production is unreachable from this flow regardless of env (ADR 0005 / hard
    constraint #1). Base URL is now resolved at call time so the guard is testable.
  - **Explicit approval**: the Sync button is a two-step confirm ("Submit accepted values to the
    Mirakl dev tenant?") and surfaces the real import id + status on success.
  - Tested: production host rejected without touching the network; the mocked dev-tenant
    round-trip posts multipart + polls (`tests/mirakl-sync-script.test.mjs`).
- The LIVE dev-tenant round-trip needs `MIRAKL_OPERATOR_API_KEY` + `MIRAKL_SYNC_SHOP_ID` +
  `MIRAKL_SYNC_CATEGORY_CODE` and the operator's in-UI confirm. Not executed here (no creds;
  AGENTS.md prohibits live Mirakl writes without approval). The code path is complete and gated.
