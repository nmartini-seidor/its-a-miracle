# Architecture: Mirakl Product Enrichment Tool

## Status
Architecture proposal for future implementation. No code has been generated in this milestone.

## Architectural principles
1. Server-only privileged operations: Mirakl tokens, Supabase service role, import package generation, and deployment secrets never run in browser clients.
2. Read/analyze automation before write automation: ingestion, scoring, enrichment, and evidence capture may run after approval; Mirakl write/import/publish remains human-approved.
3. Mirakl source-of-truth: category attributes and value-list constraints are synchronized from Mirakl rather than invented.
4. Field-level auditability: candidates, evidence, decisions, exports, imports, and scores have traceable audit events.
5. shadcn-only interface: dashboard UI is composed from shadcn/ui primitives and application-specific business components only.

## Future high-level components
```text
Browser / Next.js UI
  -> Next.js Server Components / Server Actions / Route Handlers
    -> Supabase Postgres (RLS + audit + storage metadata)
    -> Mirakl API client (server-only)
    -> Enrichment job runner (server-only)
    -> Evidence extraction adapters (policy-gated)
```

## Trust boundaries
| Boundary | Rule |
| --- | --- |
| Browser -> Server | Browser receives only publishable Supabase credentials and serialized safe data. |
| Server -> Mirakl | Mirakl credentials are server-only; all writes/imports are approval-gated. |
| Server -> Supabase | Service-role access is isolated to backend jobs and never exposed to clients. |
| Evidence sources -> App | Source collection obeys `EVIDENCE_POLICY.md`; raw snapshots require approval. |
| Export package -> Mirakl | Draft packages require approval before submission. |

## Sequence: read-only Mirakl ingestion
```mermaid
sequenceDiagram
  participant Job as Ingestion Job
  participant Mirakl as Mirakl API
  participant DB as Supabase Postgres
  Job->>Mirakl: GET shops / source status / product details / attributes / value lists
  Mirakl-->>Job: Source snapshots and schema metadata
  Job->>DB: Upsert providers, products, source snapshots, categories, attributes, value lists
  Job->>DB: Emit audit_events and ingestion status
```

## Sequence: enrichment candidate generation
```mermaid
sequenceDiagram
  participant Reviewer as Reviewer
  participant App as Next.js Server
  participant Job as Enrichment Job
  participant Evidence as Approved Sources
  participant DB as Supabase
  Reviewer->>App: Request enrichment for product/category
  App->>DB: Create enrichment_jobs row
  Job->>DB: Load product, category requirements, evidence policy
  Job->>Evidence: Search/fetch allowed source metadata
  Evidence-->>Job: URLs/PDF references/excerpts
  Job->>DB: Save enrichment_candidates and candidate_evidence_links
  Job->>DB: Mark job completed or failed with audit_events
```

## Sequence: review and export preparation
```mermaid
sequenceDiagram
  participant Reviewer
  participant App
  participant DB
  participant Mirakl
  Reviewer->>App: Accept/reject candidate fields
  App->>DB: Store review_decisions and audit_events
  Reviewer->>App: Request draft export package
  App->>DB: Validate approved fields, source version, value lists
  App->>DB: Create locked export_batches and export_batch_items
  Note over App,Mirakl: Mirakl import submission requires explicit later approval
```

## Sequence: approved Mirakl import follow-up
```mermaid
sequenceDiagram
  participant Operator
  participant App
  participant Mirakl
  participant DB
  Operator->>App: Explicitly approve import submission
  App->>Mirakl: POST /api/products/imports (approval-gated)
  Mirakl-->>App: import_id
  App->>DB: Record import_attempt
  App->>Mirakl: Poll import status with backoff
  Mirakl-->>App: status, counts, report flags
  App->>Mirakl: Retrieve transformed/error/new-product/transformation reports where available
  App->>Mirakl: Check MCM source status after import
  App->>DB: Store status, reports metadata, audit_events
```

## Conflict policy
- Mirakl wins when source data changes after candidate generation.
- Accepted candidates become `STALE_REVIEW_REQUIRED` if the source snapshot hash/version changes before export.
- Export batches lock the source snapshot they were generated from.
- Partial import failures create rework items; they do not silently retry mutation.

## Operational architecture defaults
- Start with manual/on-demand enrichment jobs; scheduled batch enrichment is a later controlled enhancement.
- Use materialized scores for list performance and refresh them on ingestion, review decisions, category schema changes, and scheduled freshness checks.
- Keep raw evidence retention approval-gated; default to source metadata and excerpts.

## Architecture acceptance criteria
- All privileged operations are server-only.
- Mirakl mutation paths are explicitly approval-gated.
- Attribute schema drift and stale source snapshots are modeled.
- Evidence, review, export, import, and score events are auditable.
