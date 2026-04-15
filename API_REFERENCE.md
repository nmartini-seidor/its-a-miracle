# API Reference Plan

## Status
Reference plan only. No API clients, route handlers, or live requests are created in this milestone.

## Mirakl API touchpoints
All Mirakl calls require server-only credentials in future implementation. This docs milestone does not use them.

### Read-only endpoints
| Capability | Endpoint | Purpose | Notes |
| --- | --- | --- | --- |
| Shops/providers | `GET /api/shops` | Discover provider/shop identifiers. | Local notes identify `shop_id` as useful provider ID. |
| Source status export | `GET /api/mcm/products/sources/status/export` | Export source products by provider/status. | Supports `provider_id`, `status`, provider source IDs, errors, warnings. |
| Product details | `GET /api/products` | Fetch details for known product references. | Does not dump full catalog by itself; requires references. |
| Product attributes | `GET /api/products/attributes` | Fetch category/hierarchy attributes. | Source for required/relevant attributes. |
| Value lists | `GET /api/values_lists` | Fetch allowed attribute values. | Needed for validation before export. |

### Approval-gated write/import endpoints
| Capability | Endpoint | Gate |
| --- | --- | --- |
| Product import | `POST /api/products/imports` | Explicit operator approval only. |
| Import status | `GET /api/products/imports/{import}` | Only after approved submission. |
| Transformed file | `GET /api/products/imports/{import}/transformed_file` | Import follow-up/audit. |
| Error/new-product/transformation reports | Mirakl report endpoints where available | Import follow-up/audit. |

## Planned internal app APIs
These are design targets for future implementation.

### Product list
`GET /api/products?scoreMax=&category=&status=&missingAttribute=&provider=`
- Returns paginated products, score, category, provider count, missing critical attributes, stale flags.
- Server-side only data access; client receives safe projection.

### Product detail
`GET /api/products/{id}`
- Returns source snapshot, attributes, quality score components, candidates, evidence summary, review history.

### Trigger enrichment job
`POST /api/products/{id}/enrichment-jobs`
- Future approval required before live execution.
- Creates `enrichment_jobs` row and queues on-demand enrichment.
- Requires evidence policy to be approved.

### Review candidate field
`POST /api/candidates/{id}/review-decisions`
- Body: decision, reason, optional requested evidence note.
- Enforces review state machine.
- Writes append-only review decision and audit event.

### Request and validate draft export batch
`POST /api/export-batches`
- Requires `FIELD_APPROVED` candidates and current source snapshots.
- Creates `EXPORT_DRAFT_REQUESTED`, validates rows, and advances to `EXPORT_DRAFT_VALIDATED` / `EXPORT_LOCKED` when successful.
- Does not submit to Mirakl.

### Approve locked batch for Mirakl submission
`POST /api/export-batches/{id}/approve-submission`
- Requires operator review of the locked draft and file hash.
- Advances `EXPORT_LOCKED` to `IMPORT_SUBMISSION_APPROVED`.
- Does not submit by itself.

### Submit approved import
`POST /api/export-batches/{id}/submit`
- Approval-gated future endpoint.
- Requires `IMPORT_SUBMISSION_APPROVED`, locked batch, and validation success.
- Submits Mirakl import, records `IMPORT_SUBMITTED`, then starts `IMPORT_POLLING`.

## Failure modes
| Status | Meaning | Handling |
| --- | --- | --- |
| 400 | Invalid input or validation failure | Show field-level errors; do not mutate. |
| 401/403 | Auth/permission failure | Stop action; audit security event. |
| 404 | Product/job/batch missing | Show not-found state. |
| 409 | Stale source snapshot or invalid state transition | Require refresh/re-review. |
| 429 | Mirakl rate limit | Backoff/reschedule; display retry status. |
| 5xx | Service failure | Retry read jobs with bounds; do not blindly retry writes. |

## Authentication and authorization
- User-facing app authentication is planned through Supabase Auth or approved enterprise auth integration.
- Roles: admin, operator, reviewer, auditor, enrichment_service.
- Mirakl and Supabase service-role credentials stay server-only.

## Acceptance criteria
- Read-only and write/import APIs are clearly separated.
- Every write/import path is approval-gated.
- Error handling includes stale data, rate limits, and partial failures.

## Export/import state terminology
- `POST /api/candidates/{id}/review-decisions` can move a candidate to `FIELD_APPROVED` or `FIELD_REJECTED` through server-enforced review rules.
- `POST /api/export-batches` requests `EXPORT_DRAFT_REQUESTED` and can produce `EXPORT_DRAFT_VALIDATED` / `EXPORT_LOCKED`; it never submits to Mirakl.
- `POST /api/export-batches/{id}/approve-submission` records `IMPORT_SUBMISSION_APPROVED` after operator review of the locked draft.
- `POST /api/export-batches/{id}/submit` is allowed only after `IMPORT_SUBMISSION_APPROVED` and creates `IMPORT_SUBMITTED` / `IMPORT_POLLING`.

## Research job APIs

### Create research job
`POST /api/products/{id}/research-jobs`

Creates a bounded external research job for one product.

Request body:
```json
{
  "focus": ["description", "missing_attributes", "ean", "brand", "feature_bullets"],
  "max_urls": 10,
  "source_policy": "default-approved-public-sources"
}
```

Response:
```json
{
  "job_id": "uuid",
  "status": "QUEUED"
}
```

### Get research job
`GET /api/research-jobs/{job_id}`

Returns status, sources visited, evidence count, candidate count, warnings, and errors.

### List product candidates
`GET /api/products/{id}/candidates?kind=&status=`

Returns field-level candidates with evidence links and confidence.

### Review candidate
`POST /api/candidates/{id}/review-decisions`

Accepts/rejects a candidate. This does not submit to Mirakl.
