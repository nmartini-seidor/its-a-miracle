# Mirakl write-back: static-key auth, attribute codes from category config, human-gated live proof; tighten read/connectivity host guard

The dev-tenant write-back path (`server/mirakl-live-sync.ts`, ADR 0005) exists and is gated, but has **never been proven to land a real import** — the committed `data/mirakl/imports/2402/error_report` and `new_product_report` are real Mirakl `404`s ("No error report found for importTracking 2402"). This ADR refines ADR 0005 with the auth scheme, the attribute-code source, the verification bar, and a tighter read/connectivity host guard (the demo's "miracle" — making one real import actually land and be confirmed).

## Decision

- **Auth is a configurable static-key scheme, defaulting to raw.** The repo authenticates with a **static operator API key** (`MIRAKL_OPERATOR_API_KEY`, a UUID) sent directly — there is **no OAuth/`client_credentials` token-exchange anywhere** in the codebase. Mirakl's static-key convention is the **raw** `Authorization: <api_key>` header, **not** `Bearer` — which is why the current four call sites (`mirakl-live-sync.ts:137,172`; `scripts/sync-mirakl-snapshot.mjs:25`; `app/api/integrations/mirakl/connectivity/route.ts:38`, all sending `Bearer`) plausibly 401. We do **not** hardcode the opposite scheme (Mirakl Connect genuinely uses `Bearer`): introduce `MIRAKL_AUTH_SCHEME` (`raw`|`bearer`, default `raw`), build the header in **one shared `miraklRequest` helper** used by all four sites so they can't drift, and have the connectivity probe try `raw` then fall back to `bearer`, reporting which scheme succeeded. The committed test that asserts `Bearer` (`tests/mirakl-sync-script.test.mjs:129`) is updated to assert the helper's output for the configured scheme.
- **Attribute codes come from the category config, and the shop↔category↔code triple must be internally consistent.** `DEFAULT_ATTRIBUTE_CODE_MAP` (`mirakl-live-sync.ts:10-17`) contains **invented** codes — `connectivity→gaming_feature` and `compatibility→compatible` appear in **no committed Mirakl config**, and the `?? field` fallback emits raw camelCase names that are never valid codes. A wrong code does **not** error: Mirakl returns `import_status=SENT` with `transform_lines_in_error=0` and **writes nothing** — a silent no-op reported as success, the worst demo outcome. Source real codes from `data/mirakl/catalog-config/*` (e.g. `ps5_attributes_import.csv` → `storage_gb`, `usb_c`, `weight_g`, `dimensions_mm`; beverages → `create_mirakl_beverage_import.csv` → `calories_drinks`, `sugar_drinks`, `MATERIAL`, …). The submit path currently ships **gaming** attribute codes to **shop 2005 ("Black Stripe Beverages")** — that mismatch is the top blocker; pick one consistent category+shop+code set.
- **The poller proves the value landed, not merely `SENT`.** `SENT` ≠ published (AGENTS.md, ADR 0005). `pollMiraklImportStatus` must assert `transform_lines_read ≥ 1`, `transform_lines_in_success ≥ 1`, `transform_lines_in_error == 0`, fetch the error/new-product report on any non-zero error count (the gap the 2402 `404`s expose), and treat `lines_read>0 && lines_in_success==0` as a failed no-op rather than success.
- **Live verification is human-gated; the agent does not fire live writes.** Per AGENTS.md, live writes need explicit approval + dev tenant only, and credentials are not in the repo (`.credentials.txt` is off-limits). Mirakl offers **no server-side dry-run** for product imports, so the agent's safe contribution is: the code fixes above, a local **CSV-shape dry run** (build the draft and diff its headers against the chosen category's real codes), the read-only connectivity probe, and a **runbook**. A human runs the single-row live write with credentials and an explicit approval click.
- **Trust-boundary guard (item 9), least-surprising boundary.** **Writes** stay hard-blocked to the dev tenant with **no override** (`assertDevTenant`, `mirakl-live-sync.ts:84-97` — keep, and keep the test proving prod is unreachable). **Snapshot reads** stay flag-gated (`--live-read-approved`) — AGENTS.md *permits* an approved prod read, so don't over-restrict; just **log the resolved host** for auditability. The real gap is the **connectivity route**, which today accepts an arbitrary `miraklBaseUrl` from the request body with **zero** host check: make it **dev-by-default**, requiring an explicit `allowNonDevHost` body flag (logged) for any non-dev host. Route all four call sites through the shared helper so the per-direction guard is applied uniformly.

## Considered options

- **Hardcode raw (drop the env switch):** rejected — it's the same "bet the demo on a guessed scheme" mistake in reverse, silently breaks the committed `Bearer` test, and can't serve a future Mirakl Connect (`Bearer`) tenant.
- **Force dev-only on reads too:** rejected — AGENTS.md treats reads as *approval-gated, not forbidden*; a second override flag on reads is friction with no guardrail basis. Only the unguarded connectivity route needs tightening.

## Consequences

New required env for the write path: `MIRAKL_BASE_URL`, `MIRAKL_SYNC_SHOP_ID`, `MIRAKL_SYNC_CATEGORY_CODE`, plus optional `MIRAKL_AUTH_SCHEME`. "Prove one import lands" remains a **human-run milestone** the agent cannot complete autonomously. This refines ADR 0005 (still accepted); 0005 establishes *that* write-back is dev-tenant + approval-gated, 0007 establishes *how* to make it actually work and be verified.

**Goal:** following the runbook with dev credentials, a human submits one approved single-row import and confirms — by re-reading the product — that the attribute value is present (not stuck in `MCM-04014`/`MCM-0L000`); and the code path no longer reports a no-op import as success.

## Runbook (human-operated, dev tenant only)

1. Export `MIRAKL_BASE_URL=https://seidor-dev.mirakl.net`, `MIRAKL_OPERATOR_API_KEY`, `MIRAKL_SYNC_SHOP_ID`, `MIRAKL_SYNC_CATEGORY_CODE`, `MIRAKL_AUTH_SCHEME=raw`. Never source `.credentials.txt` into the repo.
2. **Auth probe (read-only):** hit the connectivity route against the dev host. Expect `200`. On `401`, flip `MIRAKL_AUTH_SCHEME=bearer`, retry, and record which scheme wins.
3. **Pick a consistent triple:** one real category + a shop authorized for it + that category's attribute codes from `data/mirakl/catalog-config/*`. Verify the built draft's headers ⊆ the category's real codes (local dry run, no write).
4. **Single-row write (approved click):** submit one product; capture `import_id`.
5. **Prove it landed:** poll to a terminal status; assert `transform_lines_read ≥ 1`, `transform_lines_in_success ≥ 1`, `transform_lines_in_error == 0`; on errors, fetch and attach the report. Then **re-read** the product (source-status export / catalog row) and confirm the attribute value is present and the row is not stuck in `MCM-04014`/`MCM-0L000`.
6. **Record** in this ADR the winning auth scheme, the exact category↔code map used, and the final product status.

## Live discovery against `seidor-dev.mirakl.net` (read-only, operator-approved)

A read-only probe of the dev tenant (no writes) resolved the open questions this ADR was built around:

- **Winning auth scheme: `bearer`.** `raw` → `401`, `bearer` → `200` on `/api/shops`. The committed
  default (`raw`) would have 401'd — exactly the failure mode the configurable `MIRAKL_AUTH_SCHEME`
  switch exists for. **For this tenant, set `MIRAKL_AUTH_SCHEME=bearer`.**
- **Category↔code map confirmed.** The live category is **`orange_gaming_console`** (label "Orange
  Gaming Console"), *not* the `source_gaming_console` hierarchy-code in the committed
  `data/mirakl/catalog-config/*` CSVs. Its real attribute codes — `storage_gb`, `ram_gb`, `weight_g`,
  `dimensions_mm`, `usb_c`, `bluetooth` (all `TEXT`) — exactly match `DEFAULT_ATTRIBUTE_CODE_MAP`, so
  the "real codes, not invented" fix is validated against the live tenant. (The "orange" prefix is the
  legacy brand the repo's brand-token guard protects against in committed files.)
- **Required import fields:** `category`, `shop_sku`, `name [en]`, `ean`, `media`, `brand`. The
  attribute-only sync draft (which deliberately omits identity/media fields) can therefore only
  *update* attributes on a product that already exists; it cannot *create* a product (missing `media`).
- **Product references are typed** (`EAN|…`, `SHOP_SKU|…`), and tenant product SKUs are
  `ORANGE_*` / `mp-*`. The demo seeds `SRC_MKP*` SKUs, which do **not** exist on the tenant — so the
  demo's sync would attempt a create and fail the required-field validation. The reachable catalog in
  the committed snapshot is beverage/clothes-heavy; no product in `orange_gaming_console` was locatable
  from it.

**Status: the single live import has NOT yet landed.** The code path, auth scheme, attribute codes,
and hardened poller are all validated, but proving one import *lands and re-reads* needs a real tenant
product reference in `orange_gaming_console` (to update a single attribute with the matching category),
plus the tenant's required identity/media fields. This is a data-alignment gap, not a code gap — the
operator must supply a real product reference (or approve creating a labelled test product with a media
URL) before the landing can be proven and the final product status recorded here.

### Subsystem mismatch (P21 vs MCM) — the likely root cause of "never landed"

A real product the operator pointed at (`Huawei FreeClip 2`, EAN `1233711247139`, category
`orange_audio_y_hi_fi_auriculares`, MCM front uuid `a7c6d249-…`, status "New / Not synchronized")
exposed a deeper issue than auth/codes:

- The product is **NOT in the operator product catalog** (`GET /api/products?product_references=EAN|…`
  → `total_count: 0`). It lives in **MCM (Mirakl Catalog Manager)**, the operator's PIM, and is "Not
  synchronized" to the marketplace product catalog.
- The demo's write-back posts to **`/api/products/imports` (P21 operator product import)** — a
  **different subsystem** from MCM. So writing to P21 does not update the MCM product the operator
  sees; this is the most likely reason the historical import (the committed `2402` `404` reports)
  never landed.
- The MCM write API is not discoverable by probing (`/api/mcm/products`, `/api/mcm/products/imports`,
  `/api/mcm/products/{uuid}`, … all `404`; only `/api/mcm/products/sources/status/export` is known to
  respond — and that is read-only source status).
- Separately, the P21-reachable operator products that DO resolve (beverages, e.g. `Fanta` /
  `mp-00000002` / category `soft`) have empty `authorized_shop_ids`, so the demo's shop-scoped import
  format (`operator_format=true` + `shop` + `shop_sku`) does not cleanly map to them either.

**Open decision for the operator:** to actually land + verify a value, either (a) provide the **MCM
write/import API** path so the write-back can target where the products live, or (b) provide a real
**shop + shop_sku** of a product that matches the P21 shop-import format, or (c) approve a P21 import
of the FreeClip 2's EAN with the full required fields (incl. a `media` URL), accepting it may create a
parallel operator-catalog product rather than update the MCM one. Until one of these is chosen, the
agent cannot responsibly fire a write (it would be a blind guess at the wrong subsystem).

### Live write attempts (operator-approved, dev tenant) — poller validated, layer mismatch confirmed

The operator pointed at a real product (`Huawei FreeClip 2`, EAN `1233711247139`). Its source identity
was recovered from the committed CM11 snapshot: **shop `2005`, `shop_sku` (provider id) `ORANGE_3711247`,
category `orange_audio_y_hi_fi_auriculares`, status NOT_LIVE.** Two single-row imports were submitted via
`POST /api/products/imports` (P41, bearer):

- **Import `2423`** (`operator_format=true`, `category;shop_sku;weight_g`): `transform_lines_read=1`,
  `transform_lines_in_success=1`, **`transform_lines_in_error=1`**. The `weight_g` value transformed, but
  the row errored — `transformation_error_report`: *"'name [en]' is required, 'ean' is required, 'media'
  is required, 'brand' is required."* The **hardened poller correctly refused to report success** (a naive
  `success ≥ 1` check would have passed). ✅ This is the #1 ADR-0007 goal, proven live.
- **Import `2424`** (no `operator_format`, added `brand=Huawei`): still required `name [en]`/`ean`/`media`,
  plus **`2006| 'brand' is not in the possible values set in the value list`** — `brand` is a value-list
  attribute, so a free-text "Huawei" is rejected; it needs the exact VL11 list value.

**CM11 re-read after both imports: the FreeClip 2 source is unchanged** — still
`MCM-04014` ("needs to be reviewed by the operator") + `MCM-0L000` ("has not been published yet"), warning
`MCM-05000` ("'brand' is required"). So **P41 imports do NOT update the MCM source product** the operator
sees in `/mcm/front/inventory`; they target the separate operator product catalog. This empirically
confirms the subsystem mismatch and is the most likely root cause of the historical `2402` non-landing.

**Confirmed for this tenant:** auth `bearer`; category `orange_audio_y_hi_fi_auriculares` codes
(`weight_g`, `bluetooth`, `dimensions_mm`, `usb_c`) match `DEFAULT_ATTRIBUTE_CODE_MAP`; P41 operator import
requires a complete product (`name [en]`, `ean`, `media` image, `brand` from the value list). **Final
product status: NOT landed** — to publish the FreeClip 2 the operator must complete it in the **MCM** layer
(MCM UI edit, or the MCM datasource/import API — not the P21/P41 path the demo uses), setting `brand` to a
valid value-list entry (resolves `MCM-05000`) and reviewing it (resolves `MCM-04014`/`MCM-0L000`). The
agent could not reach an MCM write API (all `/api/mcm/products*` paths 404 except the read-only status
export), so this remains an operator/UI step.
