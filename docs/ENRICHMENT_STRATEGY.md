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
- Evaluate source availability for selected retailer device categories.
- Test manufacturer source extraction quality.
- Test PDF parsing/OCR confidence on approved sample docs.
- Measure candidate precision/recall against manually reviewed sample products.

## Acceptance criteria
- Strategy aligns with `EVIDENCE_POLICY.md` and `SCORING_MODEL.md`.
- Retailer/competitor pages are not treated as authoritative.
- Candidate generation remains review-only until approved by humans.

## Dashboard-triggered research agents

The dashboard product page should allow an operator to launch an internal research job for a specific product. The job may use an `opencode`-driven subagent with a lightweight web client (`lightweb`) or equivalent controlled browsing tool to search for better product information.

The research agent must not directly mutate Mirakl. Its only allowed output is a set of draft candidates and evidence records.

### Research job inputs
- Mirakl baseline snapshot: title, category, EAN/source identifiers, current description, current attributes, missing required fields, warnings.
- External retailer source URL and parsed Retailer attributes when available.
- Allowed source policy from `EVIDENCE_POLICY.md`.
- Category-specific attribute expectations from Mirakl and from the product category mapping.

### Research job behavior
1. Search official manufacturer pages first.
2. Search official datasheets/manuals where available.
3. Search approved retailer/reference pages such as MaxMovil only as supporting evidence and not as the final authority.
4. Extract candidate descriptions, bullet features, attributes, EAN/GTIN, release date, color, battery details, connectivity, dimensions, weights, included accessories, and compatibility.
5. Save evidence snippets, URLs, access dates, source type, confidence, and extraction method.
6. Produce field-level candidates such as `bluetooth_version`, `case_dimensions_mm`, `battery_capacity_mah`, `noise_reduction`, `microphone_count`, or improved `description [en]` / localized description.
7. Mark conflicts when Retailer, Mirakl, and external sources disagree.

### Example: Huawei FreeClip 2 enrichment
For a Mirakl baseline with missing brand and noisy description, the research job should be able to propose:
- brand: Huawei, mapped to accepted Mirakl brand code once configured.
- cleaner description: concise product-focused description rather than storefront checkout/pricing text.
- attributes from Retailer: Bluetooth=true, MP3=true, weight_g=37.8gr, dimensions_mm=25.4 x 26.7 x 18.8mm, battery_talk_duration=9h/38h with case, charger_power_unit=W, OS compatibility.
- attributes from external evidence: EAN=6942103169434, color=Negro, Bluetooth version=6.0, USB-C charging, microphone/noise reduction, case dimensions, battery capacity, release date.

All of these remain candidates until a reviewer accepts them.
