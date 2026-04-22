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
