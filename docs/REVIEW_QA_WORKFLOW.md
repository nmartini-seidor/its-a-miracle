# Review and QA Workflow

## Purpose
Define how every task is validated before it is considered complete.

## Task lifecycle
```text
TODO -> IN_PROGRESS -> SELF_CHECKED -> ADVERSARIAL_REVIEW -> FIXING -> QA_VALIDATION -> DONE
                         \-> BLOCKED / DEFERRED with rationale
```

## Required gates
1. **Self-check** by implementer against task acceptance criteria.
2. **Adversarial review** by independent reviewer(s).
3. **Finding disposition** for every medium/high issue.
4. **QA validation** against objective acceptance criteria.
5. **Final evidence summary** before completion.

## Adversarial reviewers
Preferred:
- `ask-gemini` local CLI when available.
- `ask-claude` local CLI when available.
- `code-reviewer` or `critic` subagent.

Fallback:
- If Gemini/Claude CLI is unavailable or fails, use an independent `code-reviewer`, `critic`, `security-reviewer`, or `verifier` and document the reason.

## Pass/fail criteria
Pass only when:
- Zero unresolved high-severity findings.
- Every medium/high finding is fixed, explicitly deferred, or rejected with rationale.
- QA confirms acceptance criteria.
- No task violates non-goals or approval gates.

Fail/revise when:
- Any high-severity finding is unresolved.
- Security/secret/Mirakl write boundary is violated.
- Tests/validation are missing or only asserted without evidence.
- Docs are inconsistent with the consensus plan.

## Finding disposition table
Each review should produce:
| Finding | Severity | Source | Decision | Rationale | Follow-up |
| --- | --- | --- | --- | --- | --- |
| Example | High/Medium/Low | Gemini/Claude/Critic/QA | Fixed/Deferred/Rejected | Why | Link/task |

## QA evidence format
QA reports should include:
- Files reviewed.
- Acceptance criteria checked.
- Commands/checks run.
- Pass/fail result.
- Residual risks.
- Confirmation that no prohibited actions occurred.

## Development vs production agents
- Development/review agents help write, review, and validate project artifacts.
- Production enrichment agents are future application jobs that create product-data candidates.
- Development agents must not run production enrichment jobs unless explicitly authorized by a later implementation task.

## Acceptance criteria
- Review workflow is mandatory for every task.
- Gemini/Claude usage and fallback behavior are defined.
- QA requires evidence, not assertion.
