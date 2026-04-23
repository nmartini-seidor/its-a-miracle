# Mirakl API Example Usage

This workspace used the Mirakl operator APIs against:

```text
https://seidor-dev.mirakl.net
```

Official docs:

- Mirakl Marketplace operator APIs: https://developer.mirakl.com/content/product/mmp/rest/operator/openapi3
- Product endpoints and imports: https://developer.mirakl.com/content/product/mmp/rest/operator/openapi3/products
- Catalog Manager product source status: https://developer.mirakl.com/content/product/mcm/rest/operator/openapi3/products

## Authentication

Use the bearer token from `.credentials.txt` without committing or printing it:

```sh
set -a
source ./.credentials.txt
set +a

curl -sS \
  -H "Authorization: Bearer ${MIRAKL_OPERATOR_API_KEY}" \
  -H "Accept: application/json" \
  "https://seidor-dev.mirakl.net/api/locales"
```

Mirakl also documents legacy API-key auth through the `Authorization` header, but the credential in this workspace is an OAuth bearer token.

## Fetch Shops

Shop IDs are useful as provider IDs for product source status calls.

```sh
curl -sS \
  -H "Authorization: Bearer ${MIRAKL_OPERATOR_API_KEY}" \
  -H "Accept: application/json" \
  "https://seidor-dev.mirakl.net/api/shops?max=100&offset=0" \
  > /tmp/mirakl_shops.json
```

Useful fields:

- `shop_id`
- `shop_name`
- `permissions`
- `shop_state`

## Fetch Product Source Status

The Catalog Manager endpoint returns source products for a provider/shop. It can be filtered by status.

```sh
curl -sS -G \
  -H "Authorization: Bearer ${MIRAKL_OPERATOR_API_KEY}" \
  -H "Accept: application/json" \
  --data-urlencode "provider_id=2005" \
  --data-urlencode "status=LIVE" \
  "https://seidor-dev.mirakl.net/api/mcm/products/sources/status/export"
```

For pending or failed source products:

```sh
curl -sS -G \
  -H "Authorization: Bearer ${MIRAKL_OPERATOR_API_KEY}" \
  -H "Accept: application/json" \
  --data-urlencode "provider_id=2005" \
  --data-urlencode "status=NOT_LIVE" \
  "https://seidor-dev.mirakl.net/api/mcm/products/sources/status/export"
```

Useful fields:

- `provider_unique_identifier`
- `unique_identifiers`
- `status`
- `errors`
- `warnings`

Practical unique key for source products:

```text
provider_id + provider_unique_identifier
```

## Fetch Catalog Product Details

`GET /api/products` returns product details for known product references. It does not dump the whole catalog by itself; pass references such as `EAN|1230009431245`.

```sh
curl -sS -G \
  -H "Authorization: Bearer ${MIRAKL_OPERATOR_API_KEY}" \
  -H "Accept: application/json" \
  --data-urlencode "product_references=EAN|1230009431245,EAN|1230009431246" \
  "https://seidor-dev.mirakl.net/api/products"
```

Useful fields:

- `product_sku`, for example `mp-00000002`
- `product_id_type`, for example `EAN`
- `product_id`
- `product_title`
- `category_code`
- `category_label`
- `authorized_shop_ids`

Practical unique key for live/integrated catalog products:

```text
product_sku
```

For products not yet live, `product_sku` may be absent.

## Fetch Attribute Configuration

Before creating products, fetch required fields for the target category/hierarchy.

```sh
curl -sS \
  -H "Authorization: Bearer ${MIRAKL_OPERATOR_API_KEY}" \
  -H "Accept: application/json" \
  "https://seidor-dev.mirakl.net/api/products/attributes?hierarchy=soft&max_level=0" \
  > /tmp/mirakl_attrs_soft.json
```

For the `soft` category, required fields observed were:

- `category`
- `shop_sku`
- `name [en]`
- `ean`
- `media`
- `brand`

## Fetch Value Lists

Some attributes require values from Mirakl value lists.

```sh
curl -sS \
  -H "Authorization: Bearer ${MIRAKL_OPERATOR_API_KEY}" \
  -H "Accept: application/json" \
  "https://seidor-dev.mirakl.net/api/values_lists?code=brand-values"
```

Observed usable brand code:

```text
NXTZ
```

For boolean-style values:

```sh
curl -sS \
  -H "Authorization: Bearer ${MIRAKL_OPERATOR_API_KEY}" \
  -H "Accept: application/json" \
  "https://seidor-dev.mirakl.net/api/values_lists?code=boolean-values"
```

Observed values:

```text
true
false
```

## Create / Push Product By Import

Mirakl product creation uses a file import:

```text
POST /api/products/imports
```

There is not a single JSON "create product" endpoint in the operator API we used.

Example CSV:

```csv
category;shop_sku;name [en];description [en];ean;media;brand;calories_drinks;sugar_drinks;carbohydrates_drinks;caffeine_drinks
soft;MCG_01_X99;Miracle Citrus Soda;Sparkling citrus soft drink created through the Mirakl operator product import API.;1230009431263;https://placehold.co/600x600/png?text=Miracle+Citrus+Soda;NXTZ;42;10.5;10.5;false
```

Submit the import:

```sh
curl -sS -X POST \
  "https://seidor-dev.mirakl.net/api/products/imports" \
  -H "Authorization: Bearer ${MIRAKL_OPERATOR_API_KEY}" \
  -H "Accept: application/json" \
  -F "operator_format=true;type=application/json" \
  -F "shop=2005;type=application/json" \
  -F "file=@create_mirakl_beverage_import.csv;type=text/csv"
```

Successful response:

```json
{
  "import_id": 2400
}
```

## Poll Import Status

```sh
curl -sS \
  -H "Authorization: Bearer ${MIRAKL_OPERATOR_API_KEY}" \
  -H "Accept: application/json" \
  "https://seidor-dev.mirakl.net/api/products/imports/2400"
```

Useful fields:

- `import_status`
- `transform_lines_read`
- `transform_lines_in_success`
- `transform_lines_in_error`
- `has_error_report`
- `has_new_product_report`
- `has_transformation_error_report`
- `has_transformed_file`

Observed successful transform response:

```json
{
  "import_status": "SENT",
  "transform_lines_read": 1,
  "transform_lines_in_success": 1,
  "transform_lines_in_error": 0,
  "has_transformed_file": true
}
```

`SENT` means the file was accepted/transformed and sent to downstream product integration. It does not necessarily mean the product is live.

## Download Transformed File

```sh
curl -sS \
  -H "Authorization: Bearer ${MIRAKL_OPERATOR_API_KEY}" \
  -H "Accept: text/csv" \
  "https://seidor-dev.mirakl.net/api/products/imports/2400/transformed_file" \
  > /tmp/mirakl_transformed_2400.csv
```

## Check Created Product Source

After import, check the MCM source status using the shop/provider ID and source SKU.

```sh
curl -sS -G \
  -H "Authorization: Bearer ${MIRAKL_OPERATOR_API_KEY}" \
  -H "Accept: application/json" \
  --data-urlencode "provider_id=2005" \
  --data-urlencode "provider_unique_identifier=MCG_01_X99" \
  "https://seidor-dev.mirakl.net/api/mcm/products/sources/status/export"
```

Observed result for the example product:

```json
[
  {
    "provider_unique_identifier": "MCG_01_X99",
    "unique_identifiers": [
      {
        "code": "EAN",
        "value": "1230009431263"
      }
    ],
    "status": "NOT_LIVE",
    "errors": [
      {
        "code": "MCM-04014",
        "message": "The product needs to be reviewed by the operator."
      },
      {
        "code": "MCM-0L000",
        "message": "The product has not been published yet."
      }
    ]
  }
]
```

This means the import worked, but the product still needs operator review/publication before it becomes live and appears through `/api/products`.

## Update Existing Product By Import

Updates use the same endpoint as creation:

```text
POST /api/products/imports
```

To update an existing source product, re-import a row with the same shop/provider context and the same source identifiers:

- Same `shop` multipart value, for example `2005`
- Same `shop_sku`, for example `MCG_01_X99`
- Same product identifier, for example `ean=1230009431263`

Example update CSV with additional attributes:

```csv
category;shop_sku;name [en];description [en];ean;media;brand;variantGroupCode;size;MATERIAL;calories_drinks;sugar_drinks;carbohydrates_drinks;caffeine_drinks
soft;MCG_01_X99;Miracle Citrus Soda;Sparkling citrus soft drink created through the Mirakl operator product import API.;1230009431263;https://placehold.co/600x600/png?text=Miracle+Citrus+Soda;NXTZ;miracle-citrus-family;330 ml;Aluminium can;42;10.5;10.5;false
```

Submit it the same way:

```sh
curl -sS -X POST \
  "https://seidor-dev.mirakl.net/api/products/imports" \
  -H "Authorization: Bearer ${MIRAKL_OPERATOR_API_KEY}" \
  -H "Accept: application/json" \
  -F "operator_format=true;type=application/json" \
  -F "shop=2005;type=application/json" \
  -F "file=@create_mirakl_beverage_import.csv;type=text/csv"
```

Observed update response:

```json
{
  "import_id": 2401
}
```

Observed polling result:

```json
{
  "import_status": "SENT",
  "transform_lines_read": 1,
  "transform_lines_in_success": 1,
  "transform_lines_in_error": 0,
  "has_error_report": false
}
```

Notes:

- Mirakl treats create/update as an import workflow.
- Reusing the same source identifiers updates the source product rather than creating a separate one.
- Import transformation success does not guarantee the product is live.
- Check `/api/mcm/products/sources/status/export` after the import to see whether it is `LIVE`, `NOT_LIVE`, pending review, or failed.
- Pending products may continue to report `MCM-04014` and `MCM-0L000` until operator review/publication happens.

## Tool-Building Notes

- Do not log `MIRAKL_OPERATOR_API_KEY`.
- Use `Authorization: Bearer ${MIRAKL_OPERATOR_API_KEY}` for this workspace token.
- Treat API schemas as extensible. Mirakl docs state fields and enum values may be added.
- Use JSON when possible.
- Use `max` and `offset` for offset-paginated endpoints.
- Respect Mirakl rate limits and `Retry-After` on HTTP 429.
- For catalog exports, combine:
  - `/api/shops` to discover providers
  - `/api/mcm/products/sources/status/export` to discover source products
  - `/api/products` to enrich live products by product reference
- Include both live and not-live products when building an operational catalog view.
- Store source status errors and warnings; they explain pending or failed products.
- Use `product_sku` as the practical product key for live catalog products.
- Use `provider_id + provider_unique_identifier` as the practical key for source products.
- Pending products may not have `product_sku` until review/publication completes.
