Mirakl Enrichment Demo Spec

1. Purpose

Build a demo-first frontend prototype that simulates a product-enrichment workflow for Mirakl catalogs.

The goal is not to implement real crawling, external connectors, or real enrichment logic yet.

The goal is to convincingly fake the full end-to-end story so a user can understand the value of the product:

1. Connect Mirakl
2. Import catalog products into the application
3. Score product quality
4. Detect missing or noisy fields
5. Launch simulated research jobs against external sources
6. Show field-level evidence and candidate values
7. Let the user accept or reject improvements
8. Generate an export preview back to Mirakl

This prototype should feel like a real product intelligence workspace even if the external research and evidence are mocked.

⸻

2. Demo Narrative

The demo should tell this story:

* A catalog is extracted from Mirakl and loaded into the app.
* Products are analyzed against category schemas.
* Each product gets a quality score and warnings.
* The user opens a product and compares:
    * Mirakl baseline
    * simulated external source evidence
    * proposed candidate improvements
* The user reviews field-level proposals.
* The user can accept/reject individual candidates.
* The user sees an export preview that shows what would go back to Mirakl.

Important: the system must clearly look like a safe preview workspace where Mirakl is not mutated unless export is explicitly done.

⸻

3. Product Vision

This application is a Mirakl Product Intelligence / Enrichment Workspace.

It helps marketplace operators review poor-quality catalog data and improve it using simulated external evidence.

Core value proposition:

* find incomplete or noisy product records
* compare baseline vs evidence vs candidate
* make field-level approval decisions
* produce a cleaner export back to Mirakl

⸻

4. Scope

In scope for the demo

* Product catalog list
* Quality score per product
* Warning counts
* Product detail review page
* Compare tab
* Candidates tab
* Evidence tab
* Export preview tab
* Schemas section
* Aggregators section
* Settings page
* Mock data and fake research jobs
* Simulated evidence sources with confidence/authority
* Simulated candidate generation

Out of scope for the demo

* real crawling
* real LLM autonomous web research
* real authentication/roles
* real job orchestration backend
* real schema import from Mirakl (we know we can do it, but we are going to fake it for the demo)
* real source trust scoring from production data

⸻

5. Core UX Structure

Left navigation

The app should have these main sections in the sidebar:

1. Products
2. Catalog
3. Schemas
4. Aggregators
5. Settings

Optional future sections:

* Jobs
* Reviews
* Exports
* Audit log

⸻

6. Main Entities

6.1 Product

Represents a product imported from Mirakl.

6.2 Schema

Represents the field model expected for a product type.

Examples:

* Smartphones
* TVs
* Headphones
* Laptops
* Tablets
* Wearables
* Gaming accessories


6.3 Aggregator

Represents a simulated external source or data provider.

Examples:

* Manufacturer product page
* Retailer PDP
* Marketplace listing
* Spec database
* Review site
* Internal reference source

Suggested fields:

* id
* name
* type
* base_url
* authority_score
* default_confidence
* enabled
* coverage_tags

6.4 Evidence Record

Represents a piece of source evidence found for a product.

Suggested fields:

* id
* product_id
* aggregator_id
* source_name
* source_type
* source_url
* confidence
* summary
* raw_fields
* captured_at

6.5 Candidate

Represents a proposed improvement for a single field.

Suggested fields:

* id
* product_id
* field_name
* current_value
* candidate_value
* source_evidence_ids
* confidence
* status (proposed, accepted, rejected)
* reason

⸻

7. Products Page

Goal

Show imported Mirakl products and identify which ones need review.

UI elements

* table or list of products
* product name
* category
* quality score
* warning count
* action button: Review
* optional filter chips
* optional sort by score / warnings / category

Example columns

* Product
* Category
* Score
* Warnings
* Candidates
* Evidence sources
* Action

Demo behavior

The list should already be populated with mock products imported from Mirakl. (we already have the orange ones)

Examples:

* Huawei FreeClip 2
* Samsung Galaxy A55
* LG OLED C4 55
* Sony WH-1000XM5
* Xiaomi Redmi Pad Pro

Each product should have a believable score like 56/100, 72/100, etc.

Scoring idea

Score is fake but should look rule-based.

Suggested scoring factors:

* missing required fields
* poor or empty description
* missing brand
* missing EAN
* inconsistent attributes
* noisy storefront text
* low image count
* weak attribute completeness

Warning examples

* Brand is missing
* Description contains storefront noise
* EAN missing or suspicious
* Required schema field missing
* Field units are inconsistent
* Candidate differs from Mirakl baseline

⸻

8. Product Detail Page

Goal

Allow a user to review one product in depth.

Header area

Should contain:

* back button
* product title
* category path
* product identifier
* action button: Research missing info

Summary cards

Should show:

* Quality score
* Candidates count
* Evidence sources count
* Baseline warnings count

Alert area

A visible banner for baseline issues, for example:

* Brand is required
* Description contains storefront noise
* Candidate EAN differs from Mirakl baseline

Tabs

1. Compare
2. Candidates
3. Evidence
4. Export preview

⸻

9. Compare Tab

Goal

Show side-by-side field comparison.

Table structure

Columns:

* Field
* Mirakl baseline
* Source / best evidence
* Candidate

Example fields for electronics

For audio/headphones:

* Brand
* Bluetooth
* Bluetooth version
* USB-C
* Weight
* Dimensions
* Battery life
* Battery technology
* Operating system compatibility
* Color
* Description
* EAN

For phones, TVs, laptops, etc, the fields must vary by schema.

Behavior

* baseline can be missing
* source column can show best evidence or summarized source value
* candidate column can show proposed improvement
* visually highlight changed fields
* visually highlight missing baseline values

Important demo point

This screen should make it obvious that the system is not overwriting Mirakl directly. It is only comparing baseline, evidence, and proposals.

⸻

10. Candidates Tab

Goal

Show field-level proposals that the user can accept or reject.

Candidate card or row

Each candidate should show:

* field name
* confidence level
* current value
* candidate value
* evidence source badges
* buttons:
    * Accept
    * Reject
    * More evidence

Example

Brand

* Current: Missing
* Candidate: Huawei
* Confidence: High
* Evidence badge: Orange Huawei FreeClip 2

Bluetooth version

* Current: Missing
* Candidate: 6.0
* Confidence: Medium
* Evidence badge: Retailer spec page

Description

* Current: noisy / weak
* Candidate: clean rewritten product description
* Confidence: High
* Evidence badges: manufacturer page + retailer source

Acceptance behavior

For demo purposes:

* accepting a candidate updates a local review state only
* rejected candidates stay visible with rejected status
* no real Mirakl mutation happens

⸻

11. Evidence Tab

Goal

Show the sources that support the candidates.

Evidence card structure

Each evidence card should show:

* source title
* source type
* confidence label
* short source summary
* extracted key facts
* open source link

Example evidence types

* manufacturer page
* retailer reference
* spec database
* partner content feed

Example evidence summary

* Bluetooth 6.0
* USB-C charging
* battery 537 mAh
* dimensions 25.4 x 26.7 x 18.8 mm
* battery life 9 hours / 38 hours with case

Important demo point

The evidence should feel like it came from real websites, but it can be entirely mocked.

The source card only needs:

* believable name
* believable source type
* believable confidence
* believable summary
* optional fake Open source link

⸻

12. Export Preview Tab

Goal

Show what would be exported back to Mirakl.

Content

* only accepted candidate values
* baseline unchanged fields omitted or shown as unchanged
* export payload preview
* JSON preview and/or table preview

Example structure

{
  "product_id": "ORANGE_3711247",
  "updates": {
    "brand": "Huawei",
    "ean": "6942103169434",
    "bluetooth_version": "6.0",
    "description": "Huawei FreeClip 2 are lightweight open-ear wireless earbuds with Bluetooth connectivity, long battery life, USB-C charging, and a charging case."
  }
}

Important demo point

This should communicate:

* review first
* approve field-level changes
* export later

⸻

13. Schemas Section

Goal

Define what attributes are expected for each product type.

Why this matters

Phones, TVs, headphones, laptops, and gaming products do not share the same field model.

The schema section should make the product feel structured and enterprise-ready.

Example schema list

* Smartphones
* Televisions
* Headphones & Earbuds
* Laptops
* Monitors
* Tablets
* Smartwatches

Schema detail page should show

* schema name
* linked categories
* required attributes
* recommended attributes
* scoring rules
* warning rules
* example products using this schema

Example headphone schema

Required:

* Brand
* Product name
* EAN
* Connectivity
* Weight
* Battery life
* Description

Recommended:

* Bluetooth version
    n- USB-C
* Microphone
* Noise reduction
* Charging case included
* Dimensions
* Compatibility

Demo behavior

Schemas can be fully hardcoded loaded from JSON.

⸻

14. Aggregators Section

Goal

Represent the external sources the system uses for evidence.

This section is key for the demo because it explains where the system is supposedly researching.

Aggregator concept

An aggregator is a mocked source definition with a trust/authority model.

Examples:

* Official manufacturer website
* Trusted retailer
* Marketplace listing
* Tech specs provider
* Internal partner feed

Aggregator fields

* name
* description
* type
* authority score
* enabled / disabled
* supported categories
* sample domains
* default confidence policy

Example aggregator records

Official Manufacturer

* Type: manufacturer
* Authority: 95
* Confidence policy: highest for core specs and branding

Retailer Reference

* Type: retailer
* Authority: 70
* Confidence policy: medium for commercial copy, medium/high for visible specs

Spec Database

* Type: structured catalog
* Authority: 85
* Confidence policy: high for technical fields

Marketplace Listing

* Type: marketplace
* Authority: 45
* Confidence policy: low/medium, mostly corroboration only

Demo behavior

You do not need real crawling.

You only need mocked aggregator definitions and mocked evidence generation that references them.

⸻

15. Settings Page

Goal

Show how the product would be configured in a real setup.

Fields

Mirakl connectivity

* Mirakl base URL
* Frontend API token
* Operator API token
* Shop ID / operator ID if needed
* environment selector

Demo / research settings

* enable fake research mode
* default research delay
* max evidence per product
* default candidate confidence
* export preview mode

Schema settings

* default schema mapping strategy
* auto-assign schema by category

Aggregator settings

* enabled aggregators
* authority override values
* source order preference

Important

All settings can be fake and stored locally.

⸻

16. Fake Research Workflow

Goal

Simulate external research without building real connectors.

User action

The user clicks Research missing info.

What should happen in the demo

1. a research job starts
2. a loading/progress state appears
3. mocked evidence records are generated
4. mocked candidate proposals are generated
5. product detail page refreshes with:
    * evidence count
    * candidate count
    * updated warnings
    * new compare results

Important

This should feel asynchronous even if everything is fake.

Recommended implementation approach

Use a local mocked job engine:

* click button
* create job = running
* wait 30 seconds
* load generated JSON fixture
* transform fixture into evidence + candidates
* set job = completed

Demo fixture strategy

Use one fixture per product or per category.

Example:

* headphones_huawei_freeclip_2.json
* tv_lg_oled_c4.json
* phone_samsung_a55.json

Each fixture can contain:

* mocked evidence sources
* mocked extracted fields
* mocked candidate suggestions
* confidence labels

⸻

17. How to Fake the Intelligence

The objective is not real accuracy.
The objective is believable product behavior.

Recommended simulation model

Step 1: score baseline

Use deterministic rules:

* missing brand = -15
* missing EAN = -20
* missing required schema field = -10 each
* weak description = -10
* detected noise = -10
* strong completeness = +points

Step 2: generate warnings

Warnings are derived from baseline + schema.

Step 3: simulate evidence

Load product-specific evidence fixtures.

Step 4: generate candidates

For each missing or weak field:

* if evidence has stronger value than baseline, create candidate
* assign confidence based on aggregator authority

Step 5: support review decisions

Accepted/rejected states are local only.

Confidence model for the demo

Example mapping:

* manufacturer = high
* spec database = high
* retailer = medium
* marketplace = low

⸻

18. Mock Data Strategy

Products dataset

Seed the catalog with all mirakl products we have, but we need to remove the "Orange" reference in mirakl first, this is a generic tool, not only for orange

Schema dataset

Seed the app with 5-8 category schemas.

Aggregator dataset

Seed the app with 10-20 mocked source providers.

Evidence fixtures

Each reviewable product should have a predefined evidence pack.

Candidate fixtures

Each reviewable product should have predefined candidates.

Export fixtures

Generate export preview from accepted candidates.

⸻

19. Suggested Frontend Architecture


Suggested frontend modules

* products
* product-review
* schemas
* aggregators
* settings
* jobs
* export-preview

Suggested fake backend endpoints

* GET /products
* GET /products/:id
* POST /products/:id/research
* GET /products/:id/evidence
* GET /products/:id/candidates
* POST /products/:id/candidates/:candidateId/accept
* POST /products/:id/candidates/:candidateId/reject
* GET /schemas
* GET /aggregators
* GET /settings
* POST /settings
* GET /products/:id/export-preview

⸻

20. UX Principles

The UI should communicate these principles clearly:

* Mirakl baseline is read-only until export
* evidence supports decisions
* candidates are field-level, not full overwrite
* schemas drive completeness expectations
* source authority affects confidence
* the system is safe, reviewable, and controlled

⸻

21. What the Agent Should Build

The implementation agent should build a demo product with these capabilities:

1. load a mocked Mirakl product list
2. show products in a triage dashboard
3. calculate fake quality scores and warnings
4. open product review pages
5. show compare / candidates / evidence / export preview tabs
6. support accept/reject candidate interactions
7. show schemas in a dedicated section
8. show aggregators in a dedicated section
9. provide a settings page for Mirakl config and demo config
10. simulate research jobs using mocked data fixtures

The agent should optimize for:

* believable workflow
* clean UX
* easy demoability
* expandable architecture

Not for:

* production data correctness
* real crawling
* real external integrations

⸻

22. Acceptance Criteria

The demo is successful if:

* a user can understand the Mirakl enrichment workflow without explanation
* a product list loads with scores and warnings
* at least one product can be reviewed end-to-end
* evidence appears after launching research
* candidates can be accepted/rejected
* export preview reflects accepted changes
* schemas and aggregators make the model feel credible
* settings page makes the product feel integrable

⸻

23. Suggested Seed Demo Product

Use Huawei FreeClip 2 as the primary demo example.

Suggested narrative:

* Mirakl baseline is incomplete
* brand missing
* EAN incorrect or suspicious
* description weak or noisy
* Bluetooth version missing
* USB-C missing
* evidence from manufacturer-style page + retailer-style page
* candidate values proposed with different confidence levels
* user accepts brand, EAN, Bluetooth version, and description improvements
* export preview shows approved final payload

⸻

24. Future Evolution After the Demo

Once the fake version works, future phases can replace mocked logic with real integrations:

* real Mirakl APIs
* real schema import/mapping
* real source connectors
* real research jobs
* real evidence extraction
* real approval workflow
* real export pipeline

The demo architecture should therefore be modular enough to swap fake providers for real ones later.

⸻

25. Final Build Instruction for the Agent

Build a frontend-first Mirakl enrichment workspace demo that simulates external research and candidate generation for electronics products.

The product must look like a serious B2B tool.

Everything can be mocked, but the workflow must feel real:

* catalog imported from Mirakl
* schema-aware quality scoring
* source-driven evidence
* field-level candidate review
* controlled export preview

The implementation should prioritize clarity, realism, and demo impact over backend complexity.