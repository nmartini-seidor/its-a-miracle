# Demo Hardening Plan — execution spec

**Goal.** Close the "looks supported but doesn't actually work" gaps found in the functional audit, so the demo is honest end-to-end: research can never silently hang, the Mirakl write-back actually lands and is verified, dead/no-op UI controls become real or honest, and the docs match the code. Designed to be executed by an **ultracode** run (fan-out by item, adversarially verify each change, keep `pnpm lint && pnpm typecheck && pnpm test` green throughout).

**Decision records:** [ADR 0006](adr/0006-worker-liveness-and-research-progress-states.md) (items 1 + 4) and [ADR 0007](adr/0007-mirakl-writeback-auth-and-verification.md) (items 2 + 9) hold the hard-to-reverse decisions. Items 5/6/8/10/11/12/13 are mechanical and recorded here only. Every recommendation below survived an adversarial review; the gotchas are the things that review caught.

**Out of scope** (dropped by the operator from the original audit list): item 3 (hide/wire the 4 fake competitor "Configure" buttons + "Nico" menu) and item 7 (delete `data/demo-state.json`, `sidebar-nav.tsx`, the always-409 `seo-description` route).

**Definition of done (whole plan):** `pnpm lint`, `pnpm typecheck`, and `pnpm test` all pass; no UI control misrepresents what it does; ADR 0007's live-import milestone is either completed by a human or explicitly left as the one outstanding human step.

---

## Sequencing & dependencies

```
Wave A (independent, do first, unblocks green CI):
  5a  fix stale logo test
  5b  fix brand-token-walk ENOENT (exclude data/)
  8   dedupe RESEARCH_RUNNER_IDS
  13a mount <Toaster/>  ── prerequisite for 13b

Wave B (feature work):
  1   worker liveness + progress taxonomy  ──┐ (ADR 0006; 4 folds in here)
  4   wire paused intake                    ──┘ ship together
  2   Mirakl auth + attribute codes + poller (ADR 0007; code only)
  9   tighten connectivity/read host guard  (ADR 0007)
  6   honest import progress  ── decide BEFORE 11

Wave C (docs + polish, after behaviour is final):
  13b error-surfacing at the 4 sites (needs 13a)
  10  rewrite CLAUDE.md + narrow CONTEXT.md
  11  fix .env.example  ── depends on 6's env-var decision
  12  doc banners + score bands + AGENTS.md

Human-gated (cannot be done by the agent): ADR 0007 runbook — prove one live import lands.
```

**Cross-item couplings (do not violate):**
- **6 ↔ 11:** `NEXT_PUBLIC_MOCK_PRODUCT_IMPORT_SECONDS` / `getMockProductImportDurationMs` stay live because item 6 keeps a paced animation — item 11 must **not** drop that var. (Independently: `MOCK_RESEARCH_AGENT_SECONDS` / `getMockResearchAgentDurationMs` appear to have **zero consumers** — verify with a grep; if dead, remove the function + the env var as part of item 4's cleanup.)
- **13a → 13b:** `sonner` is installed but `<Toaster/>` is never mounted — `toast()` calls are silent no-ops until it is. Mount it first.
- **4 → 1:** paused must be visually/HTTP-distinct from worker-down; both are built under ADR 0006's taxonomy.

---

## Wave A

### 5a — Stale logo test (`tests/navigation.test.mjs:34-61`)
The shipped layout/SVG are the intended state; the test pins an old crop. **Update the test, not the layout.** Change: `?v=full-crop-20260508`→`?v=wordmark-right-20260510`; `viewBox="488 293 523 350"`→`"488 293 1060 250"`; `width/height "523/350 pt"`→`"1060/250 pt"`; `width={523} height={350}`→`{1060}/{250}`. Leave the negative brand-text checks, `h-14`, `object-contain`, `#2563eb`/`#000000` assertions (still pass). **Accept:** test 31 passes.

### 5b — Brand-token walk ENOENT (`tests/demo-contract.test.mjs:17,25`)
`collectForbiddenBrandReferences` recurses into churning gitignored `data/.test-dbs/*.sqlite-shm` and `statSync` races their deletion. **Fix:** add `data` (and `output`) to `skippedScanDirs` on line 17. Not a bare ENOENT guard — `data/` is gitignored generated state that never ships, so excluding it doesn't weaken the guard (which protects *committed* files against the forbidden legacy brand token). **Accept:** test 13 passes; the guard still scans source/committed files.

### 8 — Dedupe `RESEARCH_RUNNER_IDS`
Canonical list **stays in `lib/research-contract.ts:26`** (node-free; already what `server/store.ts` imports). `server/research-runner/index.ts:13` stops redefining it: import + re-export the lib constant, and add a runtime assertion that the adapter pool (`RESEARCH_RUNNERS`) ids equal it. No import cycle (`lib` never imports `server/*`); `ResearchRunnerId` is the union at `lib/types.ts:13`. **Accept:** one definition; adding a 4th runner requires editing one place; typecheck+tests green.

### 13a — Mount the toaster (prerequisite)
Add the shadcn `sonner` primitive (`components/ui/sonner.tsx`) and mount `<Toaster/>` in `app/layout.tsx` inside `<body>`. **Accept:** a `toast()` call from any client component renders.

---

## Wave B

### 1 + 4 — Worker liveness + progress taxonomy (ADR 0006)
Implement exactly per ADR 0006. Key build points and **gotchas**:
- Heartbeat from an independent `setInterval(5s).unref()` in `server/worker/main.ts`, **not** the work loop (loop blocks ~600s/job → false "down"). First write synchronous at startup; `phase:"stopping"` on shutdown.
- `kv` row `workerStatus` (clobber-safe). `STALE_MS=20000`; UI debounces 2 consecutive stale reads (macOS sleep).
- Enrich `GET /api/research-jobs/[id]` with `worker:{…}` (button reads this — no 2nd polling endpoint); add `GET /api/research/worker-status` for the idle Research-page banner only.
- Enqueue guard in `POST /api/products/[id]/research-jobs`: `503` worker down/unknown, `422` no runners, `409 {code:"RESEARCH_PAUSED"}` paused.
- **Paused gate in `createResearchJob` after the dedupe branch**, returning a **discriminated result** (not overloaded `null`); pause stops new intake only (never gate `claimNextResearchJob`); queued/in-flight drain.
- Disable Run-Research triggers (`research-button.tsx`, `triage-dashboard.tsx`) with an inline reason when paused, fed by `getDemoSettings()` as a prop; paused ≠ offline visually.
- Surface runner `loggedIn` (not just `installed`) in `getAvailableRunners`/the snapshot — installed-but-logged-out currently counts as available and fails at spawn.
- Remove dead `defaultResearchDelaySeconds` (types/fixtures/route/store/UI); rewrite `tests/settings-page.test.mjs:29,35,42` to assert a surviving field. **Do NOT rename `fakeResearchMode`** (silent-un-pause-on-upgrade footgun + contract bump).
- Add a ~12-min hard client backstop on the poll loop.
- The `/research` page has **no banner/button today** — that UI is new work, not an edit.
**Accept:** with no `pnpm worker`, clicking Run Research says "Worker not running" within ~20s (no infinite spin); a long real job never shows a false "down"; a 2nd product queued behind a running one says "queued/busy", not "down"; toggling Paused disables the trigger with a distinct message and blocks new jobs while letting in-flight ones finish.

### 2 — Mirakl auth + attribute codes + poller (ADR 0007, code only)
- Add `MIRAKL_AUTH_SCHEME` (`raw`|`bearer`, default `raw`); single shared `miraklRequest`/header helper across all four call sites; connectivity probe tries `raw`→`bearer` and reports the winner. **Update `tests/mirakl-sync-script.test.mjs:129`** (currently hard-asserts `Bearer`).
- Replace the invented attribute-code map; source codes from `data/mirakl/catalog-config/*`; make the shop↔category↔code triple consistent (the gaming-codes→beverage-shop-2005 mismatch is the top blocker).
- Harden `pollMiraklImportStatus`: assert `transform_lines_read≥1 && transform_lines_in_success≥1 && transform_lines_in_error==0`; fetch the error/new-product report on non-zero errors; treat `lines_read>0 && lines_in_success==0` as failure, not success.
- Add a local CSV-shape **dry-run** (draft headers ⊆ category's real codes) usable without any live call.
**Accept:** typecheck+tests green with the scheme configurable; a unit test proves a wrong attribute code is not reported as a successful import.

### 9 — Trust-boundary guard (ADR 0007)
Connectivity route (`app/api/integrations/mirakl/connectivity/route.ts`) becomes dev-by-default; non-dev host needs explicit `allowNonDevHost` flag + logging. Snapshot read: keep `--live-read-approved`, add resolved-host logging. Writes unchanged (hard dev-only, no override) — keep the existing passing guard test. **Accept:** connectivity refuses a prod host without the explicit flag; write guard test still passes.

### 6 — Honest import progress (`components/settings/reset-workspace-button.tsx`)
**Keep the polish, drop the fabrication.** Remove `fakeImportProductCount=55`, the 1→55 loop, the fake 5-step "Analyzing Product Data Quality" phase, the `N/55` button fraction, and the `?? fakeImportProductCount` fallback (line 75). Keep a paced, branded, time-driven progress bar (`role="progressbar"`, env-tuned by `getMockProductImportDurationMs`) making **no false count claims**; fire the real `POST /api/workspace/import` at the start; report the **real** `body.importedCount`/`body.message` on completion (no number on the unhappy path). Don't build real streaming (import is sub-second, atomic). Rewrite `tests/demo-reset.test.mjs:46-65` (a source-string snapshot enforcing the fakeness) to negative assertions (no hardcoded `/55`, no "Importing product N", no "Analyzing…") + keep the `role="progressbar"`/env-wiring checks; leave the behavioral test at `:9-43`. **No ADR. Decide this before item 11.** **Accept:** no fabricated counts; displayed count always equals the API's real count.

---

## Wave C

### 13b — Surface silent errors (needs 13a)
`components/catalog-schema-select.tsx:25-30` (rollback → `toast.error`); `components/product/export-payload-panel.tsx:21-48` (guard `!response.ok` before `.json()`; handle per-request failures in `approveAll`); `components/schema/schema-configuration-form.tsx` + `components/aggregator/aggregator-configuration-form.tsx` (success vs error currently render identically — switch to `toast.success`/`toast.error`). **Accept:** every failing mutation surfaces a visible error.

### 10 — CLAUDE.md + CONTEXT.md
Rewrite the three stale CLAUDE.md passages: `:45` (SQLite-backed store, not "JSON-file-backed / data/demo-state.json"), `:53` (real Worker/runner research, not "simulated / createMockResearchRun / explicitResearchProfiles"), `:66` (concurrent tests + `DEMO_DB_ISOLATE`, not "concurrency 1 … data/demo-state.json"). Narrow `CONTEXT.md:68`: the Job/Run rework landed (distinct tables + entities); the only vestige is the `StoredState.researchRuns` field name in `server/store.ts`. **No `MOCK_DOMAIN_CONTRACT_VERSION` bump** (prose only; a bump would break `tests/demo-contract.test.mjs:46`).

### 11 — .env.example
Remove the three `*SUPABASE*` vars + `MIRAKL_FRONT_KEY` (zero code refs). Add `MIRAKL_BASE_URL`, `MIRAKL_SYNC_SHOP_ID`, `MIRAKL_SYNC_CATEGORY_CODE`, `MIRAKL_AUTH_SCHEME`; document `RESEARCH_POLL_MS`/`RESEARCH_RUN_TIMEOUT_MS`/`RESEARCH_AVAILABILITY_REFRESH_MS`. Keep `NEXT_PUBLIC_MOCK_PRODUCT_IMPORT_SECONDS` (item 6 keeps the animation); keep/drop `MOCK_RESEARCH_AGENT_SECONDS` per the dead-consumer check in item 4.

### 12 — Doc banners + score bands + AGENTS.md
Banner the 11 stale-aspirational docs (`ARCHITECTURE, DATA_MODEL, API_REFERENCE, TECH_SPECS, ENRICHMENT_STRATEGY, MIRAKL_INTEGRATION, OPERATIONS, SECURITY, PRD, TASKS, TEST_PLAN`) with "SUPERSEDED — see docs/adr/ + EXECUTION_PLAN.md". Fix score bands in `docs/SCORING_MODEL.md:61-67` and `docs/UI.md:50-54` to match `lib/scoring.ts`: red `<25` / yellow `25-69` / blue `70-89` / green `≥90` (name is **yellow**, not "amber"). In `AGENTS.md`: retire the "docs-only / do not scaffold", `opencode`/`lightweb`, stale-skill-names, and Supabase sections; **keep** all credentials, Mirakl-gating, Vercel-deploy, shadcn, and evidence guardrails.

---

## Human-gated milestone (not executable by the agent)
ADR 0007 runbook: with dev credentials + explicit approval, submit one single-row import to `seidor-dev.mirakl.net` and confirm on re-read that the value landed (not stuck in `MCM-04014`/`MCM-0L000`). Record the winning auth scheme + category↔code map in ADR 0007.
