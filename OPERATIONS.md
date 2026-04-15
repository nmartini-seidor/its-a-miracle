# Operations Plan

## Status
Operational design for future implementation. No deployment or live operations are performed in this milestone.

## Environments
| Environment | Purpose | Notes |
| --- | --- | --- |
| Local | Development and docs validation | Must not require real credentials for docs. |
| Staging | Approved integration testing | Uses staging Mirakl/Supabase/Vercel resources after approval. |
| Production | Operator use | Requires explicit deployment approval. |

## Deployment posture
- Vercel is the intended deployment target once approved.
- Use `vercel link` / `vercel pull` only during approved deployment setup.
- Do not deploy from docs milestone.
- Environment variables must be reviewed before preview/production deploy.

## Job operations
| Job | Initial mode | Operational notes |
| --- | --- | --- |
| Schema sync | Manual | Run before scoring/export; detect drift. |
| Product ingestion | Manual, then scheduled | Respect Mirakl rate limits. |
| Enrichment | On-demand first | Requires evidence policy approval. |
| Score refresh | Event-driven + scheduled | Materialized scores with stale flags. |
| Export package generation | Manual | Creates draft/locked packages only. |
| Import submission/status | Approval-gated | Operator-visible partial failures. |

## Monitoring and audit
Track:
- Job status, duration, retries, failures.
- Mirakl 429/backoff events.
- Source schema drift.
- Score refresh freshness.
- Candidate creation and review decisions.
- Export batch creation/locking/approval.
- Import submission/status/report retrieval.

## Runbooks
### Mirakl rate limit spike
1. Pause non-critical ingestion/enrichment jobs.
2. Honor retry windows.
3. Resume with lower concurrency.
4. Record event and update operational thresholds.

### Partial import failure
1. Retrieve available reports.
2. Mark failed rows/candidates.
3. Notify operator with actionable errors.
4. Do not auto-resubmit.
5. Rework and require approval for any new submission.

### Category schema drift
1. Mark affected scores stale.
2. Run schema sync.
3. Recalculate scores.
4. Mark affected approved candidates stale if needed.

### Evidence retention cleanup
1. Identify expired raw evidence objects.
2. Preserve normalized provenance metadata where allowed.
3. Delete raw objects according to policy.
4. Audit deletion.

## Operational acceptance criteria
- Operators can understand job state and failure impact.
- No production deploy occurs without approval.
- Job retries/backoff are bounded and observable.
- Import failures produce rework, not silent data loss.
