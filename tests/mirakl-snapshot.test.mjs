import assert from "node:assert/strict"
import { test } from "node:test"

const { parseSemicolonCsv, loadSnapshotProducts, mapSnapshotRowToProduct } = await import("../server/mirakl-snapshot.ts")
const store = await import("../server/store.ts")

test("parseSemicolonCsv handles quoted fields with embedded delimiters", () => {
  const csv = 'shop_sku;product-name;description\nSRC_1;"Sony WH-1000XM5";"Great headphones; very comfy"\nSRC_2;Galaxy A55;Phone'
  const rows = parseSemicolonCsv(csv)
  assert.equal(rows.length, 2)
  assert.equal(rows[0]["shop_sku"], "SRC_1")
  assert.equal(rows[0]["product-name"], "Sony WH-1000XM5")
  assert.equal(rows[0]["description"], "Great headphones; very comfy")
})

test("a snapshot row maps to a ProductRecord with inferred schema and baseline attributes", () => {
  const product = mapSnapshotRowToProduct({
    "shop_sku": "SRC_TEST_1",
    "product-name": "Sony WH-1000XM5 Wireless Headphones",
    "category-label": "Audio > Headphones",
    "brand": "Sony",
    "ean": "4548736141540",
    "description": "Noise cancelling over-ear headphones",
  })
  assert.ok(product)
  assert.equal(product.miraklProductId, "SRC_TEST_1")
  assert.equal(product.title, "Sony WH-1000XM5 Wireless Headphones")
  assert.equal(product.brand, "Sony")
  assert.equal(product.schemaId, "schema-headphones-earbuds")
  assert.deepEqual(product.categoryPath, ["Audio", "Headphones"])
  assert.equal(product.baselineAttributes.ean, "4548736141540")
  assert.equal(product.baselineAttributes.brand, "Sony")
  assert.equal(product.candidates.length, 0)
  assert.equal(product.evidence.length, 0)
})

test("real Mirakl source-status JSON exports are parsed (identity-only baselines)", () => {
  // The live /api/mcm/products/sources/status/export returns JSON, not CSV.
  const snapshot = {
    sourceStatusExports: [
      {
        csv: JSON.stringify([
          { provider_unique_identifier: "mcg_cam_2", unique_identifiers: [{ code: "EAN", value: "1129034501204" }], status: "LIVE" },
          { provider_unique_identifier: "MCG_01_X16", unique_identifiers: [{ code: "EAN", value: "1230009431246" }], status: "NOT_LIVE" },
        ]),
      },
    ],
  }
  const products = loadSnapshotProducts(snapshot)
  assert.equal(products.length, 2)
  assert.equal(products[0].miraklProductId, "mcg_cam_2")
  assert.equal(products[0].baselineAttributes.ean, "1129034501204")
  assert.equal(products[0].candidates.length, 0)
})

test("a row without a recognisable SKU is skipped", () => {
  assert.equal(mapSnapshotRowToProduct({ "random-col": "x" }), null)
})

test("loadSnapshotProducts maps and dedupes across source-status exports", () => {
  const snapshot = {
    capturedAt: "2026-06-23T00:00:00Z",
    sourceStatusExports: [
      { csv: "shop_sku;product-name;category-label;brand\nSRC_A;Galaxy A55;Phones > Smartphones;Samsung\nSRC_B;LG OLED C4;TV > Televisions;LG" },
      { csv: "shop_sku;product-name;category-label\nSRC_A;Galaxy A55;Phones > Smartphones" }, // dup SKU
    ],
  }
  const products = loadSnapshotProducts(snapshot)
  assert.equal(products.length, 2) // SRC_A deduped
  const phone = products.find((p) => p.miraklProductId === "SRC_A")
  const tv = products.find((p) => p.miraklProductId === "SRC_B")
  assert.equal(phone.schemaId, "schema-smartphones")
  assert.equal(tv.schemaId, "schema-televisions")
})

test("importProducts seeds the store from a snapshot product set, keeping it review-only", () => {
  const snapshot = {
    sourceStatusExports: [{ csv: "shop_sku;product-name;category-label;brand\nSRC_IMP_1;Test Phone;Phones > Smartphones;TestBrand" }],
  }
  const products = loadSnapshotProducts(snapshot)
  store.resetDemoState()
  const count = store.importProducts(products)
  assert.equal(count, 1)
  const stored = store.listStoredProducts()
  assert.equal(stored.length, 1)
  assert.equal(stored[0].miraklProductId, "SRC_IMP_1")
  assert.equal(stored[0].candidates.length, 0)
  store.resetDemoState()
})
