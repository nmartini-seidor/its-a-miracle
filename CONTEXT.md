# Mirakl Product Enrichment

A workspace where an operator improves Mirakl catalog products: missing/weak attributes are filled by an investigation step that proposes sourced values, a human reviews them, and accepted values are prepared for Mirakl. This document is a glossary only — no implementation details.

## Language

**Product**:
A Mirakl catalog item under enrichment. Carries a baseline, an assigned schema, a quality score, and any candidates/evidence produced for it.
_Avoid_: listing, item, SKU (these mean narrower things in Mirakl).

**Baseline**:
The product's current Mirakl-sourced values (description and attributes) before enrichment. The thing candidates are compared against.
_Avoid_: source data, original (ambiguous).

**Attribute field**:
A single enrichable product property (e.g. brand, EAN, weight, refresh rate). The unit a candidate proposes a value for.

**Schema**:
The per-category attribute contract a product is scored against — which attribute fields are _required_ vs _recommended_. A demo concept derived from Mirakl categories, not the Mirakl category object itself.
_Avoid_: category, attribute set. ⚠️ Collides with "schema" in the database sense — always qualify when ambiguous.

**Aggregator**:
A configured definition of a class of information source (manufacturer, retailer, spec database, …) with an authority score and confidence policy. Governs how evidence from that source is weighted.
_Avoid_: source (too generic), provider.

**Evidence**:
A sourced record (URL, access date, snippet, extracted fields, confidence tier) that supports one or more candidates. Governed by the source tiers in `EVIDENCE_POLICY.md`.

**Candidate**:
A _proposed_ value for one attribute field, backed by evidence, with a confidence and a status (proposed → accepted/rejected/needs-evidence). Review-only: a candidate is never written to Mirakl without a human decision.
_Avoid_: suggestion, enrichment (the latter names the whole activity, not one proposal).

**Quality score / score band**:
A 0–100 completeness-and-confidence measure for a product, banded as red (<25) / yellow (<70) / blue (<90) / green (≥90).

**Research Job**:
The unit of work the operator launches and reviews for one product. Owns one or more Runner Runs and presents their merged result. Has a status lifecycle and is what the UI launches and polls.

**Runner Run** (or **Run**):
One agent's single attempt within a Research Job — e.g. the `claude` run. A Job in multi-runner mode owns up to three Runs (codex / cursor / claude) executed in parallel.

**Research Runner**:
A swappable adapter that _executes_ a Run by spawning one subscription-authed agent CLI (`cursor-agent`, `codex`, or `claude`) headlessly. Distinct from the Job (the tracked record) and from the subagent (the external CLI process the runner launches).
_Avoid_: agent (ambiguous — could mean the CLI, the adapter, or the marketing concept).

**Consensus**:
Agreement on an attribute field's value across the Runs of a Job. Consensus raises the merged candidate's confidence; its absence yields competing candidates and a flagged **Conflict**.

**Conflict**:
An attribute field where Runs (or their cited sources) disagree. Surfaced as competing candidates — each tagged with its runner/source — for a reviewer decision, never silently merged.

**Mission**:
The input contract handed to a Research Runner for one Job: the product baseline, the schema gaps to fill, the allowed-source tiers, and the exact output JSON Schema. Written to the job's working dir as `mission.json`.

**Worker**:
The single long-lived local process that picks up queued Research Jobs, spawns their Runners, and owns timeout/cancel/concurrency. Sole executor of research; survives Next dev-server reloads.

**Snapshot**:
A captured pull of real Mirakl product data (via the gated sync script) used to seed the catalog, so demos run on genuine Mirakl data without live per-run ingestion.

**Write-back**:
The closing step: accepted candidates assembled into a Mirakl import and submitted to the dev tenant behind explicit operator approval. `SENT` is submission, not publication.
_Avoid_: export, publish (publish implies live, which submission does not guarantee).

## Flagged ambiguities

- **"Schema"** overloaded between the per-category attribute contract and the database/Supabase sense.
- **Legacy code naming**: the existing code stores jobs in a `researchRuns` array and uses "run"/"job" interchangeably. Now that Job and Run are distinct (a Job owns N Runs), this naming should be migrated when the store is reworked.
