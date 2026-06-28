import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { test } from "node:test"

const { miraklAuthHeader, getMiraklAuthScheme, isDevMiraklHost, probeMiraklAuth } = await import("../server/mirakl-request.ts")
const { getKnownAttributeCodes } = await import("../server/mirakl-catalog-config.ts")
const { dryRunMiraklAttributeSync, submitMiraklAttributeSync } = await import("../server/mirakl-live-sync.ts")

function productWith(candidates) {
  return {
    id: "p",
    miraklProductId: "SRC_P",
    title: "t",
    brand: null,
    categoryPath: [],
    schemaId: "schema-gaming-devices",
    listingStatus: "EXPORT_READY",
    qualityScore: 90,
    scoreBand: "green",
    baselineDescription: "",
    warnings: [],
    baselineAttributes: {},
    bestEvidenceByField: {},
    evidence: [],
    candidates: candidates.map((c, i) => ({
      id: `c${i}`,
      productId: "p",
      fieldName: c.field,
      currentValue: null,
      candidateValue: c.value,
      sourceEvidenceIds: ["e"],
      confidence: "high",
      status: "accepted",
    })),
  }
}

function withEnv(overrides, fn) {
  const saved = {}
  for (const key of Object.keys(overrides)) saved[key] = process.env[key]
  for (const [key, value] of Object.entries(overrides)) {
    if (value == null) delete process.env[key]
    else process.env[key] = value
  }
  return Promise.resolve(fn()).finally(() => {
    for (const [key, value] of Object.entries(saved)) {
      if (value == null) delete process.env[key]
      else process.env[key] = value
    }
  })
}

test("miraklAuthHeader honours the scheme: raw by default, Bearer when configured", () => {
  return withEnv({ MIRAKL_AUTH_SCHEME: undefined }, () => {
    assert.equal(getMiraklAuthScheme(), "raw")
    assert.equal(miraklAuthHeader("abc"), "abc")
    assert.equal(miraklAuthHeader("abc", "bearer"), "Bearer abc")
  }).then(() =>
    withEnv({ MIRAKL_AUTH_SCHEME: "bearer" }, () => {
      assert.equal(getMiraklAuthScheme(), "bearer")
      assert.equal(miraklAuthHeader("abc"), "Bearer abc")
    }),
  )
})

test("isDevMiraklHost allows only the dev tenant / localhost", () => {
  assert.equal(isDevMiraklHost("https://seidor-dev.mirakl.net"), true)
  assert.equal(isDevMiraklHost("http://localhost:3000"), true)
  assert.equal(isDevMiraklHost("https://seidor.mirakl.net"), false)
  assert.equal(isDevMiraklHost("https://evil.example.com"), false)
  assert.equal(isDevMiraklHost("not a url"), false)
})

test("getKnownAttributeCodes returns the real committed codes and not the invented ones", () => {
  const codes = getKnownAttributeCodes()
  for (const real of ["weight_g", "storage_gb", "usb_c", "dimensions_mm", "bluetooth", "ram_gb"]) {
    assert.equal(codes.has(real), true, `expected real code ${real}`)
  }
  // The codes the demo previously invented appear in no committed config.
  assert.equal(codes.has("gaming_feature"), false)
  assert.equal(codes.has("compatible"), false)
})

test("dry-run: a draft of real codes is ok; an unmapped field makes it not-ok and is surfaced", () => {
  const okResult = dryRunMiraklAttributeSync(productWith([{ field: "weight", value: "534 g" }]))
  assert.equal(okResult.attributeHeaders.includes("weight_g"), true)
  assert.deepEqual(okResult.unknownHeaders, [])
  assert.deepEqual(okResult.unmappedFields, [])
  assert.equal(okResult.ok, true)

  const mixed = dryRunMiraklAttributeSync(productWith([{ field: "weight", value: "534 g" }, { field: "connectivity", value: "Wi-Fi" }]))
  assert.equal(mixed.attributeHeaders.includes("weight_g"), true)
  assert.equal(mixed.draft.headers.includes("gaming_feature"), false)
  assert.equal(mixed.unmappedFields.includes("connectivity"), true)
  assert.equal(mixed.ok, false)
})

test("a wrong attribute code (read but zero transformed) is a failed no-op, not a success", () => {
  return withEnv(
    {
      MIRAKL_BASE_URL: "https://seidor-dev.mirakl.net",
      MIRAKL_OPERATOR_API_KEY: "test-token",
      MIRAKL_SYNC_SHOP_ID: "2005",
      MIRAKL_SYNC_CATEGORY_CODE: "source_gaming_console",
      MIRAKL_SYNC_POLL_ATTEMPTS: "2",
      MIRAKL_SYNC_POLL_DELAY_MS: "0",
      MIRAKL_AUTH_SCHEME: "raw",
    },
    async () => {
      const originalFetch = globalThis.fetch
      globalThis.fetch = async (url) => {
        const u = String(url)
        if (u.endsWith("/api/products/imports")) return new Response(JSON.stringify({ import_id: 2403 }), { status: 201 })
        if (u.includes("/error_report")) return new Response("No error report found", { status: 404 })
        // Terminal status, but nothing transformed: this is exactly the silent no-op of a wrong code.
        return new Response(JSON.stringify({ import_status: "SENT", transform_lines_read: 1, transform_lines_in_success: 0, transform_lines_in_error: 0 }), { status: 200 })
      }
      try {
        await assert.rejects(() => submitMiraklAttributeSync(productWith([{ field: "weight", value: "534 g" }])), /no-op|did NOT land/i)
      } finally {
        globalThis.fetch = originalFetch
      }
    },
  )
})

test("connectivity route source enforces the dev-by-default host guard (item 9)", () => {
  const source = readFileSync("app/api/integrations/mirakl/connectivity/route.ts", "utf8")
  assert.equal(source.includes("isDevMiraklHost"), true)
  assert.equal(source.includes("allowNonDevHost"), true)
  assert.equal(source.includes("NON_DEV_HOST"), true)
  assert.equal(source.includes("probeMiraklAuth"), true)
})

test("probeMiraklAuth reports the winning scheme and falls back raw -> bearer", () => {
  return withEnv({ MIRAKL_AUTH_SCHEME: "raw" }, async () => {
    const originalFetch = globalThis.fetch
    try {
      // raw wins immediately
      globalThis.fetch = async () => new Response("{}", { status: 200 })
      const a = await probeMiraklAuth("https://seidor-dev.mirakl.net/api/shops", "k")
      assert.equal(a.ok, true)
      assert.equal(a.scheme, "raw")

      // raw 401 -> bearer 200
      let n = 0
      globalThis.fetch = async () => new Response("{}", { status: n++ === 0 ? 401 : 200 })
      const b = await probeMiraklAuth("https://seidor-dev.mirakl.net/api/shops", "k")
      assert.equal(b.ok, true)
      assert.equal(b.scheme, "bearer")

      // a non-auth error (500) does not keep retrying schemes and reports failure
      globalThis.fetch = async () => new Response("{}", { status: 500 })
      const c = await probeMiraklAuth("https://seidor-dev.mirakl.net/api/shops", "k")
      assert.equal(c.ok, false)
      assert.equal(c.status, 500)
    } finally {
      globalThis.fetch = originalFetch
    }
  })
})
