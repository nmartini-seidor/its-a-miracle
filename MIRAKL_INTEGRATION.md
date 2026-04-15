# Mirakl Integration Plan

## Status
Integration design only. No live Mirakl calls are performed in this milestone.

## Local evidence
`MIRAKL_EXAMPLE_USAGE.md` documents prior usage against `https://seidor-dev.mirakl.net`, bearer-token auth, source-status exports, product details, attribute configuration, value lists, file imports, import status polling, transformed file download, and source-status follow-up.

## Authentication
- Future implementation must use server-only credentials.
- `.credentials.txt` values must not be committed, logged, printed, copied into docs, or exposed to browser clients.
- Production credentials should live in an approved server-side environment mechanism such as Vercel environment variables or a managed secret store.
- Token rotation and leak response are covered in `SECURITY.md`.

## Read-only integration paths
| Flow | Endpoint | Purpose |
| --- | --- | --- |
| Provider discovery | `/api/shops` | Map Mirakl shops/providers. |
| Source status export | `/api/mcm/products/sources/status/export` | Fetch source product status by provider and status. |
| Catalog details | `/api/products` | Fetch product details by known references such as EAN. |
| Attribute schema | `/api/products/attributes` | Fetch category/hierarchy attributes and required fields. |
| Value lists | `/api/values_lists` | Fetch valid enumerated values. |

## Source identity rules
- Use `provider_id + provider_unique_identifier` for source products.
- Use `product_sku` when available for live/integrated catalog products.
- Products not yet live may not have `product_sku`; preserve source identifiers.

## Write/import integration paths
Mirakl product creation/update uses file import (`POST /api/products/imports`) rather than a simple JSON update endpoint. This is approval-gated.

## Approval-gated import lifecycle
1. Reviewer approves field-level candidate values.
2. System validates category, required attributes, value lists, identifiers, evidence policy, and source snapshot freshness.
3. System generates draft export/import package and diff preview.
4. Operator explicitly approves submission.
5. System submits `POST /api/products/imports`.
6. System records `import_id` in `import_attempts`.
7. System polls import status with backoff.
8. System downloads transformed/error/new-product/transformation reports where available.
9. System checks MCM source status after import.
10. System records partial failures and rework items.
11. Operator review/publication may still be required; `SENT` does not mean live.

## Import status handling
Track:
- `import_status`
- lines read/succeeded/errored/warned
- report availability flags
- transformed file reference
- error report reference
- new product report reference
- transformation report reference
- MCM source status after import

## Partial failure policy
- Never silently drop failed rows.
- Keep successful and failed rows linked to the export batch.
- Mark failed candidates or rows for rework.
- Store report metadata and actionable error summaries.
- Avoid automatic re-submission unless explicitly approved and idempotency is understood.

## Rate limit/backoff
- Honor `Retry-After` for 429 where available.
- Use bounded exponential backoff for transient read failures.
- Treat write/import retry as operator-visible and approval-sensitive.

## Category/value-list drift
- Sync category attributes and value lists before scoring and export preparation.
- Mark scores/candidates stale when schema changes.
- Validate export rows against latest schema.

## Acceptance criteria
- Read-only and write paths are separated.
- Every write/import step is approval-gated.
- Import status/report and source-status follow-up are modeled.
- `SENT` is explicitly not treated as live/published success.

## Export/import state machine
Use the same state names across PRD, API, technical specs, and UI:
1. `CANDIDATE_PROPOSED` — enrichment job drafts a field value.
2. `FIELD_APPROVED` / `FIELD_REJECTED` — reviewer decides the field-level candidate.
3. `EXPORT_DRAFT_REQUESTED` — operator requests a draft package from approved fields.
4. `EXPORT_DRAFT_VALIDATED` — server validates category/value-list/source/evidence constraints.
5. `EXPORT_LOCKED` — draft file/rows are locked with a file hash and source snapshot hash.
6. `IMPORT_SUBMISSION_APPROVED` — operator explicitly approves Mirakl submission.
7. `IMPORT_SUBMITTED` — server calls `POST /api/products/imports` and records import id.
8. `IMPORT_POLLING` — server polls status and retrieves reports where available.
9. `IMPORT_COMPLETED`, `IMPORT_PARTIAL_FAILURE`, or `IMPORT_FAILED` — terminal import-attempt state.
10. `SOURCE_STATUS_RECHECKED` — MCM source status is checked; publication/live state remains distinct from transform success.

Draft package generation requires approved candidate fields and operator request. Mirakl submission requires a separate explicit operator approval after reviewing the locked draft.

## Value-list preflight before product imports

Before bulk product import, synchronize and validate every Mirakl value-list-backed attribute. The PS5 import attempt `2402` proved this is required: the source product was created as `NOT_LIVE`, but Mirakl returned warning `MCM-05010` because `Sony` was not present in the `brand-values` value list.

### Relevant Mirakl APIs
- `GET /api/products/attributes` returns attribute configuration and identifies list-backed attributes such as `brand` with `values_list = brand-values`.
- `GET /api/values_lists?code=brand-values` returns accepted brand values.
- Mirakl value-list imports are handled through `POST /api/values_lists/imports` with multipart `file` upload, then status through `GET /api/values_lists/imports/{import}`, and error report through `GET /api/values_lists/imports/{import}/error_report` where available.

### Required bulk flow
1. Extract unique source values from Orange data for all list-backed fields, starting with brand.
2. Fetch Mirakl attribute config and value lists.
3. Normalize extracted values into stable codes and labels.
4. Diff extracted values against Mirakl value-list values.
5. Produce a value-list import draft for missing values, e.g. missing brands such as `Sony`.
6. Import/update value lists first and poll the value-list import status.
7. Re-fetch value lists and verify missing values are now accepted.
8. Only then generate product import files.
9. If a value remains missing, block that product row or route it to manual mapping; do not silently use placeholders.

### Brand mapping rules
- Prefer exact brand label/code match in `brand-values`.
- If the brand is missing, add it to the value list before product import, or create an explicit manual mapping decision.
- Do not substitute unrelated brand codes to make a product import pass.
- Preserve source brand, Mirakl brand code, and mapping decision in the import manifest.

## Attribute-model preflight before product imports

The PS5 import attempt also showed that Orange attributes do not automatically appear in Mirakl. Mirakl only transforms/imports attributes that exist in the target Mirakl product attribute model for the selected hierarchy/category. For the test row we used `toys_merch`, whose accepted attributes were limited to generic merchandising fields such as `category`, `shop_sku`, `name [en]`, `description [en]`, `ean`, `media`, `brand`, `variantGroupCode`, `size`, `MATERIAL`, and `WASHING-DIRECTIONS`. The Orange PS5 fields (`Sistema operativo`, `Memoria RAM`, `Wifi`, `USB tipo C`, etc.) were not discrete Mirakl attributes, so they could only be squeezed into generic fields like `MATERIAL` or omitted from the transformed product sheet.

### Required attribute-model flow
1. Extract Orange attributes per category and normalize them into candidate Mirakl attribute definitions.
2. Fetch Mirakl product attributes for the target hierarchy with `GET /api/products/attributes?hierarchy=<code>&max_level=0`.
3. Diff Orange attribute candidates against Mirakl attribute codes and labels.
4. Create or update the Mirakl attribute/category model before product import, or create an explicit mapping to existing attributes.
5. Re-fetch attribute configuration and verify every product-import column is accepted by Mirakl.
6. Only then generate product import CSVs with discrete attribute columns.

### PS5 candidate attribute mapping
| Orange group | Orange attribute | Proposed Mirakl code | Suggested type | Example value |
| --- | --- | --- | --- | --- |
| Sistema operativo | Tipo de sistema operativo | `os_type` | TEXT | `Propio de PS5` |
| Memoria | Memoria interna (almacenamiento) (GB) | `storage_gb` | DECIMAL/TEXT | `1000` |
| Memoria | Memoria RAM (GB) | `ram_gb` | DECIMAL/TEXT | `16` |
| Conectividad | Wifi | `wifi` | BOOLEAN/LIST | `true` |
| Conectividad | Bluetooth | `bluetooth` | BOOLEAN/LIST | `true` |
| Características destacadas | Comandos de voz | `voice_commands` | BOOLEAN/LIST | `true` |
| Características destacadas | Manos libres | `hands_free` | BOOLEAN/LIST | `true` |
| Características destacadas | MP4 | `mp4` | BOOLEAN/LIST | `true` |
| Dimensiones | Peso del dispositivo (gr) | `weight_g` | DECIMAL/TEXT | `3200` |
| Dimensiones | Tamaño (largo x ancho x fondo) (mm) | `dimensions_mm` | TEXT | `358 × 96 × 216` |
| Conectores | USB tipo C | `usb_c` | BOOLEAN/LIST | `true` |
| Otros detalles | Contenido de la caja | `box_contents` | LONG_TEXT | `Mando inalámbrico ...` |

If Mirakl does not yet have a gaming/console category model, create/approve that category and its attributes first. Do not expect arbitrary Orange CSV columns to show on the Mirakl product page unless Mirakl attribute configuration recognizes those columns.

### Catalog-configuration permission requirement

Updating Mirakl value lists, hierarchies, and product attributes requires catalog-configuration permissions beyond normal product import permissions. In the current workspace token, product imports are allowed, but catalog configuration imports returned `403 Forbidden` for:

- `POST /api/values_lists/imports`
- `POST /api/hierarchies/imports`
- `POST /api/products/attributes/imports`

Therefore, bulk push with new brands/attributes requires an operator credential or role that can import value lists, hierarchies, and product attributes. Product rows should remain blocked until those configuration imports succeed and are re-fetched/verified.

## Product-source deletion limitation observed

Attempting to delete the ORANGE test source products through `POST /api/products/imports` with an `update-delete` column did not remove the source products from MCM. Both lowercase `delete` and uppercase `DELETE` imports transformed successfully, but subsequent `GET /api/mcm/products/sources/status/export` checks still returned all ORANGE provider source identifiers as `NOT_LIVE`.

Observed delete attempts:
- Import `2416`: 22 rows, `update-delete=delete`, transform success 22/22, source products still present.
- Import `2417`: 22 rows, `update-delete=DELETE`, transform success 22/22, source products still present.

Conclusion: in this MMP/MCM setup, product source deletion is not achieved through the operator product import endpoint, even when the transformer accepts the file. Public MMP product docs do not document a delete operation for product sources; available documented product operations are import/status/report/transformed-file reads. Removing pending MCM source products likely requires a back-office Catalog Manager action or a non-public/internal endpoint/permission not exposed by the public API.

Operational rule: do not assume product imports can delete source products. For cleanup, keep test products blocked/not-published, or remove/reject them through the Mirakl UI if available.

## Variant-family cleanup limitation observed

A bad test import (`2409`) sent unrelated products with the same `variantGroupCode=orange-gaming-family` and no `size` value. Mirakl MCM then reported duplicate/irrelevant variant errors such as `size-variant-code-is-null` and variants with different categories.

Later corrected imports (`2414`, `2418`) transformed successfully with category-specific hierarchies, unique `variantGroupCode`, and unique `size`, but the MCM UI continued to show the old variant-family warnings. This indicates Mirakl may keep previously accepted/locked variant-family relationships for pending source products.

A follow-up import (`2419`) attempted to pass `update_options={"allow_locked_values_override":true,"lock_mode":"NONE"}`, but the import status still reported `update_options.allow_locked_values_override=false`, so this option was ignored/not supported by the public product import endpoint in this instance.

Operational rule:
- Do not use `variantGroupCode` for standalone products unless they are true variants.
- If `variantGroupCode` is needed, provide the complete variant axis values from the first import.
- If a bad variant family has already been accepted in MCM, public product import updates may not detach it. Use Mirakl back-office source-product/variant cleanup or reject/delete pending sources in the UI if available.
- For future tests, omit `variantGroupCode` entirely unless a category-specific variant model has been validated.
