# PRD: Mirakl Product Enrichment Tool

## Status
Docs-only milestone. This document is a product requirements artifact, not an implementation record.

## Problem
Orange.es device product pages depend on Mirakl catalog data. Product descriptions, feature lists, media metadata, and category-specific attributes can be incomplete or inconsistent. Operators need a tool that finds gaps, proposes evidence-backed improvements, and lets humans review changes before anything is prepared for Mirakl.

## Goals
- Improve product-content completeness and quality for the Orange.es Mirakl-backed catalog.
- Make product quality visible through an explainable 0-100 score.
- Preserve Mirakl as the source of truth for official category attributes and value lists.
- Store candidate improvements and field-level evidence in Supabase for review.
- Allow reviewers to accept/discard individual fields before export preparation.
- Require explicit human approval before any Mirakl import/export/write/publish action.
- Use Next.js, shadcn/ui, Supabase/Postgres, Vercel-ready architecture, and strict review/QA gates.

## Non-goals for this milestone
- No Next.js scaffold or `package.json`.
- No shadcn initialization or component installation.
- No Supabase migration or live database mutation.
- No live Mirakl API calls.
- No Mirakl import/export/write/publish submission.
- No Vercel deployment or environment mutation.
- No reading, printing, or copying `.credentials.txt` values.

## Target users
| User | Need |
| --- | --- |
| Catalog operator | Triage low-quality products, review candidate fields, prepare approved export batches. |
| Content specialist | Improve descriptions/features with evidence-backed suggestions. |
| Technical maintainer | Manage integrations, schema, scoring, jobs, and operational safety. |
| Reviewer / QA agent | Validate each task output and block unsafe or incomplete work. |
| Auditor | Inspect evidence, review decisions, and export/import audit history. |

## Core workflows
1. **Catalog triage**: filter products by score, category, status, seller/provider count, missing attributes, or stale source data.
2. **Product detail review**: compare Mirakl source values against candidate target values.
3. **Evidence inspection**: inspect field-level URLs, PDF references, excerpts, source type, access date, and confidence.
4. **Field decisioning**: accept/discard individual candidate fields with reviewer identity and rationale.
5. **Quality scoring**: see score components and why a product is red/amber/neutral/green.
6. **Job monitoring**: inspect ingestion/enrichment/schema-sync/export job status and failures.
7. **Controlled export/import**: reviewers approve fields, operators request draft export packages, operators separately approve Mirakl submission, and the system tracks import status; draft generation and Mirakl submission are distinct states.

## MVP scope default
- The product is **single-tenant for Orange.es** by default.
- The actual business target is **Orange.es devices**.
- Local `soft` / `Soft drinks` Mirakl data is a technical fixture only; it is not the business MVP category.
- First real device category must be chosen through an approval-gated read-only Mirakl category discovery task.
- First implementation pilot should cap at 50-100 products or one category slice until rate limits, scoring cost, and review flow are measured.

## Phased roadmap
| Phase | Name | Outcome |
| --- | --- | --- |
| 0 | Docs package | This documentation set, review/QA approved, no implementation. |
| 1 | Scaffold + validation spikes | Next.js/shadcn scaffold, Supabase schema feasibility, read-only Mirakl category/product discovery after approval. |
| 2 | Data model + ingestion | Supabase schema, RLS, Mirakl read-only ingestion, category/attribute/value-list sync. |
| 3 | Scoring + enrichment | Transparent quality scoring, materialized scores, enrichment candidate jobs, evidence capture. |
| 4 | Dashboard + review | shadcn-only product list/detail/diff/evidence/review UI. |
| 5 | Controlled export/import preparation | Approval-gated draft export packages and import status tracking. |
| 6 | Deployment + operations | Vercel deployment and production operations after explicit approval. |

## Success metrics
- 100% of candidate field changes have provenance or are marked as no-evidence/low-confidence.
- Reviewers can identify why a product scored below threshold within one product-detail view.
- No unauthorized Mirakl writes/imports/publish actions occur.
- No secrets appear in docs, client code, logs, or artifacts.
- Every implementation task has acceptance criteria, adversarial review, QA evidence, and rollback/deferral notes.

## Acceptance criteria for this PRD
- It distinguishes docs-only Phase 0 from later implementation phases.
- It defines product goals, users, non-goals, workflows, MVP scope defaults, and success metrics.
- It preserves the human-approval boundary for Mirakl writes and production deploys.

## Export/import approval state model
Reviewer field approval, operator draft-package request, export locking, and Mirakl submission approval are separate controls. A field can be approved for inclusion in a draft without authorizing immediate Mirakl import submission. Mirakl submission requires a locked draft package and explicit operator approval.

## Clarification: Mirakl baseline + enrichment target workflow

The application should treat Mirakl as the current baseline catalog, even when the baseline is incomplete or polluted by storefront text. A product detail page should show the Mirakl record as-is, then show candidate improvements discovered from Orange public product pages and approved external sources.

Example baseline problem:
- Mirakl product: `Huawei FreeClip 2` in `Orange Audio y Hi-Fi / Orange Auriculares`.
- Mirakl has noisy storefront description text, missing required brand, and incomplete attributes.
- Orange page has structured attributes such as Bluetooth, MP3, weight, dimensions, battery conversation duration, charger power unit, and OS compatibility.
- External sources such as manufacturer pages or retailer pages may provide richer feature descriptions and additional specs such as Bluetooth version, charging case dimensions, microphone/noise reduction, battery capacity, release date, and real EAN.

The product detail workflow must therefore support:
1. Mirakl baseline snapshot display.
2. Orange-source comparison.
3. External research/evidence collection launched from the dashboard.
4. Field-level candidate proposals with confidence and source evidence.
5. Human accept/discard before Mirakl export/import.

The dashboard should make this distinction explicit: **baseline value**, **candidate target value**, **evidence**, **confidence**, and **review decision**.
