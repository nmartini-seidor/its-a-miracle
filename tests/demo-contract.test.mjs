import assert from 'node:assert/strict'
import { test } from 'node:test'

const {
  EXPORTABLE_ATTRIBUTE_FIELDS,
  MOCK_DOMAIN_CONTRACT_VERSION,
  MOCK_STATE_OWNERSHIP,
  getFieldLabel,
  isAttributeFieldId,
  isSupportedMockContractVersion,
} = await import('../lib/demo-contract.ts')
const { heroProduct, products, schemas } = await import('../lib/fixtures.ts')
const { applyReviewDecisionToProduct, buildExportPreview } = await import('../server/store.ts')

function assertCanonicalFieldKeys(record) {
  for (const key of Object.keys(record)) {
    assert.equal(isAttributeFieldId(key), true, `expected canonical field id for ${key}`)
  }
}

test('mock domain contract exposes a versioned source of truth', () => {
  assert.equal(MOCK_DOMAIN_CONTRACT_VERSION, '2026-04-task1')
  assert.equal(isSupportedMockContractVersion(MOCK_DOMAIN_CONTRACT_VERSION), true)
  assert.deepEqual(MOCK_STATE_OWNERSHIP.serverFetchedMockApiData, [
    'products',
    'schemas',
    'aggregators',
    'settingsSnapshot',
    'researchJobs',
    'exportPreview',
  ])
  assert.equal(getFieldLabel('bluetoothVersion'), 'Bluetooth version')
})

test('schemas and hero fixtures use canonical field identifiers', () => {
  assert.equal(products.length >= 5, true)
  assert.equal(heroProduct.categoryPath.some((entry) => /orange/i.test(entry)), false)
  assert.equal(/orange/i.test(heroProduct.baselineDescription), false)
  assert.equal(heroProduct.evidence.some((record) => /orange/i.test(record.title) || /orange/i.test(record.sourceName)), false)

  for (const schema of schemas) {
    schema.requiredAttributes.forEach((field) => assert.equal(isAttributeFieldId(field), true))
    schema.recommendedAttributes.forEach((field) => assert.equal(isAttributeFieldId(field), true))
  }

  assertCanonicalFieldKeys(heroProduct.baselineAttributes)
  assertCanonicalFieldKeys(heroProduct.bestEvidenceByField)
  heroProduct.candidates.forEach((candidate) => {
    assert.equal(candidate.fieldName === 'researchSummary' || isAttributeFieldId(candidate.fieldName), true)
  })
  assert.equal(heroProduct.bestEvidenceByField.ean, '6942103169434')
})

test('seeded catalog uses Orange electronics imports instead of unrelated retail products', () => {
  const orangeImports = products.filter((product) => product.id.startsWith('orange-orange-'))
  const rejectedCatalogTerms = /Fanta|Sprite|Nestea|Aquarius|Soda|T-Shirt|Black Stripe|Coca Cola|Bitter Rosso|Nordic Mist/i

  assert.equal(orangeImports.length, 50)
  assert.equal(products.some((product) => rejectedCatalogTerms.test(`${product.title} ${product.brand} ${product.categoryPath.join(' ')}`)), false)
  assert.equal(orangeImports.every((product) => product.evidence.some((record) => record.sourceName === 'Orange source catalog')), true)
  assert.equal(orangeImports.every((product) => product.categoryPath.some((entry) => /gaming|computing|phones|tablets/i.test(entry))), true)
  assert.equal(orangeImports.some((product) => product.qualityScore === 100), false)
  assert.equal(orangeImports.find((product) => product.id === 'orange-orange-mkp000919395167').schemaId, 'schema-video-games')
  assert.equal(Object.hasOwn(orangeImports.find((product) => product.id === 'orange-orange-mkp000919395167').baselineAttributes, 'weight'), false)
})

test('export preview includes only exportable accepted candidate values and preserves one accepted candidate per field', () => {
  const draftProduct = structuredClone(heroProduct)
  draftProduct.candidates.push({
    ...draftProduct.candidates[0],
    id: 'cand-brand-alt',
    candidateValue: 'Huawei Audio',
    status: 'accepted',
  })
  draftProduct.candidates.push({
    id: 'cand-research-summary',
    productId: draftProduct.id,
    fieldName: 'researchSummary',
    currentValue: null,
    candidateValue: 'Operator note',
    confidence: 'medium',
    status: 'accepted',
    sourceEvidenceIds: [],
  })

  applyReviewDecisionToProduct(draftProduct, 'cand-brand', 'APPROVE')
  applyReviewDecisionToProduct(draftProduct, 'cand-ean', 'APPROVE')

  const preview = buildExportPreview(draftProduct)
  const previewFields = preview.rows.map((row) => row.field)

  assert.equal(previewFields.includes('researchSummary'), false)
  assert.equal(previewFields.includes('brand'), true)
  assert.equal(previewFields.includes('ean'), true)
  assert.equal(new Set(previewFields).size, previewFields.length)
  previewFields.forEach((field) => assert.equal(EXPORTABLE_ATTRIBUTE_FIELDS.includes(field), true))
})
