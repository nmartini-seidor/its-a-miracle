import assert from 'node:assert/strict'
import { test } from 'node:test'

const { heroProduct, schemas } = await import('../lib/fixtures.ts')
const { buildReviewFieldRows, orderReviewFields } = await import('../lib/product-review.ts')

const heroSchema = schemas.find((schema) => schema.id === heroProduct.schemaId) ?? null

test('orderReviewFields prioritizes schema-required fields before evidence extras', () => {
  const orderedFields = orderReviewFields(heroProduct, heroSchema)

  assert.deepEqual(orderedFields.slice(0, 4), ['brand', 'productName', 'ean', 'connectivity'])
  assert.equal(orderedFields.includes('bluetoothVersion'), true)
  assert.equal(orderedFields.includes('description'), true)
})

test('buildReviewFieldRows starts imported rows without candidate or evidence values', () => {
  const reviewRows = buildReviewFieldRows(heroProduct, heroSchema)
  const brandRow = reviewRows.find((row) => row.field === 'brand')
  const descriptionRow = reviewRows.find((row) => row.field === 'description')
  const compatibilityRow = reviewRows.find((row) => row.field === 'compatibility')
  const noiseReductionRow = reviewRows.find((row) => row.field === 'noiseReduction')

  assert.equal(brandRow?.baselineMissing, true)
  assert.equal(brandRow?.hasCandidate, false)
  assert.equal(descriptionRow?.baselineMissing, false)
  assert.equal(descriptionRow?.hasCandidate, false)
  assert.equal(compatibilityRow?.evidenceValue, null)
  assert.equal(compatibilityRow?.candidateValue, null)
  assert.equal(compatibilityRow?.hasCandidate, false)
  assert.equal(noiseReductionRow?.evidenceValue, null)
  assert.equal(noiseReductionRow?.candidateValue, null)
  assert.equal(noiseReductionRow?.hasCandidate, false)
})
