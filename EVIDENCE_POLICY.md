# Evidence Policy

## Status
Policy proposal for future enrichment. No live crawling, scraping, PDF download, or evidence collection is authorized by this docs milestone.

## Policy goals
- Ensure candidate product improvements are traceable to field-level evidence.
- Prevent unapproved storage of copyrighted, personal, gated, or terms-restricted content.
- Make source confidence explicit for reviewers.
- Preserve enough metadata to audit a proposed value without blindly trusting an agent.

## Source tiers
| Tier | Source type | Default confidence | Storage default |
| --- | --- | --- | --- |
| A | Mirakl source fields and Mirakl category/value-list metadata | High | Store normalized metadata. |
| A | Manufacturer official product page | High | URL, access date, excerpt. |
| A | Manufacturer official PDF/datasheet | High | URL, access date, page, excerpt; raw file only if approved. |
| B | Operator-uploaded source documents | Medium/High | Store according to operator policy. |
| C | Retailer/competitor product pages | Low/Policy-pending | Starter hints only unless approved. |
| C | Search snippets | Low | Do not treat as authoritative. |
| D | Unattributed forums/social/user content | Reject by default | Do not use unless policy changes. |

## Required metadata per evidence item
- Source type.
- URL or storage/document reference.
- Accessed timestamp.
- Title or document name.
- Excerpt/snippet supporting the field.
- Attribute code(s) supported.
- Extraction method: manual, parser, OCR, LLM extraction, API, uploaded document.
- Confidence tier.
- Retention class.
- For PDFs: page number and excerpt are required.

## Field-level traceability
- Candidate values should link to one or more evidence records through `candidate_evidence_links`.
- Evidence should support a specific attribute code, not just the product in general.
- Conflicting evidence must be stored as `conflicting` support rather than hidden.

## Retention classes and defaults
| Class | Applies to | Default TTL | Deletion trigger | Approval authority | Audit requirement |
| --- | --- | ---: | --- | --- | --- |
| `provenance_metadata` | URL, source type, access date, field mapping, confidence | Indefinite while product exists | Product deletion or policy request | Data owner | Audit on delete. |
| `supporting_excerpt` | Minimal text excerpt needed to justify a field | 2 years after final review/export decision | TTL expiry, source takedown request, product deletion | Data owner | Audit on delete. |
| `raw_snapshot` | Cached HTML, screenshots, raw OCR output | 90 days | TTL expiry or policy revocation | Data owner + security/compliance approval | Audit create/delete. |
| `official_pdf_copy` | Stored manufacturer/operator PDF copy | 180 days unless operator contract permits longer | TTL expiry, source takedown, product deletion | Data owner + security/compliance approval | Audit create/delete/access. |
| `operator_upload` | User/operator uploaded document | 180 days default if no operator policy exists | TTL expiry, uploader deletion request, product deletion | Operator/admin | Audit create/delete/access. |
| `rejected_source` | Rejected/prohibited source metadata | 30 days | TTL expiry | Data owner | Keep only metadata needed to prevent re-use. |

Retention exceptions require an `audit_events` record with approver, reason, new TTL, and affected evidence IDs. Raw storage approval is per source class, not implied by candidate approval.

## Link rot and gated content
- Store access timestamp and excerpt to preserve review context if a URL changes.
- Mark evidence stale if fetch/validation later fails.
- Do not bypass paywalls, authentication, robots.txt, or terms restrictions.
- Gated content requires explicit operator authorization and access-control review.

## Competitor/retailer source posture
- MediaMarkt, PcComponentes, or similar pages may be used only as category-facet starter hints until legal/compliance approves usage.
- They are not authoritative for final product data.
- Candidate fields sourced only from competitor pages should be low-confidence and require stronger review.

## Evidence quality tiers
| Tier | Criteria |
| --- | --- |
| High | Official manufacturer/Mirakl/operator source, direct match, recent access date, clear excerpt. |
| Medium | Credible non-official source or indirect manufacturer context; clear but not definitive evidence. |
| Low | Retailer hint, search result, weak excerpt, old source, or inferred value. |
| Policy pending | Source may be useful but legal/retention permission is unresolved. |

## Acceptance criteria
- Enrichment agents have explicit rules for allowed/rejected/pending sources.
- Reviewers can see why a candidate is high/medium/low confidence.
- Raw content retention is not assumed; it is approval-gated.

## External retailer/reference sources

External retailer pages may be used to propose candidate information when official sources are missing or insufficient. They are supporting evidence, not the primary authority.

Rules:
- Prefer manufacturer official pages and datasheets over retailers.
- Retailer pages such as MaxMovil can support fields like EAN, color, Bluetooth version, dimensions, battery capacity, and launch date when the source is public and accessible without login.
- Store only URL, access date, source type, and short supporting snippets by default.
- Do not copy full product pages or copyrighted long-form content into the database.
- Mark retailer-sourced candidates as `medium` or `low` confidence unless corroborated by official sources.
- If a retailer source conflicts with Orange or manufacturer data, mark it as conflicting evidence for reviewer decision.
