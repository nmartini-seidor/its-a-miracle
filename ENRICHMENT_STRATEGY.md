# Enrichment Strategy

## Status
Future production-enrichment strategy only. This milestone does not run enrichment agents, crawl websites, download PDFs, or call external search providers.

## Agent separation
- **Development/review agents**: Codex/Gemini/Claude/QA agents used to review implementation tasks and docs.
- **Production enrichment agents**: future application jobs that search allowed sources and draft product-data candidates.

These are separate systems with separate permissions. Development agents must not be confused with production enrichment jobs.

## Enrichment workflow
1. Load product source snapshot and category attribute requirements.
2. Identify missing or weak fields.
3. Load evidence policy and allowed source hierarchy.
4. Search approved sources for missing information.
5. Extract candidate values and field-level evidence.
6. Assign confidence and rationale.
7. Save candidates as `PROPOSED`.
8. Require human review before approval/export.

## Source priority
1. Mirakl source fields and category/value-list schema.
2. Manufacturer official product page.
3. Manufacturer official datasheet/PDF.
4. Operator-uploaded documents.
5. Retailer/competitor sources only as low-confidence starter hints pending policy approval.
6. Search snippets only as discovery hints, not final evidence.

## Candidate confidence
| Confidence | Conditions |
| --- | --- |
| High | Official/manufacturer/Mirakl source, direct field match, recent access, clear excerpt. |
| Medium | Credible source but indirect or incomplete. |
| Low | Retailer/search hint, old source, weak excerpt, or inferred. |
| Policy pending | Source use or retention needs approval. |

## Conflicting evidence
- Store conflicting evidence rather than overwriting it.
- Prefer Mirakl/manufacturer/operator sources over retailer hints.
- Mark candidate as needing reviewer decision when high-confidence sources disagree.

## PDF handling
- PDFs require page number and excerpt.
- Raw PDF storage is approval-gated.
- OCR output must include extraction method and confidence.

## Human-control boundaries
- Enrichment jobs may draft candidates and evidence.
- Enrichment jobs may not approve candidates.
- Enrichment jobs may not generate final export batches without review decisions.
- Enrichment jobs may not submit Mirakl imports.

## Future validation spikes
- Evaluate source availability for selected Orange.es device categories.
- Test manufacturer source extraction quality.
- Test PDF parsing/OCR confidence on approved sample docs.
- Measure candidate precision/recall against manually reviewed sample products.

## Acceptance criteria
- Strategy aligns with `EVIDENCE_POLICY.md` and `SCORING_MODEL.md`.
- Retailer/competitor pages are not treated as authoritative.
- Candidate generation remains review-only until approved by humans.
