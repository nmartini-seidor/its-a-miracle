# Task Plan

## Status
Task backlog for docs milestone and future implementation. Only Phase 0 docs are approved by current Ralph execution.

## Standard task record fields
Every task below is defined with:
- Objective.
- Inputs.
- Outputs.
- Acceptance criteria.
- Validation evidence.
- Adversarial review gate.
- QA gate.
- Rollback/deferral note.

## Global gates for every task
- Do not read or print `.credentials.txt` unless a later task explicitly approves secret use.
- Do not submit Mirakl imports/exports/writes/publish actions without explicit operator approval.
- Do not deploy or mutate Vercel project/environment settings without explicit approval.
- Do not add non-shadcn UI libraries without explicit approval.
- Every task must produce review and QA evidence before `DONE`.

---

## Phase 0 — Docs package

### T0.1 — Create documentation package
- Objective: Produce the approved docs-only repo-root documentation package.
- Inputs: `.omx/plans/consensus-mirakl-product-enrichment.md`, `.omx/specs/deep-interview-mirakl-product-enrichment.md`, `MIRAKL_EXAMPLE_USAGE.md`, local CSV fixture headers.
- Outputs: `PRD.md`, `TECH_SPECS.md`, `ARCHITECTURE.md`, `DATA_MODEL.md`, `API_REFERENCE.md`, `UI.md`, `EVIDENCE_POLICY.md`, `SCORING_MODEL.md`, `MIRAKL_INTEGRATION.md`, `ENRICHMENT_STRATEGY.md`, `SECURITY.md`, `OPERATIONS.md`, `REVIEW_QA_WORKFLOW.md`, `TEST_PLAN.md`, `TASKS.md`, `AGENTS.md`.
- Acceptance criteria: all files exist; docs preserve no-code/no-credential/no-live-action boundaries; local `soft` category is described only as fixture data; Orange.es devices remain business target.
- Validation evidence: `test -s <file>` for all outputs; `test ! -f package.json`; `test ! -f components.json`; secret scan of generated docs/plans.
- Adversarial review gate: Gemini/Claude where available plus code-reviewer/critic.
- QA gate: verifier confirms all docs match consensus-plan acceptance criteria.
- Rollback/deferral note: if docs are inconsistent, revise docs only; do not scaffold to resolve ambiguity.

### T0.2 — Strict docs review and finding disposition
- Objective: Validate the docs package before implementation.
- Inputs: all docs from T0.1, review prompts, consensus plan.
- Outputs: review artifacts under `.omx/artifacts/` and a disposition section or report for findings.
- Acceptance criteria: zero unresolved high-severity findings; every medium/high finding fixed, deferred with rationale, or rejected with rationale.
- Validation evidence: artifact paths and summarized verdicts.
- Adversarial review gate: independent reviewer must not be the authoring context.
- QA gate: verifier confirms dispositions are present and no prohibited action occurred.
- Rollback/deferral note: unresolved high findings keep the task in `FIXING`.

### T0.3 — Docs QA sign-off
- Objective: Confirm the docs-only milestone is complete and safe for future implementation handoff.
- Inputs: docs package, review artifacts, disposition notes.
- Outputs: QA summary and updated Ralph state.
- Acceptance criteria: required docs exist, no scaffold, no secret leakage, approval gates present, task backlog is testable.
- Validation evidence: command output, verifier result, final file list.
- Adversarial review gate: not required beyond T0.2 unless QA finds new risk.
- QA gate: PASS from verifier/architect floor.
- Rollback/deferral note: if QA fails, return to T0.1/T0.2 fixes.

---

## Phase 1 — Approval-gated validation spikes

### T1.1 — Next.js + shadcn scaffold validation
- Objective: Validate Next.js App Router and shadcn/ui setup after explicit approval.
- Inputs: approved docs, shadcn installation docs, Next.js best-practice docs.
- Outputs: app scaffold, `components.json`, initial shadcn config, validation notes.
- Acceptance criteria: scaffold uses approved package manager; shadcn initialized via CLI; no custom UI primitive introduced.
- Validation evidence: install/scaffold command output, `npx shadcn@latest info`, lint/typecheck where available.
- Adversarial review gate: shadcn/Next reviewer checks component conventions and RSC boundaries.
- QA gate: verifier confirms scaffold only and no Mirakl/Supabase live work.
- Rollback/deferral note: delete scaffold branch/changes if initialization violates constraints.

### T1.2 — Supabase schema/RLS feasibility spike
- Objective: Validate the proposed schema and table-level RLS matrix in a local or approved staging Supabase environment.
- Inputs: `DATA_MODEL.md`, `SECURITY.md`, Supabase docs, approved environment.
- Outputs: draft migration or SQL prototype, RLS policy test notes, advisor output where available.
- Acceptance criteria: every proposed table has RLS policy coverage; service-role operations are server-only; browser role cannot mutate protected tables.
- Validation evidence: migration diff or SQL file, RLS test queries, Supabase advisor/security checklist output.
- Adversarial review gate: security-reviewer reviews RLS and secret handling.
- QA gate: verifier confirms policies match docs and no production DB was touched unless approved.
- Rollback/deferral note: discard prototype migration if policy model is unsafe.

### T1.3 — Read-only Mirakl category/product discovery
- Objective: Identify the first real Orange.es device category slice safely.
- Inputs: `MIRAKL_INTEGRATION.md`, approved credentials/read-only access, Mirakl docs.
- Outputs: category discovery report, proposed MVP category/product slice, fixture dataset metadata.
- Acceptance criteria: read-only calls only; no import/export/write endpoints used; selected MVP category is Orange.es-device relevant.
- Validation evidence: redacted request logs, response shape summary without secrets, category decision record.
- Adversarial review gate: integration reviewer confirms no write endpoints were used.
- QA gate: verifier confirms `.credentials.txt` values are not printed or committed.
- Rollback/deferral note: if access is unavailable, keep MVP category as pending and use local fixtures only.

### T1.4 — Mirakl import-file validation spike without submission
- Objective: Validate draft import row shape without submitting an import where possible.
- Inputs: `MIRAKL_INTEGRATION.md`, `DATA_MODEL.md`, existing import CSV fixture, approved safe validation path.
- Outputs: validation report, draft row examples, unresolved Mirakl constraints.
- Acceptance criteria: no `POST /api/products/imports` unless explicitly approved; value-list/category checks documented.
- Validation evidence: local validator output or documented inability to validate without submission.
- Adversarial review gate: integration reviewer checks that no mutation occurred.
- QA gate: verifier confirms no import id was created.
- Rollback/deferral note: if safe validation is unavailable, defer import validation to controlled write-prep phase.

### T1.5 — Evidence policy approval
- Objective: Resolve allowed sources, storage, retention, and compliance posture before enrichment jobs.
- Inputs: `EVIDENCE_POLICY.md`, legal/compliance/product decisions.
- Outputs: approved evidence policy version and exceptions list.
- Acceptance criteria: source tiers have approved/prohibited/pending status; raw storage TTLs and approval authority are defined.
- Validation evidence: decision record or signed approval artifact.
- Adversarial review gate: security/compliance reviewer.
- QA gate: verifier confirms enrichment tasks are blocked until policy is approved.
- Rollback/deferral note: if policy is not approved, enrichment remains disabled.

---

## Phase 2 — Data model and ingestion

### T2.1 — Implement Supabase migrations and indexes
- Objective: Create schema from `DATA_MODEL.md`.
- Inputs: approved T1.2, `DATA_MODEL.md`.
- Outputs: migration files, generated types if applicable.
- Acceptance criteria: tables, constraints, indexes, enum/check states implemented; no exposed table lacks RLS.
- Validation evidence: migration apply/reset output, type generation, advisor output.
- Review gate: database/security review.
- QA gate: RLS and schema tests pass.
- Rollback/deferral note: migration rollback/reset documented.

### T2.2 — Implement Mirakl read-only ingestion
- Objective: Ingest providers, source status, product details, attributes, and value lists.
- Inputs: T1.3 results, `MIRAKL_INTEGRATION.md`.
- Outputs: server-only Mirakl client, ingestion job, tests/fixtures.
- Acceptance criteria: idempotent upsert, 429 backoff, source hashes, audit events.
- Validation evidence: mocked integration tests and approved staging read-only run.
- Review gate: integration/security review.
- QA gate: verifier confirms no write endpoints called.
- Rollback/deferral note: feature flag disable ingestion.

### T2.3 — Implement schema drift detection
- Objective: Detect category/value-list changes and mark affected scores/candidates stale.
- Inputs: category/value-list snapshots.
- Outputs: drift detector and stale-marking job.
- Acceptance criteria: changed required attributes mark scores stale and require re-review for affected candidates.
- Validation evidence: unit/integration tests with changed schema fixtures.
- Review gate: data-model review.
- QA gate: stale state visible in test projection.
- Rollback/deferral note: disable scheduled sync and require manual refresh.

---

## Phase 3 — Scoring and enrichment

### T3.1 — Implement materialized scoring
- Objective: Calculate and store explainable 0-100 quality scores.
- Inputs: `SCORING_MODEL.md`, product/category data.
- Outputs: scoring module, score refresh job, tests.
- Acceptance criteria: denominator-zero/stale/unknown category behavior implemented; component breakdown stored.
- Validation evidence: unit tests for bands and edge cases.
- Review gate: test-engineer review.
- QA gate: verifier checks sample scores.
- Rollback/deferral note: hide score sort if formula is blocked.

### T3.2 — Implement evidence validators
- Objective: Enforce required evidence metadata and retention classes.
- Inputs: `EVIDENCE_POLICY.md`.
- Outputs: validation module and tests.
- Acceptance criteria: PDF page/excerpt required; raw storage approval enforced; low-confidence sources flagged.
- Validation evidence: unit tests.
- Review gate: security/compliance review.
- QA gate: verifier checks invalid evidence is rejected.
- Rollback/deferral note: disable enrichment if evidence validation fails.

### T3.3 — Implement candidate generation jobs
- Objective: Draft field-level enrichment candidates under approved policy.
- Inputs: approved evidence policy, product/category data.
- Outputs: job runner, candidate/evidence persistence.
- Acceptance criteria: candidates use `CANDIDATE_PROPOSED`; no auto-approval; evidence links are field-level.
- Validation evidence: mocked source extraction tests.
- Review gate: security and integration review.
- QA gate: verifier confirms no Mirakl write path used.
- Rollback/deferral note: feature flag disable enrichment jobs.

---

## Phase 4 — Dashboard and review

### T4.1 — Build shadcn dashboard shell and product list
- Objective: Create app shell, filters, score cards, product table.
- Inputs: `UI.md`, shadcn docs.
- Outputs: Next.js pages/components.
- Acceptance criteria: shadcn primitives only; score bands visible with text and color; no data waterfalls for independent loads.
- Validation evidence: lint/typecheck/component tests.
- Review gate: shadcn/Next reviewer.
- QA gate: visual/functional QA.
- Rollback/deferral note: revert UI slice without affecting data layer.

### T4.2 — Build product detail, diff, evidence, and review flow
- Objective: Implement source-vs-target review UX.
- Inputs: `UI.md`, review state machine.
- Outputs: detail route, diff panel, evidence sheet, review controls.
- Acceptance criteria: allowed state transitions only; stale warnings shown; evidence visible per field.
- Validation evidence: component/e2e tests.
- Review gate: designer + security review.
- QA gate: e2e review scenario passes.
- Rollback/deferral note: disable review actions behind feature flag.

### T4.3 — Build job/category/export history views
- Objective: Show job state, category completeness, and export/import audit history.
- Inputs: operations and data docs.
- Outputs: UI routes/components.
- Acceptance criteria: failures and partial imports are actionable; category drift visible.
- Validation evidence: component/e2e tests.
- Review gate: designer + QA review.
- QA gate: verifier checks failure-state fixtures.
- Rollback/deferral note: hide incomplete tabs.

---

## Phase 5 — Controlled export/import preparation

### T5.1 — Generate draft export packages
- Objective: Build draft packages from approved field-level candidates.
- Inputs: approved candidates, latest schema/value lists.
- Outputs: export batch builder and validators.
- Acceptance criteria: source snapshot current; value-list/category validation passes; package is draft/locked but not submitted.
- Validation evidence: unit/integration tests and file hash audit.
- Review gate: integration/security review.
- QA gate: verifier confirms no submission.
- Rollback/deferral note: delete draft package and reset candidates to approved if validation fails.

### T5.2 — Implement approval-gated import submission
- Objective: Submit Mirakl import only after explicit operator approval.
- Inputs: locked export batch and approval record.
- Outputs: import submission handler and audit events.
- Acceptance criteria: no `IMPORT_SUBMISSION_APPROVED` state means no submission; import id recorded only after `IMPORT_SUBMITTED`; retry policy bounded.
- Validation evidence: mocked tests and approved staging run if allowed.
- Review gate: security/integration review.
- QA gate: verifier confirms approval enforcement.
- Rollback/deferral note: disable submission endpoint if any safety check fails.

### T5.3 — Implement import status/report polling
- Objective: Track Mirakl import lifecycle and partial failures.
- Inputs: import id and Mirakl report endpoints.
- Outputs: polling job, report metadata, rework states.
- Acceptance criteria: `SENT` not treated as live; reports captured; `IMPORT_PARTIAL_FAILURE` creates rework.
- Validation evidence: mocked status/report tests.
- Review gate: integration review.
- QA gate: partial failure e2e passes.
- Rollback/deferral note: manual status check fallback.

---

## Phase 6 — Deployment and operations

### T6.1 — Vercel project linking and env setup
- Objective: Link Vercel project and configure server-only environment variables after approval.
- Inputs: `OPERATIONS.md`, `SECURITY.md`, approved team/project.
- Outputs: `.vercel` metadata, env configuration notes.
- Acceptance criteria: correct team/project; no secrets in git; env pulled securely.
- Validation evidence: `vercel whoami`, `vercel env ls`, redacted logs.
- Review gate: security/ops review.
- QA gate: verifier confirms deployment protection.
- Rollback/deferral note: unlink or remove env vars if wrong team/project.

### T6.2 — Preview and production deployment
- Objective: Deploy preview/prod after approval and tests.
- Inputs: green build/test, Vercel project.
- Outputs: preview/prod URLs and deployment logs.
- Acceptance criteria: build passes, env present, no secrets exposed, monitoring enabled.
- Validation evidence: Vercel deploy output, smoke tests.
- Review gate: release review.
- QA gate: smoke/e2e tests pass.
- Rollback/deferral note: rollback deployment or disable project if critical issue.

### T5.0 — Preload Mirakl value-list values before product imports
- Objective: Ensure list-backed attributes such as `brand` accept all values needed by extracted Orange products before product import.
- Inputs: Orange product JSONL/CSV, `MIRAKL_INTEGRATION.md`, Mirakl `GET /api/products/attributes`, Mirakl `GET /api/values_lists`.
- Outputs: value-list diff report, value-list import draft, value-list import status report, refreshed mapping table.
- Acceptance criteria: every product row with a list-backed attribute has an accepted Mirakl value or is blocked with a manual mapping decision; no placeholder brand substitutions.
- Validation evidence: `brand-values` diff before/after, value-list import id/status, zero missing required brand mappings before product import generation.
- Review gate: integration reviewer confirms only value-list endpoints were used and no product import was generated before value-list validation.
- QA gate: verifier confirms product import is blocked while missing required value-list entries remain.
- Rollback/deferral note: if value-list import fails, do not push affected product rows; keep them in mapping-needed state.

### T5.-1 — Create or map Mirakl attributes before product imports
- Objective: Ensure category-specific Orange attributes (for example PS5 memory/connectivity/dimensions/box contents) exist as Mirakl attributes or have explicit mappings before product import.
- Inputs: Orange extracted attributes, `MIRAKL_INTEGRATION.md`, Mirakl `GET /api/products/attributes`, Mirakl category/hierarchy model.
- Outputs: attribute diff report, proposed Mirakl attribute model changes, approved mapping table, refreshed product import template.
- Acceptance criteria: every CSV column intended for import is accepted by Mirakl for the target hierarchy; unmapped Orange attributes are blocked or intentionally stored as evidence-only enrichment candidates.
- Validation evidence: before/after attribute config export, product import dry-run/transformed file showing discrete columns preserved, zero unexpected ignored columns.
- Review gate: catalog-model reviewer confirms attribute names/types and category assignment.
- QA gate: verifier confirms PS5 attributes appear as discrete mapped fields or are explicitly documented as not imported.
- Rollback/deferral note: if Mirakl attribute creation is not approved, do not push those fields; keep them in enrichment candidate/evidence storage until the model is ready.

### T5.-2 — Verify Mirakl catalog-configuration permissions
- Objective: Confirm the configured Mirakl credential can update value lists, hierarchies, and product attributes before bulk import work begins.
- Inputs: approved Mirakl operator credential, draft value-list/hierarchy/attribute import files.
- Outputs: permission check report for `POST /api/values_lists/imports`, `POST /api/hierarchies/imports`, and `POST /api/products/attributes/imports`.
- Acceptance criteria: all required catalog-configuration endpoints accept imports or the task is blocked with a permission escalation request; product imports are not generated for unmapped attributes/brands while permissions are missing.
- Validation evidence: import IDs/statuses for accepted config imports, or redacted `403 Forbidden` responses proving missing permissions.
- Review gate: integration reviewer confirms no product import proceeds while config imports are forbidden.
- QA gate: verifier confirms missing permission blocks bulk push.
- Rollback/deferral note: if permission is missing, request an operator role/token with catalog configuration rights and keep products in mapping-needed state.

### T5.-3 — Validate variant grouping before import
- Objective: Prevent unrelated products from being grouped into persistent Mirakl variant families.
- Inputs: product import draft, category model, variant-axis requirements.
- Outputs: variant grouping validation report.
- Acceptance criteria: standalone products omit `variantGroupCode`; true variants share a group only when category, variant attributes, and variant-axis values are complete and consistent.
- Validation evidence: no `size-variant-code-is-null`, no irrelevant-category variant warnings, transformed file shows expected variant-axis values.
- Review gate: catalog-model reviewer confirms variant grouping is intentional.
- QA gate: verifier checks no unrelated products share a variant group.
- Rollback/deferral note: if a bad variant family exists, do not rely on re-import alone; use Mirakl UI/back-office cleanup or reject/delete pending source products.
