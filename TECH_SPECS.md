# Technical Specifications

## Status
Future implementation design only. This milestone does not create application code, migrations, jobs, deployments, or live integrations.

## Required stack
- Next.js App Router for frontend and server boundaries.
- shadcn/ui CLI and components for all UI primitives once implementation begins.
- Supabase Postgres for persistence with RLS on exposed schemas.
- Vercel-compatible deployment and environment management after explicit approval.
- Mirakl operator APIs for read-only ingestion and approval-gated import workflows.

## Next.js design rules
- Prefer Server Components for data-heavy read views.
- Use Client Components only for interactivity: filters, review controls, dialogs/sheets, optimistic form state.
- Keep Mirakl and Supabase service-role clients in server-only modules.
- Avoid data waterfalls: list-page counts, score summaries, and filters should load in parallel where independent.
- Use route handlers for external integrations/webhooks or job triggers; use server actions for authenticated user decisions where appropriate.
- Use `error.tsx`, `not-found.tsx`, and structured error states for app routes once scaffolded.

## Supabase design rules
- Enable RLS for all exposed tables.
- Keep service-role usage server-only.
- Use append-only audit events for security-relevant actions.
- Add indexes for product list filters, product detail joins, score ordering, stale-job lookup, and evidence/candidate joins.
- Prefer generated migrations once implementation begins; this docs milestone creates no migration files.

## Job execution strategy
| Job | Trigger | Writes | Notes |
| --- | --- | --- | --- |
| Mirakl schema sync | Manual first, scheduled later | Categories, attributes, value lists | Mirakl is source of truth. |
| Product ingestion | Manual first, scheduled later | Products, source snapshots | Read-only Mirakl API usage after approval. |
| Quality score refresh | On ingestion/review/schema changes | `quality_scores` | Materialized for list performance. |
| Enrichment candidate generation | On-demand first | Candidates/evidence | Must obey evidence policy. |
| Export package generation | Manual approval | Export batch rows/files | Does not submit to Mirakl by itself. |
| Import status polling | After approved import submission | Import attempts/reports | Approval-gated write flow. |

## Mirakl rate limits and retries
- Treat HTTP 429 as backoff-required; honor `Retry-After` when present.
- Use bounded exponential backoff for transient 5xx/network failures.
- Do not retry write/import submission blindly; import retries require operator-visible status and idempotency review.
- Log retry attempts in `audit_events` or job logs.

## Source snapshot versioning
- Compute a canonical hash for source product snapshots.
- Link candidates and review decisions to the source snapshot hash/version they were generated from.
- If Mirakl source changes before export, mark affected accepted candidates stale and require re-review.

## Export/import safety gates
Before draft export package generation:
1. Candidate field is approved.
2. Source snapshot is current or reviewer explicitly re-confirms after stale warning.
3. Category attribute exists in latest schema sync.
4. Value-list attributes use current Mirakl value-list values.
5. Required identifiers are present.
6. Evidence policy requirements are satisfied or exception is documented.

Before Mirakl import submission:
1. Operator explicitly approves submission.
2. Export batch is locked.
3. Preflight validation passes.
4. Import file and diff preview are visible.
5. Audit event records approver, time, source snapshot, and file hash.

## Error states
| Error | Handling |
| --- | --- |
| Mirakl auth failure | Stop job, alert operator, do not retry with alternate credentials. |
| 429/rate limit | Backoff and reschedule. |
| Category drift | Mark scores stale and require schema sync. |
| Evidence source blocked | Save candidate as low confidence or no-evidence; do not bypass policy. |
| Partial import failure | Store report metadata, mark failed rows for rework, avoid silent retry. |
| Supabase RLS denial | Treat as security bug; do not weaken policies without review. |

## Future validation spikes
- Validate shadcn + Next.js App Router scaffold and component APIs.
- Validate Supabase RLS role matrix with local/staging DB.
- Validate read-only Mirakl source status and product detail ingestion after approval.
- Validate Mirakl import-file format without submission where possible.
- Validate evidence source availability and extraction quality under approved policy.

## Acceptance criteria
- Defines server/client/runtime boundaries.
- Defines job strategy, rate-limit handling, stale data policy, and export/import gates.
- Includes enough detail to guide later implementation without using credentials in this milestone.

## Export/import state machine terminology
Use these states consistently across app APIs, UI, audit events, and Mirakl integration docs:
`CANDIDATE_PROPOSED` -> `FIELD_APPROVED`/`FIELD_REJECTED` -> `EXPORT_DRAFT_REQUESTED` -> `EXPORT_DRAFT_VALIDATED` -> `EXPORT_LOCKED` -> `IMPORT_SUBMISSION_APPROVED` -> `IMPORT_SUBMITTED` -> `IMPORT_POLLING` -> `IMPORT_COMPLETED`/`IMPORT_PARTIAL_FAILURE`/`IMPORT_FAILED` -> `SOURCE_STATUS_RECHECKED`.

Reviewer approval of a field is not the same as operator approval to submit to Mirakl. Draft package generation is a separate operator-requested step; Mirakl import submission is a later explicit approval step.
