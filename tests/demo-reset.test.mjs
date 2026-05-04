import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const { addReviewDecision, createMockResearchRun, getResearchRun, getStoredProduct, importDemoProducts, listStoredProducts, resetDemoState } = await import('../server/store.ts')

test('resetDemoState clears the workspace and importDemoProducts restores the showcase catalog', () => {
  resetDemoState()
  assert.equal(listStoredProducts().length, 0)
  assert.equal(getStoredProduct('freeclip-2'), null)

  assert.equal(importDemoProducts(), 55)
  const initialProduct = getStoredProduct('freeclip-2')
  assert.equal(initialProduct.listingStatus, 'NEEDS_ENRICHMENT')
  assert.equal(initialProduct.candidates.length, 0)
  assert.equal(initialProduct.evidence.length, 0)

  const run = createMockResearchRun('freeclip-2')
  getResearchRun(run.id, new Date(Date.parse(run.createdAt) + 4000).toISOString())
  const researchedProduct = getStoredProduct('freeclip-2')
  assert.equal(researchedProduct.candidates.length >= 3, true)
  assert.equal(researchedProduct.evidence.length >= 3, true)

  addReviewDecision(researchedProduct.candidates[0].id, 'APPROVE', 'demo accept')
  const mutatedProduct = getStoredProduct('freeclip-2')
  assert.equal(mutatedProduct.candidates.length >= 3, true)
  assert.equal(mutatedProduct.listingStatus !== 'NEEDS_ENRICHMENT', true)

  resetDemoState()
  assert.equal(listStoredProducts().length, 0)

  importDemoProducts()
  const resetProduct = getStoredProduct('freeclip-2')
  assert.equal(resetProduct.listingStatus, 'NEEDS_ENRICHMENT')
  assert.equal(resetProduct.candidates.length, 0)
  assert.equal(resetProduct.evidence.length, 0)
  assert.equal(resetProduct.warnings.includes('EAN requires review'), true)
})


test('import control presents a fake 30-second product data import with progress', () => {
  const source = readFileSync('components/settings/reset-workspace-button.tsx', 'utf8')

  assert.equal(source.includes('fakeImportDurationMs = 30_000'), true)
  assert.equal(source.includes('fakeImportProductCount = 55'), true)
  assert.equal(source.includes('Import Product data'), true)
  assert.equal(source.includes('role="progressbar"'), true)
  assert.equal(source.includes('w-[min(72rem,calc(100vw-3rem))] max-w-full py-5 text-left'), true)
  assert.equal(source.includes('min-w-[6ch] text-right font-mono'), true)
  assert.equal(source.includes('tabular-nums'), true)
  assert.equal(source.includes('min-h-14 w-full text-lg font-medium'), true)
  assert.equal(source.includes('Importing 55 products into the workspace'), false)
  assert.equal(source.includes('The catalog remains local while records are counted'), false)
  assert.equal(source.includes('rounded-2xl bg-slate-50 px-5'), false)
  assert.equal(source.includes('Found ${fakeImportProductCount} products'), true)
  assert.equal(source.includes('Importing product ${productIndex}/${fakeImportProductCount}'), true)
  assert.equal(source.includes('Analyzing Product Data Quality'), true)
  assert.equal(source.includes('fakeQualityAnalysisDurationMs = 5_000'), true)
})
