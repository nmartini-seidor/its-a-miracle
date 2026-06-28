# AGENTS.md — Mirakl Product Enrichment Project Rules

## Scope
This file governs this repository. Follow higher-priority system/developer/user instructions first.
See `CLAUDE.md` for commands and architecture, the `docs/adr/` records (0001–0007) for the
hard-to-reverse decisions, and `EXECUTION_PLAN.md` for the simulated→real migration history.

## Current state
The application is **built and real** (the earlier "docs-only" milestone is retired): a Next.js App
Router demo with a local research **Worker** (`pnpm worker`) that spawns subscription-CLI runners,
SQLite local state (`data/demo.sqlite`, ADR 0003), and a gated Mirakl **dev-tenant** write-back. The
aspirational Supabase/Vercel design in the older `docs/*` is intentionally **not** wired up — those
docs carry a SUPERSEDED banner and are domain-intent only.

## Hard prohibitions
- Do not read, print, copy, commit, or expose `.credentials.txt` values.
- Do not run live Mirakl API calls without explicit approval.
- Do not submit Mirakl imports/exports/writes/publish actions without explicit approval. The live
  single-row write-back is the human-operated step in ADR 0007's runbook — never fire it autonomously.
- Do not deploy to Vercel or mutate Vercel project/env settings without explicit approval.
- Do not introduce UI libraries outside shadcn/ui without explicit approval.

## When implementing, use these skills
- `shadcn` (UI primitives) and `next-best-practices` (App Router / RSC) are the relevant skills for
  this codebase. Older skill lists (Supabase helpers, `ask-gemini`/`ask-claude`) no longer apply.

## shadcn/UI rules
- UI primitives must come from shadcn/ui.
- Use the shadcn CLI for component installation/update.
- Compose business components from shadcn primitives; do not invent design-system primitives.
- Use semantic tokens and existing variants.
- No raw custom dashboard UI when shadcn has an equivalent primitive.

## Next.js rules
- Prefer App Router and Server Components for data-heavy pages.
- Use Client Components only for interactivity.
- Keep Mirakl clients and server-only data access (`server/*`) on the server.
- Avoid request waterfalls; parallelize independent data loads.
- Use proper error/not-found/loading boundaries.

## Mirakl rules
- Mirakl is source of truth for official category attributes/value lists.
- Product create/update uses the import workflow; do not assume a simple JSON write endpoint.
- `SENT` import status is **not** the same as live/published success — the poller must verify the
  value landed (`transform_lines_read ≥ 1`, `lines_in_success ≥ 1`, `lines_in_error == 0`), per ADR 0007.
- Write-back is restricted to the dev tenant with no override (ADR 0005); production is unreachable.
- Human approval is required before any import/export/write/publish submission.

## Evidence rules
- Use manufacturer/Mirakl/operator sources as higher confidence.
- Competitor/retailer pages are lower-confidence supporting sources, capped below high.
- Link candidates to field-level evidence where possible.
- Raw PDF/screenshot/cached HTML storage is approval-gated.

## Research-runner rules
- A Research Job fans out to the three subscription-CLI runners (`cursor-agent`, `codex`, `claude`),
  each run in a jailed working dir under the host's ambient login (ADR 0001/0004). The runner's only
  trusted output is the `output.json` it drops, which is **zod-validated before persistence** (ADR 0002).
- Research runners must not write to Mirakl, approve candidates, generate final exports, or mutate
  product baseline records.
- Every candidate must cite source evidence; confidence is assigned from the cited source tier, never
  self-reported by the runner. D-tier (forum/social/unattributed) sources are rejected.
- Store URLs, access dates, short snippets, and field mappings — never full-page copyrighted content.

## Task completion gate
Every task must have:
- Acceptance criteria.
- Validation evidence.
- Adversarial review.
- Finding disposition for medium/high issues.
- QA sign-off.
- Confirmation no prohibited actions occurred.
