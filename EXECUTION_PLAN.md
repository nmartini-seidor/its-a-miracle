# Execution Plan — Make the Research & Mirakl Round-Trip Real

> **Handoff brief.** This is the entry point for implementing the move from *simulated* enrichment to *real* subscription-CLI agents plus a real Mirakl dev-tenant write-back. Read the linked canonical sources **first**, obey the hard constraints, and execute the phases in order. The whole plan is gated on Phase 0 succeeding.

---

## 0. Goal in one sentence

Replace the two mocked behaviors — (a) the time-simulated research that fabricates candidates from hardcoded profiles, and (b) the fixtures-based catalog with no real Mirakl write — with **real research by three subscription-authed agent CLIs running in parallel**, merged by consensus, reviewed by a human, and **written back to the Mirakl dev tenant** behind an explicit approval click. Nothing faked end-to-end.

The agreed flow:

```
real Mirakl snapshot → catalog (SQLite)
   operator clicks "Run Research" on a product
      Research Job (QUEUED) ──► Worker (one long-lived local process)
            spawns 3 jailed Runs in parallel: cursor-agent · codex · claude
            each: subscription auth, cwd-jailed, browses web, writes output.json
      validate each output.json (zod) · confidence assigned by source tier · drop D-tier / evidence-less
      merge per attribute field → consensus (high conf) | conflict (competing candidates, runner-tagged)
      human review (existing approve/reject flow)
      accepted candidates → real CSV import → operator clicks "Submit to Mirakl"
      real round-trip to dev tenant (POST import → poll status → show result)
```

---

## 1. Read these first (canonical sources)

**Decisions (do not re-litigate — these are settled):**
- [`CONTEXT.md`](./CONTEXT.md) — the glossary. **Use this vocabulary in code, types, and UI.** Note especially the **Research Job → Runner Run → Research Runner** distinction, **Mission**, **Worker**, **Consensus**, **Conflict**, **Snapshot**, **Write-back**.
- [`docs/adr/0001-local-first-subscription-cli-runners.md`](./docs/adr/0001-local-first-subscription-cli-runners.md) — local-first; a Worker spawns subscription CLIs; **not** deployed to Vercel.
- [`docs/adr/0002-agent-output-trust-boundary.md`](./docs/adr/0002-agent-output-trust-boundary.md) — file-drop + zod; never trust agent prose; **validator assigns confidence**, not the agent.
- [`docs/adr/0003-sqlite-local-state-not-supabase.md`](./docs/adr/0003-sqlite-local-state-not-supabase.md) — SQLite store; the Supabase migration is intentionally NOT wired up.
- [`docs/adr/0004-multi-runner-consensus-research.md`](./docs/adr/0004-multi-runner-consensus-research.md) — one Job → N parallel Runs; agreement→confidence, disagreement→competing candidates.
- [`docs/adr/0005-mirakl-snapshot-input-dev-tenant-writeback.md`](./docs/adr/0005-mirakl-snapshot-input-dev-tenant-writeback.md) — snapshot-seeded input; dev-tenant write-back behind explicit approval.

**Policy & domain (the rules agents and validators must enforce):**
- [`AGENTS.md`](./AGENTS.md) — **hard prohibitions and approval gates. Binding.**
- [`docs/EVIDENCE_POLICY.md`](./docs/EVIDENCE_POLICY.md) — source tiers (A/B/C/D), required evidence metadata, confidence rules.
- [`docs/ENRICHMENT_STRATEGY.md`](./docs/ENRICHMENT_STRATEGY.md) — research workflow, source priority, "every candidate cites evidence."
- [`CLAUDE.md`](./CLAUDE.md) — repo conventions and commands.

**Existing code seams (what you are replacing / extending):**
- `server/store.ts` — **the mock lives here.** Replace `createMockResearchRun`, `deriveResearchStatus` (time-based), `buildResearchOutcome` / `applyResearchOutcome` (fabricates from `explicitResearchProfiles` + `getDerivedResearchAttributes`). Keep the *ingestion* shape (candidates/evidence onto products) but feed it from real validated output. This module is the single state chokepoint → migrate its internals to SQLite, keep its exported signatures.
- `server/data.ts` — thin async read API used by Server Components.
- `lib/types.ts` — `ResearchJobStatus` (add `FAILED`/`TIMEOUT`/`CANCELLED`), `ResearchJob.runner` (currently the single literal `"opencode-lightweb"` → becomes a runner enum), `CandidateRecord`, `EvidenceRecord`, `ProductRecord`.
- `lib/demo-contract.ts` — canonical field set; bump `MOCK_DOMAIN_CONTRACT_VERSION` on any shape change.
- `lib/scoring.ts` — `qualityScore` / `scoreBand`; reused unchanged on real candidates.
- `server/mirakl-live-sync.ts` — already builds a real CSV import draft (`buildMiraklAttributeSyncDraft`) and has `MiraklAttributeSyncSubmission` types; **the actual submit + status poll is not implemented yet** — Phase 7 implements it.
- `scripts/sync-mirakl-snapshot.mjs` — gated live read (`--live-read-approved`, `MIRAKL_OPERATOR_API_KEY`) writing `data/mirakl/snapshots/`; Phase 6 seeds the catalog from its output.
- `components/product/research-button.tsx` — polls `/api/research-jobs/{id}` every 1s; extend for per-run progress.
- `app/api/products/[id]/research-jobs/route.ts` (POST launch) and `app/api/research-jobs/[id]/route.ts` (GET status).

---

## 2. Hard constraints (non-negotiable)

1. **No Mirakl production writes — ever, in this work.** Dev tenant only (`https://seidor-dev.mirakl.net`). Write-back requires an explicit in-UI operator click. `SENT` ≠ published. (`AGENTS.md`, ADR 0005.)
2. **Subscription auth only.** Never hardcode or require API keys for the runners; rely on each CLI's ambient login on the host. Never read/print/commit `.credentials.txt`.
3. **Trust only the validated `output.json`.** Never parse agent prose/stdout for catalog data. Validate with zod (already a dependency). **Confidence is assigned by our validator from the cited source tier**, not self-reported by the agent. Drop candidates with no evidence link; hard-reject D-tier (forums/social/unattributed) sources; retailer-only candidates cap at low/medium. (ADR 0002, `EVIDENCE_POLICY.md`.)
4. **Jail every Run.** `cwd` = its own per-run working dir; **no write access to the repo or `.git`**; network open for browsing. Only `output.json` is ingested.
5. **shadcn/ui only** for UI; compose from `components/ui/` primitives (`AGENTS.md`, `components.json`).
6. **Repo conventions** (`CLAUDE.md`): explicit `.ts`/`.tsx` import extensions; `@/*` alias = repo root; no semicolons, double quotes; tests are `.mjs` under `tests/` run with `node --test`.

---

## 3. Phase 0 — Feasibility spike (DO THIS FIRST; gate everything on it)

The entire plan assumes each CLI runs headlessly **under subscription auth** (no API key), can browse the web, and can emit conformant JSON. Verify before building anything. Write a throwaway script (`scripts/spike-runners.mjs`, delete after) that, for one real product, invokes each runner and captures the result:

- `cursor-agent -p --output-format json …` (the question mark — its `--print` help leans on `CURSOR_API_KEY`; confirm it works under `cursor-agent login`).
- `codex exec …` (under ChatGPT subscription login).
- `claude -p --output-format json …` (under Claude subscription login).

**Report for each:** (a) ran without an API key? (b) performed a real web search? (c) produced JSON we can coerce to the output schema? (d) rough wall-clock + any rate-limit/ToS warning.

**If any runner fails (a) or (b), stop and report** — the multi-runner design (ADR 0004) degrades gracefully to fewer runners, but we decide that explicitly, not silently.

---

## 4. Build phases

Each phase lists objective · files · acceptance criteria. Phases 1→2→3 are the sequential foundation; later phases can overlap (see §5).

### Phase 1 — SQLite store
- **Objective:** Replace the `data/demo-state.json` file with SQLite (`better-sqlite3`), keeping every `server/store.ts` export signature. Add a `runs` table (Job → N Runs). Extend `ResearchJobStatus` with `FAILED`/`TIMEOUT`/`CANCELLED`. Seed from `lib/fixtures.ts` (and later from a Mirakl snapshot, Phase 6).
- **Files:** `server/store.ts`, `lib/types.ts`, `package.json` (dep + `reset:demo`/`import:demo` scripts), `tests/*`.
- **Done when:** all existing tests pass against SQLite; the `--test-concurrency=1` constraint can be removed; two processes can read/write state without corruption.

### Phase 2 — Contracts (zod)
- **Objective:** One zod schema set for the **Mission** (input to a Run) and the **output.json** (`EvidenceRecord[]` + `CandidateRecord[]`). Generate the JSON Schema string embedded in the Mission from the same zod source. Add the validator: parse → on failure, one repair-retry feeding errors back → assign confidence by source tier → drop evidence-less / D-tier.
- **Files:** new `lib/research-contract.ts` (or similar), reusing `lib/types.ts` + `lib/demo-contract.ts` + `EVIDENCE_POLICY` tiers.
- **Done when:** a hand-written valid `output.json` validates; malformed/evidence-less/D-tier inputs are rejected or down-ranked exactly per the rules in §2.3.

### Phase 3 — Worker + runners
- **Objective:** A standalone long-lived Node process (`pnpm worker`) that polls for `QUEUED` jobs, builds each Run's working dir + `mission.json`, and spawns runners via a `ResearchRunner` interface with three adapters (`cursor`, `codex`, `claude`). Jail `cwd`; tee the stream to `log.ndjson`; on exit validate `output.json` and ingest. Owns timeout/cancel/concurrency.
- **Files:** new `server/worker/*`, `server/research-runner/*` (interface + 3 adapters), wire `createMockResearchRun` → real launch, `getResearchRun` → real status.
- **Done when:** clicking "Run Research" spawns real agents that produce real, validated candidates; a killed/timed-out Run yields `FAILED`/`TIMEOUT`, not a hang; the Worker survives a Next dev-server reload.

### Phase 4 — Consensus / conflict merge
- **Objective:** Merge the (up to) three Runs per attribute field. Agreement → single candidate, raised confidence. Disagreement → competing candidates, each tagged with originating runner + source, field flagged **Conflict** (reuse the existing multi-candidate-per-field + supersession-on-approve model).
- **Files:** merge logic in `server/store.ts` ingestion path; `lib/types.ts` (runner/source provenance on `CandidateRecord` if not already expressible).
- **Done when:** three Runs agreeing on EAN produce one high-confidence candidate; disagreement produces competing candidates surfaced for review.

### Phase 5 — UI
- **Objective:** Per-run live progress (3 lanes), a comparison view showing consensus vs conflict, and conflict review using the existing approve/reject flow. shadcn/ui only.
- **Files:** `components/product/*`, `components/app/research-activity.ts`, `research-button.tsx`, status route.
- **Done when:** the operator can watch three agents work, see where they agree/disagree, and resolve conflicts.

### Phase 6 — Mirakl input (snapshot seed)
- **Objective:** Seed the catalog from a real Mirakl snapshot produced by `scripts/sync-mirakl-snapshot.mjs` (gated). Map snapshot → `ProductRecord` baseline.
- **Done when:** `pnpm import:demo` (or a new `import:snapshot`) loads genuine Mirakl products; demo runs on real data without per-run live ingestion.

### Phase 7 — Mirakl write-back (dev tenant)
- **Objective:** Implement the real submit + poll on top of `buildMiraklAttributeSyncDraft`: POST import to the dev tenant → `import_id` → poll status → retrieve reports → display. Behind an explicit "Submit to Mirakl" approval click. Never auto-submit; production unreachable from this flow.
- **Files:** `server/mirakl-live-sync.ts` (submit/poll), a gated API route, a `components/product/*` approval control.
- **Done when:** accepted candidates round-trip to the dev tenant and the real import status/reports show in the UI; no code path can submit to production.

---

## 5. Executing with multi-agent orchestration (ultracode)

- **Sequential spine:** Phase 0 → 1 → 2 → 3. Do not parallelize these; each is a hard dependency for the next.
- **Fan-out points:** the three runner adapters in Phase 3 are independent (one agent each). Phases 5 (UI), 6 (input), and 7 (write-back) can run in parallel once Phase 4 lands.
- **Isolation:** if running phases concurrently with file edits, use separate git worktrees — Phases 6 and 7 touch Mirakl code, Phase 5 touches UI, low overlap.
- **Verify adversarially:** for the validator (Phase 2) and the merge (Phase 4), have a separate reviewer agent try to slip evidence-less / D-tier / self-high-confidence candidates past the rules in §2.3 and confirm they're rejected.

---

## 6. Definition of done

- `pnpm lint`, `pnpm typecheck`, `pnpm test` all green; `MOCK_DOMAIN_CONTRACT_VERSION` bumped if shapes changed.
- The full arc works against the **dev tenant**: real products → three real agents → consensus/conflict → review → real import.
- **No fabricated data anywhere** — `explicitResearchProfiles`, `getDerivedResearchAttributes`, and time-based status derivation are gone.
- Per `AGENTS.md` task gate: acceptance criteria met, validation evidence captured, adversarial review done, QA sign-off, and a confirmation that **no prohibited action occurred** (no production Mirakl write, no credential exposure).
