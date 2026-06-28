> **⚠️ SUPERSEDED — aspirational design, not the built demo.** This document describes an earlier
> Supabase/Vercel design that was intentionally **not** wired up. For how the demo actually works,
> see `docs/adr/` (ADRs 0001–0007), `EXECUTION_PLAN.md`, and `CONTEXT.md`. Use this only for domain
> intent.

# Security Plan

## Status
Security design for future implementation. No secrets are read or configured in this milestone.

## Security boundaries
- `.credentials.txt` is local-only and must not be read, printed, copied, committed, or included in artifacts.
- Browser clients must never receive Mirakl tokens, Supabase service-role keys, or other privileged secrets.
- Mirakl write/import/publish and production deploys require explicit human approval.
- Evidence raw storage is approval-gated due to copyright/GDPR/ToS risk.

## Secrets management
Future production options:
- Vercel environment variables for server-only runtime secrets.
- Supabase Vault or another managed secret store if approved.
- Separate staging and production Mirakl tokens.

Rules:
- Do not put privileged secrets in `NEXT_PUBLIC_*` variables.
- Do not log Authorization headers or tokens.
- Rotate Mirakl token after suspected leak.
- Keep token usage auditable by job/import attempt.

## Roles
| Role | Description |
| --- | --- |
| admin | Full management, policy/config, emergency operations. |
| operator | Review products, approve export batches/import submissions. |
| reviewer | Accept/reject candidate fields and request evidence. |
| auditor | Read-only access to products, evidence metadata, reviews, audit events. |
| enrichment_service | Server-only service role for approved jobs. |

## RLS principles
- Enable RLS for all exposed tables.
- Use policies that match actual role actions, not blanket authenticated access.
- `review_decisions` and `audit_events` are append-only.
- Evidence raw storage requires stricter read policies than product summaries.
- Service-role operations must be isolated to server-only code.

## Threats and mitigations
| Threat | Mitigation |
| --- | --- |
| Secret leakage | Server-only env, scan docs/code/logs, no credential printing. |
| Unauthorized Mirakl write | Approval-gated import submission and audit events. |
| RLS bypass | Security review of policies; avoid service-role in client. |
| Evidence copyright/PII exposure | Evidence policy, retention, access controls, raw storage approval. |
| Stale source overwrite | Source snapshot hash, stale re-review requirement. |
| Reviewer abuse/mistake | Append-only decisions, audit log, role separation. |

## Incident response
1. Stop affected jobs/import submissions.
2. Revoke/rotate leaked credentials.
3. Review audit events and import attempts.
4. Identify affected export batches/products/evidence.
5. Patch secret handling and add regression checks.
6. Document incident and remediation.

## Security acceptance criteria
- RLS role matrix exists before migrations.
- No privileged secret can reach client bundle.
- Every approval-gated operation emits audit events.
- Evidence access and retention are explicit.

## Table-level RLS implementation checklist
- `mirakl_providers`, `products`, `product_sources`, `categories`, `category_attributes`, `mirakl_value_lists`: browser roles select only; ingestion/schema-sync writes through `enrichment_service` server-only path.
- `product_attribute_values`: browser roles select; accepted-candidate promotion is server-mediated and audited.
- `enrichment_jobs`: operators may request jobs; service role owns status transitions; reviewers can read scoped jobs.
- `enrichment_candidates`: reviewers/operators may create review decisions through server actions, not arbitrary candidate mutations.
- `evidence_sources`: raw storage references are never exposed directly; use server-mediated signed access only when approved.
- `review_decisions` and `audit_events`: append-only; updates/deletes require exceptional admin correction with a compensating audit event.
- `export_batches`, `export_batch_items`, `import_attempts`: approval-state checks must be enforced server-side before any submission path.
