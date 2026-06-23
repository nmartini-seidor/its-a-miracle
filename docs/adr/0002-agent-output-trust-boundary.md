# Agent output trust boundary: file-drop + zod validation

A `ResearchRunner`'s only trusted output is an `output.json` it writes to its per-job working dir, validated with **zod** (already a dependency). The same zod schema both *generates* the JSON Schema handed to the agent in its mission and *validates* what comes back. The agent's prose/stdout is never parsed for data; candidates not linked to an evidence record are dropped; invalid output gets one repair-retry with the validation errors fed back.

## Why

Three different agent CLIs (`codex`, `cursor-agent`, `claude`) must share one ingestion path, and a free-roaming browsing agent must not be able to inject unvalidated values into the catalog. A file-drop is robust to agent chatter in a way stdout-parsing is not, and is identical across runners — which is what makes supporting three of them cheap.

## Consequences

Agents must reliably produce conformant files; mitigated by the repair-retry and by the pre-build feasibility spike. Enforces `ENRICHMENT_STRATEGY.md`'s rule that every candidate cites evidence.

Confidence is **not** self-reported by the agent: our validator assigns it from the tier of the cited evidence source (per `EVIDENCE_POLICY.md`) — manufacturer/official can be high, retailer-only is capped at low/medium, D-tier (forums/social/unattributed) is hard-rejected. The agent's filesystem/exec is jailed to its per-run working dir with no repo/`.git` write access; only the validated `output.json` is ever ingested, so whatever it does in its sandbox is irrelevant to catalog integrity.
