import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { buildOutput, simulateResearchJob } from './helpers.mjs'

const store = await import('../server/store.ts')
const { addReviewDecision, getStoredProduct, importDemoProducts, listStoredProducts, resetDemoState } = store

test('resetDemoState clears the workspace and importDemoProducts restores the showcase catalog', () => {
  resetDemoState()
  assert.equal(listStoredProducts().length, 0)
  assert.equal(getStoredProduct('freeclip-2'), null)

  assert.equal(importDemoProducts(), 55)
  const initialProduct = getStoredProduct('freeclip-2')
  assert.equal(initialProduct.listingStatus, 'NEEDS_ENRICHMENT')
  assert.equal(initialProduct.candidates.length, 0)
  assert.equal(initialProduct.evidence.length, 0)

  const out = buildOutput([
    { field: 'ean', value: '6942103169441' },
    { field: 'cameraResolution', value: '50 MP' },
  ])
  simulateResearchJob(store, 'galaxy-a55', { cursor: out, codex: out, claude: out })
  const researchedProduct = getStoredProduct('galaxy-a55')
  assert.equal(researchedProduct.candidates.length >= 1, true)
  assert.equal(researchedProduct.evidence.length >= 2, true)

  addReviewDecision(researchedProduct.candidates[0].id, 'APPROVE', 'demo accept')
  const mutatedProduct = getStoredProduct('galaxy-a55')
  assert.equal(mutatedProduct.candidates.length >= 1, true)
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


test('import control presents an honest, env-paced product data import with progress (no fabricated counts)', () => {
  const source = readFileSync('components/settings/reset-workspace-button.tsx', 'utf8')

  // Keeps the branded, env-tuned, time-driven progress bar.
  assert.equal(source.includes('getMockProductImportDurationMs'), true)
  assert.equal(source.includes('importDurationMs = getMockProductImportDurationMs()'), true)
  assert.equal(source.includes('Import Product data'), true)
  assert.equal(source.includes('role="progressbar"'), true)
  assert.equal(source.includes('w-[min(72rem,calc(100vw-3rem))] max-w-full py-5 text-left'), true)
  assert.equal(source.includes('min-w-[6ch] text-right font-mono'), true)
  assert.equal(source.includes('tabular-nums'), true)
  assert.equal(source.includes('min-h-14 w-full text-lg font-medium'), true)

  // Fires the real import and reports the REAL count from the API (body.message), not a fake one.
  assert.equal(source.includes('/api/workspace/import'), true)
  assert.equal(source.includes('body.message'), true)

  // No fabricated counts, fraction, or fake "Analyzing" phase anymore.
  assert.equal(source.includes('fakeImport'), false)
  assert.equal(source.includes('fakeQualityAnalysis'), false)
  assert.equal(source.includes('/55'), false)
  assert.equal(source.includes('Importing product ${'), false)
  assert.equal(source.includes('Analyzing Product Data Quality'), false)
})
