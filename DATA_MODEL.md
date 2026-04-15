# Data Model

## Status
Schema proposal only. No Supabase migration is created in this milestone.

## Naming conventions
- Use UUID primary keys for internal records.
- Store Mirakl identifiers as explicit columns and unique constraints.
- Use `created_at`, `updated_at`, and `created_by` / `updated_by` where applicable.
- Use immutable audit rows for important decisions and integration events.

## Core entities

### `mirakl_providers`
Represents shops/providers from Mirakl.
- `id uuid pk`
- `provider_id text not null unique`
- `shop_name text`
- `shop_state text`
- `raw_payload jsonb`
- `last_synced_at timestamptz`

### `products`
Integrated product identity where available.
- `id uuid pk`
- `product_sku text unique null` — live/integrated Mirakl key when present.
- `product_id_type text`
- `product_id text`
- `title text`
- `category_id uuid references categories`
- `current_source_snapshot_id uuid null`
- Unique candidate: `(product_id_type, product_id)` where not null.

### `product_sources`
Source product rows per provider/shop.
- `id uuid pk`
- `provider_id text not null`
- `provider_unique_identifier text not null`
- `product_id_type text`
- `product_id text`
- `product_sku text null`
- `status text` (`LIVE`, `NOT_LIVE`, `UNKNOWN`)
- `source_hash text not null`
- `raw_payload jsonb`
- `errors jsonb`
- `warnings jsonb`
- Unique: `(provider_id, provider_unique_identifier)`.

### `categories`
Mirakl category/hierarchy metadata.
- `id uuid pk`
- `code text unique not null`
- `label text`
- `parent_code text null`
- `source text default 'mirakl'`
- `schema_version text`
- `last_synced_at timestamptz`

### `category_attributes`
Attributes relevant to a category.
- `id uuid pk`
- `category_id uuid references categories`
- `code text not null`
- `label text`
- `type text`
- `is_required boolean`
- `is_recommended boolean`
- `value_list_code text null`
- `source text` (`mirakl`, `business_override`, `fixture_hint`)
- Unique: `(category_id, code, source)`.

### `mirakl_value_lists`
- `id uuid pk`
- `code text not null`
- `value_code text not null`
- `label text`
- `raw_payload jsonb`
- Unique: `(code, value_code)`.

### `product_attribute_values`
Current source/accepted values by product and attribute.
- `id uuid pk`
- `product_id uuid references products`
- `attribute_code text not null`
- `value jsonb`
- `origin text` (`mirakl_source`, `approved_candidate`, `manual_override`)
- `source_snapshot_id uuid null`
- Unique: `(product_id, attribute_code, origin)`.

### `enrichment_jobs`
- `id uuid pk`
- `product_id uuid null references products`
- `category_id uuid null references categories`
- `status text` (`QUEUED`, `RUNNING`, `SUCCEEDED`, `FAILED`, `CANCELLED`)
- `job_type text` (`product_on_demand`, `category_batch`, `schema_sync`, `score_refresh`)
- `requested_by uuid null`
- `started_at timestamptz`
- `completed_at timestamptz`
- `error_summary text`

### `enrichment_candidates`
Candidate field value proposed by an enrichment job.
- `id uuid pk`
- `job_id uuid references enrichment_jobs`
- `product_id uuid references products`
- `attribute_code text not null`
- `source_snapshot_id uuid null`
- `proposed_value jsonb not null`
- `current_value jsonb null`
- `confidence numeric(5,2)`
- `domain_state text` (`CANDIDATE_PROPOSED`, `FIELD_APPROVED`, `FIELD_REJECTED`, `STALE_REVIEW_REQUIRED`) — candidate/review state only. Export/import state lives on `export_batches`, `export_batch_items`, and `import_attempts`.
- `rationale text`

### `evidence_sources`
- `id uuid pk`
- `source_type text` (`manufacturer_page`, `official_pdf`, `mirakl`, `operator_upload`, `retailer_hint`, `search_snippet`, `other`)
- `url text null`
- `accessed_at timestamptz`
- `title text`
- `excerpt text`
- `pdf_page integer null`
- `extraction_method text`
- `confidence_tier text` (`high`, `medium`, `low`, `policy_pending`)
- `retention_class text`
- `raw_storage_ref text null` — only when raw storage is approved.

### `candidate_evidence_links`
Field-level provenance join table.
- `candidate_id uuid references enrichment_candidates`
- `evidence_source_id uuid references evidence_sources`
- `supports_attribute_code text not null`
- `support_type text` (`direct`, `inferred`, `conflicting`)
- Primary key: `(candidate_id, evidence_source_id, supports_attribute_code)`.

### `quality_scores`
Materialized product score.
- `id uuid pk`
- `product_id uuid references products unique`
- `score integer check (score between 0 and 100)`
- `band text` (`red`, `amber`, `neutral`, `green`)
- `components jsonb not null`
- `source_snapshot_id uuid null`
- `schema_version text`
- `is_stale boolean default false`
- `calculated_at timestamptz`

### `review_decisions`
- `id uuid pk`
- `candidate_id uuid references enrichment_candidates`
- `decision text` (`APPROVE`, `REJECT`, `REQUEST_MORE_EVIDENCE`, `MARK_STALE`)
- `reason text`
- `reviewed_by uuid not null`
- `created_at timestamptz`
- Append-only after creation.

### `export_batches`
- `id uuid pk`
- `domain_state text` (`EXPORT_DRAFT_REQUESTED`, `EXPORT_DRAFT_VALIDATED`, `EXPORT_LOCKED`, `IMPORT_SUBMISSION_APPROVED`, `IMPORT_SUBMITTED`, `IMPORT_POLLING`, `IMPORT_COMPLETED`, `IMPORT_PARTIAL_FAILURE`, `IMPORT_FAILED`) — export/import workflow state.
- `file_hash text null`
- `created_by uuid`
- `approved_by uuid null`
- `approved_at timestamptz null`
- `source_snapshot_hash text`

### `export_batch_items`
- `id uuid pk`
- `export_batch_id uuid references export_batches`
- `candidate_id uuid references enrichment_candidates`
- `row_payload jsonb`
- `validation_status text`
- `validation_errors jsonb`
- `item_state text` (`EXPORT_LOCKED`, `IMPORT_COMPLETED`, `IMPORT_PARTIAL_FAILURE`, `IMPORT_FAILED`) — export/import outcome for this candidate row, separate from candidate review state.

### `import_attempts`
- `id uuid pk`
- `export_batch_id uuid references export_batches`
- `mirakl_import_id text null`
- `status text`
- `submitted_by uuid`
- `submitted_at timestamptz`
- `poll_count integer default 0`
- `status_payload jsonb`
- `report_refs jsonb`

### `audit_events`
- `id uuid pk`
- `actor_type text` (`user`, `system`, `service`)
- `actor_id text null`
- `event_type text`
- `entity_type text`
- `entity_id uuid null`
- `metadata jsonb`
- `created_at timestamptz default now()`


## Canonical workflow state mapping
Use the canonical domain states in app code, docs, audit events, and database `domain_state` columns. Avoid legacy aliases such as `PROPOSED`, `APPROVED`, `DRAFT`, or `SUBMITTED` except in migration notes.

| Domain state | Stored on | Meaning |
| --- | --- | --- |
| `CANDIDATE_PROPOSED` | `enrichment_candidates.domain_state` | Candidate field value drafted by enrichment. |
| `FIELD_APPROVED` | `enrichment_candidates.domain_state` | Reviewer approved field for potential export draft. |
| `FIELD_REJECTED` | `enrichment_candidates.domain_state` | Reviewer rejected field. |
| `STALE_REVIEW_REQUIRED` | `enrichment_candidates.domain_state` | Source/schema changed; reviewer must re-check. |
| `EXPORT_DRAFT_REQUESTED` | `export_batches.domain_state` | Operator requested draft package from approved fields. |
| `EXPORT_DRAFT_VALIDATED` | `export_batches.domain_state` | Server-side validation passed. |
| `EXPORT_LOCKED` | `export_batches.domain_state` and `export_batch_items.item_state` | Draft rows/file hash locked; not submitted. Candidate review state remains `FIELD_APPROVED`. |
| `IMPORT_SUBMISSION_APPROVED` | `export_batches.domain_state` | Operator approved locked draft for Mirakl submission. |
| `IMPORT_SUBMITTED` | `import_attempts.status` / `export_batches.domain_state` | Mirakl import request submitted and import id recorded. |
| `IMPORT_POLLING` | `import_attempts.status` | Status/report polling in progress. |
| `IMPORT_COMPLETED` | `import_attempts.status` and `export_batch_items.item_state` | Import attempt completed without row-level failures known to the app. |
| `IMPORT_PARTIAL_FAILURE` | `import_attempts.status` and affected `export_batch_items.item_state` | Some rows failed or require rework. Candidate review state remains unchanged; new rework candidates may be created separately. |
| `IMPORT_FAILED` | `import_attempts.status` and affected `export_batch_items.item_state` | Import attempt failed; candidate review state remains unchanged unless rework creates a new candidate. |
| `SOURCE_STATUS_RECHECKED` | audit event | MCM source status checked after import; live/publication remains separate. |

## Key indexes
- `products(category_id)`
- `products(product_sku)`
- `product_sources(provider_id, provider_unique_identifier)`
- `product_sources(status)`
- `quality_scores(score, band, is_stale)`
- `enrichment_candidates(product_id, domain_state)`
- `candidate_evidence_links(candidate_id)`
- `review_decisions(candidate_id, created_at)`
- `audit_events(entity_type, entity_id, created_at)`

## Table-level RLS policy matrix
Legend: `S` select, `I` insert, `U` update, `D` delete. `SRV` means server-only service role path; browser clients must not receive this permission directly.

| Table | admin | operator | reviewer | auditor | enrichment_service | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `mirakl_providers` | S/I/U/D | S | S | S | S/I/U via SRV | Provider sync is server-only. |
| `products` | S/I/U/D | S | S | S | S/I/U via SRV | Browser roles read safe projections only. |
| `product_sources` | S/I/U/D | S | S | S | S/I/U via SRV | Source snapshots immutable by browser users. |
| `categories` | S/I/U/D | S | S | S | S/I/U via SRV | Mirakl schema sync writes through service only. |
| `category_attributes` | S/I/U/D | S | S | S | S/I/U via SRV | Attribute drift updates are server-only. |
| `mirakl_value_lists` | S/I/U/D | S | S | S | S/I/U via SRV | Value-list writes are schema-sync only. |
| `product_attribute_values` | S/I/U/D | S | S | S | S/I/U via SRV | Accepted candidate promotion is server-mediated. |
| `enrichment_jobs` | S/I/U/D | S/I for allowed job requests | S own/requested | S | S/I/U via SRV | Job execution state is service-owned. |
| `enrichment_candidates` | S/I/U/D | S, U `domain_state` only for review transitions (`CANDIDATE_PROPOSED` -> `FIELD_APPROVED`/`FIELD_REJECTED`/`STALE_REVIEW_REQUIRED`) | S, U `domain_state` only for reviewer transitions (`CANDIDATE_PROPOSED` -> `FIELD_APPROVED`/`FIELD_REJECTED`; no export/import states) | S | S/I/U via SRV for candidate creation/stale marking only | Export/import actions do not mutate `enrichment_candidates.domain_state`; export linkage/outcome lives on `export_batch_items.item_state`. |
| `evidence_sources` | S/I/U/D | S approved metadata | S linked evidence metadata | S metadata | S/I/U via SRV | Raw storage refs require stricter policy or signed server URL. |
| `candidate_evidence_links` | S/I/U/D | S | S | S | S/I/U via SRV | Links are written by enrichment jobs or reviewed server actions. |
| `quality_scores` | S/I/U/D | S | S | S | S/I/U via SRV | Scores are materialized by service jobs only. |
| `review_decisions` | S/I only; no update/delete except audited admin correction | S/I for operator decisions | S/I for reviewer decisions | S | No direct user decision; may insert system decisions only | Append-only; updates/deletes blocked by default. |
| `export_batches` | S/I/U/D | S/I, U allowed states (`EXPORT_DRAFT_REQUESTED` -> `EXPORT_DRAFT_VALIDATED` -> `EXPORT_LOCKED` -> `IMPORT_SUBMISSION_APPROVED`) | S | S | S/I/U via SRV after approval request | Mirakl submission requires operator approval state. |
| `export_batch_items` | S/I/U/D | S | S | S | S/I/U via SRV | Generated/validated by server-only builder. |
| `import_attempts` | S/I/U/D | S/I approval submission, S status | S | S | S/I/U via SRV for polling | No insert without approved locked export batch. |
| `audit_events` | S/I; no update/delete | S scoped | S scoped | S | I via SRV | Append-only. |

## RLS policy principles
- Exposed schemas require RLS enabled.
- Browser clients should not receive service-role privileges.
- `review_decisions` and `audit_events` are append-only.
- Evidence raw storage references have stricter access than normalized product summaries.
- Service-role-backed jobs must be isolated to server-only code.

## Acceptance criteria
- Supports field-level evidence.
- Supports materialized scores and stale flags.
- Supports Mirakl import lifecycle and partial failures.
- Supports table-level RLS planning before migrations are written.
