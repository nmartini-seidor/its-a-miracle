# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A Next.js App Router **sales demo** of a "Mirakl Product Enrichment" workspace (package name: `mirakl-product-enrichment`). An operator reviews catalog products, runs (simulated) research to find missing attributes, approves/rejects field-level candidates backed by evidence, and prepares Mirakl import drafts.

The demo runs entirely off a **file-based JSON store** (`data/demo-state.json`, gitignored). There is no live database or live Mirakl connection in the running app — research is mocked and time-driven. Treat this as the implemented reality.

> **Docs vs. reality:** `docs/*` (ARCHITECTURE.md, DATA_MODEL.md, etc.) and `AGENTS.md` describe an *aspirational* design — Supabase + RLS, live Mirakl ingestion, a "docs-only milestone, do not scaffold the app." That milestone is over; the app is built. `supabase/migrations/0001_initial.sql` exists but is **not wired into the running app**. Use the docs for domain intent, not as a description of the current code.

## Commands

```bash
pnpm dev          # next dev
pnpm build        # next build
pnpm lint         # eslint .
pnpm typecheck    # tsc --noEmit
pnpm test         # node --test over tests/*.test.mjs (concurrency 1)

pnpm reset:demo   # wipe data/demo-state.json to an empty workspace (keeps settings/overrides)
pnpm import:demo  # reseed the store from lib/fixtures.ts
pnpm sync:mirakl  # scripts/sync-mirakl-snapshot.mjs — LIVE Mirakl read, gated (see below)
```

Run a single test file (the `test` script imports `.ts` modules directly via Node's type-stripping):

```bash
node --experimental-strip-types --experimental-specifier-resolution=node --test tests/scoring.test.mjs
# narrow to one test: append  --test-name-pattern "score bands"
```

After any change to canonical entity shapes (`lib/types.ts` / `lib/demo-contract.ts`), run lint + typecheck + tests, and bump `MOCK_DOMAIN_CONTRACT_VERSION` in `lib/demo-contract.ts`.

## Architecture

Data flows in one direction through these layers — know which one you're editing:

1. **`lib/fixtures.ts`** (~2400 lines) — seed catalog: products, schemas, aggregators, default settings. The source of truth for `pnpm import:demo`.
2. **`server/store.ts`** — the JSON-file-backed store. Owns all reads/writes to `data/demo-state.json`: reset/import, the simulated research lifecycle, review decisions, baseline sync, and export previews. This is where the demo's business logic lives.
3. **`server/data.ts`** — thin async read API (`listProducts`, `getProduct`, `listSchemas`, …) consumed by Server Components. Applies schema/aggregator overrides on top of fixtures.
4. **`app/`** — App Router pages (Server Components) + `app/api/*` route handlers that call `server/store.ts` for mutations. Nav sections (`lib/navigation.ts`): Products (`/`), Catalog, Schemas, Aggregators, Research, Settings.

### The enrichment workflow (the core domain)

- Each **product** has `baselineAttributes` and is assigned a **schema** (`SchemaDefinition`) listing required + recommended `AttributeFieldId`s.
- **Quality score** (`lib/scoring.ts`) drives `scoreBand`: `red <25`, `yellow <70`, `blue <90`, `green ≥90`. Missing-required and warnings cap the score. Scores are recomputed on schema change, research, and review decisions.
- **Research is simulated**, not real web fetching: `createMockResearchRun` queues a job; `getResearchRun` derives status `QUEUED → RUNNING → SUCCEEDED` purely from elapsed time vs `getMockResearchAgentDurationMs()`. On success, `applyResearchOutcome` synthesizes evidence + candidates from `explicitResearchProfiles` (hand-authored per product id) and `getDerivedResearchAttributes` (category/title heuristics) in `server/store.ts`.
- **Candidates** (`CandidateRecord`) are field-level proposals with evidence links. Reviewer decisions (`APPROVE` / `REJECT` / `REQUEST_MORE_EVIDENCE`) flow through `applyReviewDecisionToProduct`; accepted candidates can be merged into the baseline via `syncProductWithMirakl` or shown as an export preview via `buildExportPreview`.
- **`server/mirakl-live-sync.ts`** builds the real Mirakl CSV import draft format (attribute-code mapping, `shop_sku` rows) from accepted candidates. Attribute codes are configurable via `MIRAKL_*` env vars.

### Domain contract

`lib/demo-contract.ts` is canonical: the full `AttributeFieldId` set, human labels, which fields are exportable (`isExportableAttributeField`), and `MOCK_DOMAIN_CONTRACT_VERSION`. `lib/types.ts` holds every entity shape. When adding a product attribute, update both.

## Conventions

- **Imports use explicit `.ts`/`.tsx` extensions** (`allowImportingTsExtensions`), so the same modules run under both Next.js and Node's type-stripping test runner. Match this — bare extensionless relative imports of TS files will break tests.
- Path alias `@/*` → repo root (e.g. `@/server/data`, `@/lib/utils`, `@/components/ui`).
- Style: no semicolons, double quotes, 2-space indent (no Prettier config — follow surrounding code).
- Tests are `.mjs` Node test-runner files in `tests/`, run at **concurrency 1** because they mutate the shared `data/demo-state.json`.
- **UI is shadcn/ui only** (new-york style, neutral base, Tailwind v4 via `@tailwindcss/postcss`). Primitives live in `components/ui/`; compose business components in `components/{app,product,schema,aggregator,settings}/` from those primitives — don't hand-roll equivalents. Add new primitives with the shadcn CLI.

## Guardrails (from AGENTS.md, still in force)

- Never read, print, copy, or commit `.credentials.txt`.
- Live Mirakl reads/writes are approval-gated. `pnpm sync:mirakl` refuses to run without `--live-read-approved` and a `MIRAKL_OPERATOR_API_KEY`. Do not submit Mirakl imports/exports/publishes, run live API calls, or deploy to Vercel without explicit approval.

## Non-code assets

`gamma/`, `videos/`, `output/`, `logos/`, `public/`, and `docs/presentation/` are sales/marketing materials, not application code.
