import assert from 'node:assert/strict'
import { test } from 'node:test'

const { addReviewDecision, createMockResearchRun, getResearchRun, getStoredProduct, importDemoProducts, listStoredProducts, resetDemoState } = await import('../server/store.ts')

test('resetDemoState clears the workspace and importDemoProducts restores the showcase catalog', () => {
  resetDemoState()
  assert.equal(listStoredProducts().length, 0)
  assert.equal(getStoredProduct('freeclip-2'), null)

  assert.equal(importDemoProducts(), 55)
  const initialProduct = getStoredProduct('freeclip-2')
  assert.equal(initialProduct.listingStatus, 'NEEDS_ENRICHMENT')
  assert.equal(initialProduct.candidates.length, 4)
  assert.equal(initialProduct.evidence.length, 2)

  const run = createMockResearchRun('freeclip-2')
  getResearchRun(run.id, new Date(Date.parse(run.createdAt) + 4000).toISOString())
  addReviewDecision('cand-brand', 'APPROVE', 'demo accept')

  const mutatedProduct = getStoredProduct('freeclip-2')
  assert.equal(mutatedProduct.candidates.length > 4, true)
  assert.equal(mutatedProduct.listingStatus !== 'NEEDS_ENRICHMENT', true)

  resetDemoState()
  assert.equal(listStoredProducts().length, 0)

  importDemoProducts()
  const resetProduct = getStoredProduct('freeclip-2')
  assert.equal(resetProduct.listingStatus, 'NEEDS_ENRICHMENT')
  assert.equal(resetProduct.candidates.length, 4)
  assert.equal(resetProduct.evidence.length, 2)
  assert.equal(resetProduct.warnings.includes('EAN requires review'), true)
})
