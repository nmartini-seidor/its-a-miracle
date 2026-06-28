# Demo Hardening — new-session handoff

## Kickoff (paste this to start the new session)

> Execute the **Demo Hardening Plan** (`docs/hardening-plan.md`) for the Mirakl Product Enrichment workspace. This repo is a Next.js App Router **sales demo** with a *real* research pipeline — a local **Worker** (`pnpm worker`) spawns `cursor-agent`/`codex`/`claude` CLIs under the host's subscription logins, their `output.json` is zod-validated, runs are merged by consensus, and state persists in **SQLite** (`data/demo.sqlite`) — plus a gated Mirakl dev-tenant write-back. The work closes a set of "looks supported but doesn't actually work" gaps from a functional audit: **research can silently hang** with no feedback when the Worker is down / no runner is installed / intake is paused; a Settings **toggle and the import progress bar are fakes**; several **errors fail silently**; and some **docs contradict the code**. Read the documents in the list below for full context and exact per-item scope, then implement the plan **wave by wave** (A → B → C), keeping `pnpm lint && pnpm typecheck && pnpm test` green throughout. This is intended to be run with **ultracode** (multi-agent orchestration); adversarially verify each change. **Do not mark any item done on unit tests alone — start the real app and verify every behavior live in the browser** per the Live-test protocol below. **Items 2 + 9 (Mirakl auth + live import)** require dev-tenant credentials and an explicit approval click and must **not** be fired autonomously: implement the code and the local dry-run, but leave the live single-row import as the human-run step in ADR 0007's runbook (it was deferred — confirm with the operator before doing any live Mirakl write).

## Documents to read (in this order)

**Tier 1 — what to execute (must read):**
1. `docs/hardening-plan.md` — the execution spec: Waves A/B/C, dependency graph, per-item scope, acceptance criteria, the adversarial-review gotchas, and the 6↔11 / 13a→13b couplings. **This is the primary work order.**
2. `docs/adr/0006-worker-liveness-and-research-progress-states.md` — the decision behind items **1 + 4** (Worker heartbeat, the paused/offline/no-runners/queued taxonomy). Read the "Considered options" — they encode why the obvious approaches are wrong (e.g. heartbeat-per-loop is broken).
3. `docs/adr/0007-mirakl-writeback-auth-and-verification.md` — the decision + **human runbook** for items **2 + 9** (configurable static-key auth, attribute codes from category config, hardened poller, dev-only guard). The live-import proof is human-gated.

**Tier 2 — project context (read for architecture & rules):**
4. `CLAUDE.md` — project instructions and commands. ⚠️ Its "Architecture"/"Conventions" sections are **stale** (describe a retired simulated/JSON-file design); **item 10 fixes them**. Trust the intro + ADRs + the plan over those sections.
5. `CONTEXT.md` — the domain glossary (Product, Candidate, Research Job/Run, Worker, **Research intake**, Write-back). Use this vocabulary in code, comments, and UI copy.
6. `AGENTS.md` — **guardrails still in force**: never read/print/commit `.credentials.txt`; live Mirakl reads/writes are approval-gated; no Vercel deploy without approval. (Its "docs-only / opencode-lightweb" milestone language is stale — item 12 retires it, but the guardrails stay.)
7. `EXECUTION_PLAN.md` — the original simulated→real migration record; explains why the mock symbols were deleted.

**Tier 3 — foundational decisions (read to avoid re-litigating settled architecture):**
8. `docs/adr/0001-local-first-subscription-cli-runners.md` — why local Worker, not Vercel/serverless.
9. `docs/adr/0002-agent-output-trust-boundary.md` — the file-drop + zod validation trust boundary.
10. `docs/adr/0003-sqlite-local-state-not-supabase.md` — why SQLite, Supabase deliberately unwired.
11. `docs/adr/0004-multi-runner-consensus-research.md` — the three-runner consensus/conflict merge.
12. `docs/adr/0005-mirakl-snapshot-input-dev-tenant-writeback.md` — the Mirakl scope ADR 0007 refines.

**Tier 4 — evidence (optional, for grounding only):**
13. `docs/real-research/*.md` — committed GREEN-PASS phase evidence for the real pipeline. (`data/spike/PHASE*.md` is the local, gitignored mirror.)

## Live-test protocol (mandatory — the real app, not just `pnpm test`)

Use the `run` / `verify` skills. In two terminals: `pnpm dev` and `pnpm worker`. Then verify each behavior in the browser:

- **Item 1 — silent hang.** With **no** `pnpm worker` running, click *Run Research* on a product → a clear "Worker not running" message appears within ~20s (no infinite "Researching…"). Start the Worker → a real job runs and the runner lanes update to terminal status. Queue a 2nd product while the 1st is mid-run → the 2nd reads "queued / Worker busy", **not** "down". If no runner CLI is installed/logged-in, confirm the "no runners available" path instead (it is itself a valid live test).
- **Item 4 — paused intake.** Settings → set research to **Paused** → the *Run Research* trigger is disabled with a distinct "Research paused in Settings" reason and the API returns `409 RESEARCH_PAUSED`; a job already in flight still finishes. Set back to **Enabled** → research works again.
- **Item 6 — honest import.** Trigger "Import Product data" → progress shows no fabricated `N/55` and no fake "Analyzing" steps; the final count equals the real imported count.
- **Item 13 — error surfacing.** Force a failure (e.g. stop the dev server mid-action, or a bad schema save) → a visible error toast appears (confirm `<Toaster/>` is mounted first).
- **Regression.** Click through Products → product detail → review/approve a candidate → export preview, and the Catalog/Schemas/Aggregators pages, to confirm nothing broke.
- **Gate:** `pnpm lint && pnpm typecheck && pnpm test` all green.

- **Item 2 + 9 — Mirakl (human-gated, deferred).** Code + the local CSV-shape dry-run can be implemented and unit-tested now. The **live** proof — one approved single-row import to `seidor-dev.mirakl.net`, confirmed present on re-read (not stuck in `MCM-04014`/`MCM-0L000`) — follows ADR 0007's runbook and needs dev credentials + an explicit approval click. Do not run it without operator sign-off.

## Scope note
The operator previously chose to **defer Mirakl (items 2 + 9)**. If "all points" now includes Mirakl, implement the code and dry-run, but still treat the live write as the human-gated runbook step. Out of scope entirely (dropped from the audit list): item 3 (fake competitor "Configure" buttons / "Nico" menu) and item 7 (delete dead `data/demo-state.json`, `sidebar-nav.tsx`, `seo-description` route).
