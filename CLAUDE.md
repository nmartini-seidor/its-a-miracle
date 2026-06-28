# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A Next.js App Router **sales demo** of a "Mirakl Product Enrichment" workspace (package name: `mirakl-product-enrichment`). An operator reviews catalog products, runs **real** research to find missing attributes, approves/rejects field-level candidates backed by evidence, and writes accepted values back to the Mirakl **dev** tenant.

Research is **not simulated**. A Research Job fans out to three subscription-CLI runners (`cursor-agent`, `codex`, `claude`) executed in parallel by a local **Worker** (`pnpm worker`); each browses the live web under the host's ambient login (no API keys), drops an `output.json` that is zod-validated (confidence assigned by cited source tier, never self-reported), and the runs are merged by **consensus/conflict** for human review (ADRs 0001–0005, `EXECUTION_PLAN.md`). State lives in **SQLite** (`data/demo.sqlite`, via `better-sqlite3`, gitignored) for ACID multi-process safety between the Worker and the Next server.

> **Docs vs. reality:** the move from simulated→real is documented in `EXECUTION_PLAN.md`, `CONTEXT.md` (glossary), and `docs/adr/0001–0005`. Phase evidence is in `data/spike/PHASE*.md`. The older `docs/*` (ARCHITECTURE.md, DATA_MODEL.md, …) describe an aspirational Supabase/Vercel design — `supabase/migrations/0001_initial.sql` is intentionally **not** wired up (ADR 0003). Use those older docs for domain intent only.
>
> **The Worker must be running** (`pnpm worker`) for "Run Research" to make progress — it is the sole executor of research and survives Next dev-server reloads. Mirakl write-back is gated to the dev tenant and requires `MIRAKL_OPERATOR_API_KEY` + an explicit in-UI confirm.

## Commands

```bash
pnpm dev          # next dev
pnpm build        # next build
pnpm lint         # eslint .
pnpm typecheck    # tsc --noEmit
pnpm test         # node --test over tests/*.test.mjs (per-process DB isolation via DEMO_DB_ISOLATE)

pnpm worker          # long-lived research Worker — spawns the runner CLIs; run alongside `pnpm dev`
pnpm reset:demo      # wipe the SQLite catalog to an empty workspace (keeps settings/overrides)
pnpm import:demo     # reseed the store from lib/fixtures.ts
pnpm import:snapshot # seed the catalog from a real Mirakl snapshot (see Phase 6 / ADR 0005)
pnpm sync:mirakl     # scripts/sync-mirakl-snapshot.mjs — LIVE Mirakl read, gated (see below)
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
2. **`server/store.ts`** — the SQLite-backed store (`data/demo.sqlite` via `better-sqlite3`, ADR 0003). Owns all reads/writes: reset/import, the real Research Job/Run lifecycle + consensus merge, review decisions, the Worker liveness heartbeat (`workerStatus` kv row, ADR 0006), baseline sync, and export previews. This is where the demo's business logic lives.
3. **`server/data.ts`** — thin async read API (`listProducts`, `getProduct`, `listSchemas`, …) consumed by Server Components. Applies schema/aggregator overrides on top of fixtures.
4. **`app/`** — App Router pages (Server Components) + `app/api/*` route handlers that call `server/store.ts` for mutations. Nav sections (`lib/navigation.ts`): Products (`/`), Catalog, Schemas, Aggregators, Research, Settings.

### The enrichment workflow (the core domain)

- Each **product** has `baselineAttributes` and is assigned a **schema** (`SchemaDefinition`) listing required + recommended `AttributeFieldId`s.
- **Quality score** (`lib/scoring.ts`) drives `scoreBand`: `red <25`, `yellow <70`, `blue <90`, `green ≥90`. Missing-required and warnings cap the score. Scores are recomputed on schema change, research, and review decisions.
- **Research is real**, not simulated: the Next server only *queues* a multi-runner Research Job via `createResearchJob` (status is owned by the Worker, never time-derived). The local **Worker** (`pnpm worker`, `server/worker/main.ts`) claims the job, spawns the three runner CLIs in jailed working dirs, zod-validates each `output.json` (`lib/research-contract.ts` — confidence assigned by cited source tier), and `finalizeResearchJob` merges the runs by consensus/conflict onto the product (`server/research-merge.ts`). The Run-Research button polls `GET /api/research-jobs/[id]` for status **and** the Worker-liveness snapshot so a down Worker / no runners / paused intake surface immediately instead of spinning (ADR 0006).
- **Candidates** (`CandidateRecord`) are field-level proposals with evidence links. Reviewer decisions (`APPROVE` / `REJECT` / `REQUEST_MORE_EVIDENCE`) flow through `applyReviewDecisionToProduct`; accepted candidates can be merged into the baseline via `syncProductWithMirakl` or shown as an export preview via `buildExportPreview`.
- **`server/mirakl-live-sync.ts`** builds the real Mirakl CSV import draft format (attribute-code mapping, `shop_sku` rows) from accepted candidates. Attribute codes are configurable via `MIRAKL_*` env vars.

### Domain contract

`lib/demo-contract.ts` is canonical: the full `AttributeFieldId` set, human labels, which fields are exportable (`isExportableAttributeField`), and `MOCK_DOMAIN_CONTRACT_VERSION`. `lib/types.ts` holds every entity shape. When adding a product attribute, update both.

## Conventions

- **Imports use explicit `.ts`/`.tsx` extensions** (`allowImportingTsExtensions`), so the same modules run under both Next.js and Node's type-stripping test runner. Match this — bare extensionless relative imports of TS files will break tests.
- Path alias `@/*` → repo root (e.g. `@/server/data`, `@/lib/utils`, `@/components/ui`).
- Style: no semicolons, double quotes, 2-space indent (no Prettier config — follow surrounding code).
- Tests are `.mjs` Node test-runner files in `tests/`, run with **`DEMO_DB_ISOLATE=1`** so each test process gets its own SQLite database (`data/.test-dbs/demo-<pid>.sqlite`) and files can run concurrently — the old `--test-concurrency=1` / shared-JSON-file constraint is retired (ADR 0003).
- **UI is shadcn/ui only** (new-york style, neutral base, Tailwind v4 via `@tailwindcss/postcss`). Primitives live in `components/ui/`; compose business components in `components/{app,product,schema,aggregator,settings}/` from those primitives — don't hand-roll equivalents. Add new primitives with the shadcn CLI.

## Guardrails (from AGENTS.md, still in force)

- Never read, print, copy, or commit `.credentials.txt`.
- Live Mirakl reads/writes are approval-gated. `pnpm sync:mirakl` refuses to run without `--live-read-approved` and a `MIRAKL_OPERATOR_API_KEY`. Do not submit Mirakl imports/exports/publishes, run live API calls, or deploy to Vercel without explicit approval.

## Non-code assets

`gamma/`, `videos/`, `output/`, `logos/`, `public/`, and `docs/presentation/` are sales/marketing materials, not application code.
