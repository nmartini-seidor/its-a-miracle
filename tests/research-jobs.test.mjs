import assert from 'node:assert/strict'
import { test } from 'node:test'

const {
  createMockResearchRun,
  exportPreview,
  getResearchRun,
  getStoredProduct,
  addReviewDecision,
  resetDemoState,
} = await import('../server/store.ts')

test('research job transitions from queued to running to succeeded and applies new evidence/candidates', () => {
  resetDemoState()
  const initialProduct = getStoredProduct('freeclip-2')
  const initialEvidenceCount = initialProduct.evidence.length
  const initialCandidateCount = initialProduct.candidates.length

  const run = createMockResearchRun('freeclip-2')
  assert.equal(run.status, 'QUEUED')
  assert.equal(getStoredProduct('freeclip-2').listingStatus, 'RESEARCH_IN_PROGRESS')

  const running = getResearchRun(run.id, new Date(Date.parse(run.createdAt) + 1500).toISOString())
  assert.equal(running.status, 'RUNNING')
  assert.equal(getStoredProduct('freeclip-2').evidence.length, initialEvidenceCount)

  const completed = getResearchRun(run.id, new Date(Date.parse(run.createdAt) + 3000).toISOString())
  assert.equal(completed.status, 'SUCCEEDED')
  assert.equal(getStoredProduct('freeclip-2').evidence.length, initialEvidenceCount + 1)
  assert.equal(getStoredProduct('freeclip-2').candidates.length, initialCandidateCount + 1)
  assert.equal(getStoredProduct('freeclip-2').bestEvidenceByField.microphone, 'Dual microphone call pickup')
})

test('accepting a candidate refreshes export eligibility and listing status', () => {
  resetDemoState()
  addReviewDecision('cand-brand', 'APPROVE', 'Verified against evidence')
  const preview = exportPreview('freeclip-2')
  const product = getStoredProduct('freeclip-2')

  assert.equal(product.listingStatus, 'EXPORT_PREVIEW_AVAILABLE')
  assert.equal(preview.rows.some((row) => row.field === 'brand'), true)
})
