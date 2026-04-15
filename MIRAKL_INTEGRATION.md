# Mirakl Integration Plan

## Status
Integration design only. No live Mirakl calls are performed in this milestone.

## Local evidence
`MIRAKL_EXAMPLE_USAGE.md` documents prior usage against `https://seidor-dev.mirakl.net`, bearer-token auth, source-status exports, product details, attribute configuration, value lists, file imports, import status polling, transformed file download, and source-status follow-up.

## Authentication
- Future implementation must use server-only credentials.
- `.credentials.txt` values must not be committed, logged, printed, copied into docs, or exposed to browser clients.
- Production credentials should live in an approved server-side environment mechanism such as Vercel environment variables or a managed secret store.
- Token rotation and leak response are covered in `SECURITY.md`.

## Read-only integration paths
| Flow | Endpoint | Purpose |
| --- | --- | --- |
| Provider discovery | `/api/shops` | Map Mirakl shops/providers. |
| Source status export | `/api/mcm/products/sources/status/export` | Fetch source product status by provider and status. |
| Catalog details | `/api/products` | Fetch product details by known references such as EAN. |
| Attribute schema | `/api/products/attributes` | Fetch category/hierarchy attributes and required fields. |
| Value lists | `/api/values_lists` | Fetch valid enumerated values. |

## Source identity rules
- Use `provider_id + provider_unique_identifier` for source products.
- Use `product_sku` when available for live/integrated catalog products.
- Products not yet live may not have `product_sku`; preserve source identifiers.

## Write/import integration paths
Mirakl product creation/update uses file import (`POST /api/products/imports`) rather than a simple JSON update endpoint. This is approval-gated.

## Approval-gated import lifecycle
1. Reviewer approves field-level candidate values.
2. System validates category, required attributes, value lists, identifiers, evidence policy, and source snapshot freshness.
3. System generates draft export/import package and diff preview.
4. Operator explicitly approves submission.
5. System submits `POST /api/products/imports`.
6. System records `import_id` in `import_attempts`.
7. System polls import status with backoff.
8. System downloads transformed/error/new-product/transformation reports where available.
9. System checks MCM source status after import.
10. System records partial failures and rework items.
11. Operator review/publication may still be required; `SENT` does not mean live.

## Import status handling
Track:
- `import_status`
- lines read/succeeded/errored/warned
- report availability flags
- transformed file reference
- error report reference
- new product report reference
- transformation report reference
- MCM source status after import

## Partial failure policy
- Never silently drop failed rows.
- Keep successful and failed rows linked to the export batch.
- Mark failed candidates or rows for rework.
- Store report metadata and actionable error summaries.
- Avoid automatic re-submission unless explicitly approved and idempotency is understood.

## Rate limit/backoff
- Honor `Retry-After` for 429 where available.
- Use bounded exponential backoff for transient read failures.
- Treat write/import retry as operator-visible and approval-sensitive.

## Category/value-list drift
- Sync category attributes and value lists before scoring and export preparation.
- Mark scores/candidates stale when schema changes.
- Validate export rows against latest schema.

## Acceptance criteria
- Read-only and write paths are separated.
- Every write/import step is approval-gated.
- Import status/report and source-status follow-up are modeled.
- `SENT` is explicitly not treated as live/published success.

## Export/import state machine
Use the same state names across PRD, API, technical specs, and UI:
1. `CANDIDATE_PROPOSED` — enrichment job drafts a field value.
2. `FIELD_APPROVED` / `FIELD_REJECTED` — reviewer decides the field-level candidate.
3. `EXPORT_DRAFT_REQUESTED` — operator requests a draft package from approved fields.
4. `EXPORT_DRAFT_VALIDATED` — server validates category/value-list/source/evidence constraints.
5. `EXPORT_LOCKED` — draft file/rows are locked with a file hash and source snapshot hash.
6. `IMPORT_SUBMISSION_APPROVED` — operator explicitly approves Mirakl submission.
7. `IMPORT_SUBMITTED` — server calls `POST /api/products/imports` and records import id.
8. `IMPORT_POLLING` — server polls status and retrieves reports where available.
9. `IMPORT_COMPLETED`, `IMPORT_PARTIAL_FAILURE`, or `IMPORT_FAILED` — terminal import-attempt state.
10. `SOURCE_STATUS_RECHECKED` — MCM source status is checked; publication/live state remains distinct from transform success.

Draft package generation requires approved candidate fields and operator request. Mirakl submission requires a separate explicit operator approval after reviewing the locked draft.
