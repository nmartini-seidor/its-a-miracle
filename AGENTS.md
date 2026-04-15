# AGENTS.md — Mirakl Product Enrichment Project Rules

## Scope
This file governs this repository. Follow higher-priority system/developer/user instructions first.

## Current milestone
The approved current task is a **docs-only package**. Do not scaffold or implement the application unless a later approved task explicitly changes scope.

## Hard prohibitions
- Do not read, print, copy, commit, or expose `.credentials.txt` values.
- Do not create a Next.js scaffold, `package.json`, `components.json`, Supabase migrations, live jobs, or deployment config during docs-only work.
- Do not run live Mirakl API calls without explicit approval.
- Do not submit Mirakl imports/exports/writes/publish actions without explicit approval.
- Do not deploy to Vercel or mutate Vercel project/env settings without explicit approval.
- Do not introduce UI libraries outside shadcn/ui without explicit approval.

## Required future skills
When implementation begins, use and follow:
- `shadcn`
- `next-best-practices`
- `vercel-react-best-practices`
- `vercel-cli`
- `supabase`
- `supabase-postgres-best-practices`
- `ask-gemini`
- `ask-claude`

## shadcn/UI rules
- UI primitives must come from shadcn/ui.
- Use shadcn CLI for component installation/update.
- Compose business components from shadcn primitives; do not invent design-system primitives.
- Use semantic tokens and existing variants.
- No raw custom dashboard UI when shadcn has an equivalent primitive.

## Next.js rules
- Prefer App Router and Server Components for data-heavy pages.
- Use Client Components only for interactivity.
- Keep Mirakl and service-role Supabase clients server-only.
- Avoid request waterfalls; parallelize independent data loads.
- Use proper error/not-found/loading boundaries once app code exists.

## Supabase/Postgres rules
- RLS by default for exposed schemas.
- Service-role keys are server-only.
- Review and audit records should be append-only.
- Add indexes for product list/detail, scoring, jobs, evidence, and review queries.
- Validate schema/RLS through migrations only after approval.

## Mirakl rules
- Mirakl is source of truth for official category attributes/value lists.
- Product create/update uses import workflow; do not assume a simple JSON write endpoint.
- `SENT` import status is not the same as live/published success.
- Human approval is required before import/export/write/publish submission.

## Evidence rules
- Use manufacturer/Mirakl/operator sources as higher confidence.
- Competitor/retailer pages are lower-confidence starter hints pending policy approval.
- Link candidates to field-level evidence where possible.
- Raw PDF/screenshot/cached HTML storage is approval-gated.

## Development/review agents vs production enrichment agents
- Development/review agents write, review, and QA project artifacts.
- Production enrichment agents are future app jobs that draft product-data candidates.
- Do not run production enrichment behavior as part of development review unless a later task explicitly approves it.

## Task completion gate
Every task must have:
- Acceptance criteria.
- Validation evidence.
- Adversarial review.
- Finding disposition for medium/high issues.
- QA sign-off.
- Confirmation no prohibited actions occurred.

## Research-agent implementation rules
- Dashboard-triggered research agents may use `opencode` with a lightweight web client (`lightweb`) or equivalent controlled browser only as a bounded evidence-collection worker.
- Research agents must not write to Mirakl, approve candidates, generate final exports, or mutate product baseline records.
- Research output must be schema-validated before persistence.
- Every candidate must include source evidence or be marked no-evidence/low-confidence.
- Retailer evidence is supporting evidence only; prefer manufacturer and official documentation.
- No full-page copyrighted content should be copied into the database; store URLs, access dates, short snippets, and field mappings.
