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

test('buildReviewFieldRows flags missing baseline values and candidate-ready rows', () => {
  const reviewRows = buildReviewFieldRows(heroProduct, heroSchema)
  const brandRow = reviewRows.find((row) => row.field === 'brand')
  const descriptionRow = reviewRows.find((row) => row.field === 'description')

  assert.equal(brandRow?.baselineMissing, true)
  assert.equal(brandRow?.hasCandidate, true)
  assert.equal(descriptionRow?.baselineMissing, false)
  assert.equal(descriptionRow?.hasCandidate, true)
})
