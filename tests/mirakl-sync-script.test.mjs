import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const {
  addReviewDecision,
  createMockResearchRun,
  getResearchRun,
  getStoredProduct,
  importDemoProducts,
  resetDemoState,
} = await import('../server/store.ts')
const {
  buildMiraklAttributeSyncDraft,
  submitMiraklAttributeSync,
} = await import('../server/mirakl-live-sync.ts')

test('Mirakl snapshot sync is explicit, read-only, and does not read local credential files', () => {
  const source = readFileSync('scripts/sync-mirakl-snapshot.mjs', 'utf8')

  assert.equal(source.includes('--live-read-approved'), true)
  assert.equal(source.includes('MIRAKL_OPERATOR_API_KEY'), true)
  assert.equal(source.includes('.credentials.txt'), false)
  assert.equal(source.includes('/api/shops'), true)
  assert.equal(source.includes('/api/mcm/products/sources/status/export'), true)
  assert.equal(source.includes('/api/products/imports'), false)
})

test('Mirakl product sync route submits an attribute import before local baseline sync', () => {
  const source = readFileSync('app/api/products/[id]/sync/route.ts', 'utf8')

  assert.equal(source.includes('submitMiraklAttributeSync(product)'), true)
  assert.equal(source.includes('syncProductWithMirakl(id, miraklImport.draft.syncedFields)'), true)
  assert.equal(source.includes('miraklImportId'), true)
})

test('attribute sync draft for the Switch 2 product excludes name image description and identity fields', () => {
  resetDemoState()
  importDemoProducts()
  const previousCategory = process.env.MIRAKL_SYNC_CATEGORY_CODE
  process.env.MIRAKL_SYNC_CATEGORY_CODE = 'test_gaming_category'

  try {
    const run = createMockResearchRun('catalog-item-mkp000905189074')
    getResearchRun(run.id, new Date(Date.parse(run.createdAt) + 6000).toISOString())

    const researchedProduct = getStoredProduct('catalog-item-mkp000905189074')
    for (const candidate of researchedProduct.candidates) {
      addReviewDecision(candidate.id, 'APPROVE', 'attribute-only test approval')
    }

    const approvedProduct = getStoredProduct('catalog-item-mkp000905189074')
    const draft = buildMiraklAttributeSyncDraft(approvedProduct)

    assert.equal(draft.miraklProductId, 'SRC_MKP000905189074')
    assert.deepEqual(draft.headers.slice(0, 2), ['category', 'shop_sku'])
    assert.deepEqual(draft.rows[0].slice(0, 2), ['test_gaming_category', 'SRC_MKP000905189074'])
    assert.equal(draft.headers.includes('name [en]'), false)
    assert.equal(draft.headers.includes('media'), false)
    assert.equal(draft.headers.includes('description'), false)
    assert.equal(draft.headers.includes('brand'), false)
    assert.equal(draft.headers.includes('productName'), false)
    assert.equal(draft.headers.includes('ean'), false)
    assert.equal(draft.headers.includes('dimensions_mm'), true)
    assert.equal(draft.headers.includes('storage_gb'), true)
    assert.equal(draft.headers.includes('gaming_feature'), true)
    assert.equal(draft.csv.includes('Nintendo Consola Nintendo Switch 2'), false)
    assert.equal(draft.csv.includes('1239051890745'), false)
  } finally {
    if (previousCategory == null) delete process.env.MIRAKL_SYNC_CATEGORY_CODE
    else process.env.MIRAKL_SYNC_CATEGORY_CODE = previousCategory
  }
})

test('live Mirakl attribute sync posts multipart product import and polls status', async () => {
  const originalFetch = globalThis.fetch
  const originalEnv = {
    MIRAKL_OPERATOR_API_KEY: process.env.MIRAKL_OPERATOR_API_KEY,
    MIRAKL_SYNC_SHOP_ID: process.env.MIRAKL_SYNC_SHOP_ID,
    MIRAKL_SYNC_CATEGORY_CODE: process.env.MIRAKL_SYNC_CATEGORY_CODE,
    MIRAKL_SYNC_POLL_ATTEMPTS: process.env.MIRAKL_SYNC_POLL_ATTEMPTS,
    MIRAKL_SYNC_POLL_DELAY_MS: process.env.MIRAKL_SYNC_POLL_DELAY_MS,
  }
  const calls = []

  process.env.MIRAKL_OPERATOR_API_KEY = 'test-operator-token'
  process.env.MIRAKL_SYNC_SHOP_ID = '2005'
  process.env.MIRAKL_SYNC_CATEGORY_CODE = 'test_gaming_category'
  process.env.MIRAKL_SYNC_POLL_ATTEMPTS = '2'
  process.env.MIRAKL_SYNC_POLL_DELAY_MS = '0'

  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), init })
    if (String(url).endsWith('/api/products/imports')) {
      const csv = await init.body.get('file').text()
      assert.equal(init.method, 'POST')
      assert.equal(init.headers.Authorization, 'Bearer test-operator-token')
      assert.equal(init.body.get('operator_format'), 'true')
      assert.equal(init.body.get('shop'), '2005')
      assert.equal(csv.startsWith('category;shop_sku;weight_g'), true)
      assert.equal(csv.includes('name [en]'), false)
      assert.equal(csv.includes('media'), false)
      return new Response(JSON.stringify({ import_id: 2402 }), { status: 201 })
    }
    if (calls.length === 2) {
      return new Response(JSON.stringify({
        import_status: 'TRANSFORMATION_WAITING',
        transform_lines_read: 0,
        transform_lines_in_success: 0,
        transform_lines_in_error: 0,
      }), { status: 200 })
    }

    return new Response(JSON.stringify({
      import_status: 'SENT',
      transform_lines_read: 1,
      transform_lines_in_success: 1,
      transform_lines_in_error: 0,
    }), { status: 200 })
  }

  try {
    const result = await submitMiraklAttributeSync({
      id: 'catalog-item-mkp000905189074',
      miraklProductId: 'SRC_MKP000905189074',
      title: 'Nintendo Consola Nintendo Switch 2 + Super Mario Galaxy 1y2',
      brand: 'Nintendo',
      categoryPath: ['Gaming', 'Consoles & bundles'],
      schemaId: 'schema-gaming-devices',
      listingStatus: 'EXPORT_READY',
      qualityScore: 90,
      scoreBand: 'green',
      baselineDescription: '',
      warnings: [],
      baselineAttributes: {},
      bestEvidenceByField: {},
      evidence: [],
      candidates: [
        {
          id: 'cand-weight',
          productId: 'catalog-item-mkp000905189074',
          fieldName: 'weight',
          currentValue: null,
          candidateValue: '534 g',
          sourceEvidenceIds: ['ev-weight'],
          confidence: 'high',
          status: 'accepted',
        },
      ],
    })

    assert.equal(result.importId, 2402)
    assert.equal(calls.length, 3)
    assert.equal(calls[1].url.endsWith('/api/products/imports/2402'), true)
    assert.equal(calls[2].url.endsWith('/api/products/imports/2402'), true)
  } finally {
    globalThis.fetch = originalFetch
    for (const [key, value] of Object.entries(originalEnv)) {
      if (value == null) delete process.env[key]
      else process.env[key] = value
    }
  }
})
