# Scoring Model

## Purpose
Define an explainable 0-100 product quality score for catalog triage and review prioritization.

## Principles
- Transparent: every point comes from a documented component.
- Category-aware: Mirakl category attributes are the source of truth.
- Evidence-aware: candidate improvements should be more trusted when supported by high-quality evidence.
- Materialized: scores are stored for fast dashboard sorting/filtering.
- Evolvable: scoring versions and component breakdowns are retained.

## Initial formula
| Component | Points | Description |
| --- | ---: | --- |
| Required Mirakl attributes present | 40 | Percent of required category attributes populated and valid. |
| Recommended/category attributes present | 20 | Percent of recommended/business-useful attributes populated. |
| Description quality/completeness | 15 | Description exists, sufficient length, useful details, no obvious placeholders. |
| Media/brand/identifier completeness | 10 | Brand, EAN/product identifiers, images/media, variant grouping where relevant. |
| Evidence-backed enrichment readiness | 10 | Missing/changed fields have high/medium-confidence field-level evidence. |
| Freshness/no unresolved integration issues | 5 | Source snapshot current, no unresolved Mirakl errors/warnings, score not stale. |

Total: 100.

## Pseudo-code
```text
score = 0
score += 40 * required_attributes_present_valid / required_attributes_total
score += 20 * recommended_attributes_present_valid / recommended_attributes_total
score += description_points(product.description)
score += media_brand_identifier_points(product)
score += evidence_points(product.candidates, field_evidence_links)
score += freshness_points(source_snapshot, mirakl_errors, mirakl_warnings)
score = clamp(round(score), 0, 100)
```

## Description points
```text
0 points: missing, placeholder, or near-empty
5 points: short generic description
10 points: meaningful product description with key features
15 points: detailed, category-appropriate description with differentiators and no unsupported claims
```

## Evidence points
```text
10 points: all accepted/proposed critical fields have high-confidence field-level evidence
7 points: most critical fields have high/medium confidence evidence
4 points: evidence exists but is incomplete, low-confidence, or not field-level for some fields
0 points: candidates have no evidence or evidence policy is unresolved
```


## Edge cases
- If `required_attributes_total = 0`, award the 40 required-attribute points only when the category schema is confirmed current; otherwise mark score stale and award 0 until schema sync completes.
- If `recommended_attributes_total = 0`, award the 20 recommended-attribute points only when the category explicitly has no recommended attributes; otherwise mark score stale/unknown.
- If category is unknown, missing, or schema sync is stale, cap total score at 60 and set `is_stale = true` until Mirakl category discovery/schema sync resolves it.
- If Mirakl errors or warnings are unresolved, the freshness component is 0 and the score explanation must list the warning/error source.
- If evidence policy is pending for a candidate field, the evidence component can contribute at most 4 points.

## Color bands
These bands match the shipped implementation in `lib/scoring.ts` (`red < 25`, `yellow < 70`,
`blue < 90`, `green ≥ 90`); the band name is **yellow**, not "amber".
| Score | Band | Meaning |
| --- | --- | --- |
| 0-24 | Red | Poor / critical data gaps. |
| 25-69 | Yellow | Needs enrichment before strong storefront use. |
| 70-89 | Blue | Usable but improvable. |
| 90-100 | Green | Strong content completeness and evidence. |

## Materialization and refresh
Store scores in `quality_scores` with:
- `score`
- `band`
- `components`
- `schema_version`
- `source_snapshot_id`
- `is_stale`
- `calculated_at`

Refresh triggers:
- Product/source ingestion.
- Category attribute schema sync.
- Candidate creation or review decision.
- Evidence update.
- Scheduled freshness checks.

## Staleness rules
- Mark stale when Mirakl source snapshot changes.
- Mark stale when category attributes/value lists change.
- Mark stale when evidence retention expires or source becomes inaccessible.
- Stale score remains visible but must show warning and trigger refresh before export.

## Calibration examples
| Product state | Expected band |
| --- | --- |
| Missing required attributes and description | Red |
| Has identifiers/brand/media but weak description and missing specs | Amber |
| Complete required attributes, good description, partial evidence | Neutral/blue |
| Complete required/recommended attributes, strong evidence, current source | Green |

| Category has zero required attributes, schema current, recommended fields complete | Neutral/green depending on other components; required denominator treated as satisfied. |
| Category schema unknown or stale | Score capped at 60 and marked stale. |
| Candidate evidence policy pending | Evidence component capped, score explanation flags policy pending. |

## Acceptance criteria
- Formula is inspectable and versionable.
- Dashboard can show component breakdown.
- Score can be sorted/filtered efficiently through materialization.
- Score does not authorize Mirakl writes by itself; review approval is separate.
