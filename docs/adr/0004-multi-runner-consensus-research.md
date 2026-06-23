# Research is multi-runner consensus (one Job → N Runs)

A Research Job fans out to up to three **Runner Runs** — `codex`, `cursor-agent`, `claude` — executed in parallel by the Worker. Results merge per attribute field: agreement across runs raises a candidate's confidence; disagreement produces **competing candidates** for the same field, each tagged with its originating runner/source and the field flagged as conflicted for the reviewer. A single-runner "quick mode" remains for speed.

## Why

The demo's thesis is "we launch *real, independent* agents." Three vendors' agents independently converging on the same value is the most direct proof of that, and cross-validation maps straight onto mechanics that already exist: the confidence tiers in `EVIDENCE_POLICY.md`, the `conflicting evidence` concept, and the candidate-supersession logic in `applyReviewDecisionToProduct`. Disagreement isn't a failure — it routes to the human-in-the-loop review that is already the product's core.

## Consequences

~3× time and subscription usage per job; merge/dedup logic and per-runner provenance in the UI. Splits the previously-collapsed **Job vs Run** concept (see `CONTEXT.md`): a Job is now the unit the operator launches and reviews; a Run is one agent's attempt within it.
