# Test Plan

## Status
Covers docs milestone and future implementation validation. No tests are created or run against app code because no app code exists yet.

## Docs milestone checks
- All required docs exist.
- Docs are mutually consistent on no-code/no-credential/no-live-action boundaries.
- Docs contain no secrets or copied credential values.
- No app scaffold is created (`package.json`, `components.json`, Next app files absent unless scope changes).
- Mirakl write/import/export/publish and Vercel deploys remain approval-gated.
- Required skills are listed in `AGENTS.md`.

## Future unit tests
| Area | Example |
| --- | --- |
| Scoring | Formula returns expected score and component breakdown. |
| Evidence | Validator rejects missing URL/access date/excerpt/page for PDFs. |
| Review workflow | Invalid state transitions are rejected. |
| Export validation | Invalid value-list/category fields fail preflight. |
| Staleness | Source hash change marks candidates/scores stale. |

## Future integration tests
| Area | Example |
| --- | --- |
| Mirakl ingestion | Source status rows and product details upsert idempotently. |
| Category schema sync | Required attribute drift marks scores stale. |
| Candidate evidence | Candidate values link to field-level evidence. |
| Supabase RLS | Each role can only perform allowed actions. |
| Import status | Polling stores reports/partial failures without silent retry. |

## Future E2E tests
1. Product list filter by score below 70.
2. Open product detail and inspect score components.
3. Run approved enrichment on one product.
4. Inspect candidate evidence.
5. Accept one field and reject another.
6. Generate draft export package.
7. Confirm submission is blocked until explicit approval.
8. Simulate partial import failure and verify operator-facing rework state.

## Security tests
- Secret scan generated docs/code/artifacts.
- Verify no privileged env variable uses `NEXT_PUBLIC_*`.
- Verify service-role client is server-only.
- Verify RLS blocks unauthorized evidence and review writes.
- Verify Mirakl write/import routes enforce approval state.

## Observability tests
- Job events recorded for ingestion/enrichment/scoring/export/import.
- Rate-limit/backoff events visible.
- Audit events recorded for review and approval actions.
- Score refresh freshness visible.

## Documentation acceptance checklist
- `DATA_MODEL.md` includes table-level RLS matrix.
- `EVIDENCE_POLICY.md` includes source tiers and retention.
- `SCORING_MODEL.md` includes pseudo-code and bands.
- `MIRAKL_INTEGRATION.md` includes full import lifecycle and `SENT` caveat.
- `UI.md` maps screens to shadcn primitives.
- `TASKS.md` includes validation spikes.
- `REVIEW_QA_WORKFLOW.md` includes pass/fail and fallback rules.

## Acceptance criteria
- 90%+ criteria are testable by command, checklist, or review artifact.
- High-risk paths have explicit negative tests.
- QA cannot pass without evidence.
