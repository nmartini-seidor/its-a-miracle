import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const {
  createMockResearchRun,
  exportPreview,
  getResearchRun,
  getStoredProduct,
  addReviewDecision,
  importDemoProducts,
  listStoredProducts,
  resetDemoState,
} = await import('../server/store.ts')

test('research job transitions from queued to running to succeeded and applies new evidence/candidates', () => {
  resetDemoState()
  importDemoProducts()
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
  const researchedProduct = getStoredProduct('freeclip-2')
  assert.equal(researchedProduct.evidence.length >= initialEvidenceCount + 3, true)
  assert.equal(researchedProduct.candidates.length >= initialCandidateCount + 3, true)
  assert.equal(researchedProduct.candidates.every((candidate) => candidate.sourceEvidenceIds.length > 0), true)
  assert.equal(researchedProduct.evidence.every((evidence) => evidence.sourceUrl?.startsWith('https://')), true)
  assert.equal(Object.keys(researchedProduct.bestEvidenceByField).length >= 3, true)
})

test('accepting a candidate refreshes export eligibility and listing status', () => {
  resetDemoState()
  importDemoProducts()
  const run = createMockResearchRun('freeclip-2')
  getResearchRun(run.id, new Date(Date.parse(run.createdAt) + 3000).toISOString())
  const productWithCandidates = getStoredProduct('freeclip-2')
  addReviewDecision(productWithCandidates.candidates[0].id, 'APPROVE', 'Verified against evidence')
  const preview = exportPreview('freeclip-2')
  const product = getStoredProduct('freeclip-2')

  assert.equal(product.listingStatus, 'EXPORT_READY')
  assert.equal(preview.rows.length >= 1, true)
})

test('research can populate evidence-backed candidates for every imported product', () => {
  resetDemoState()
  importDemoProducts()

  const importedProducts = listStoredProducts()
  assert.equal(importedProducts.length, 55)
  assert.equal(importedProducts.every((product) => product.candidates.length === 0 && product.evidence.length === 0), true)

  for (const product of importedProducts) {
    const run = createMockResearchRun(product.id)
    assert.ok(run)
    getResearchRun(run.id, new Date(Date.parse(run.createdAt) + 3000).toISOString())
  }

  const researchedProducts = listStoredProducts()
  assert.equal(researchedProducts.length, 55)
  assert.equal(researchedProducts.every((product) => product.evidence.length >= 3), true)
  assert.equal(researchedProducts.every((product) => product.candidates.length >= 3), true)
  assert.equal(researchedProducts.every((product) => product.evidence.every((evidence) => evidence.sourceUrl?.startsWith('https://'))), true)
  assert.equal(researchedProducts.every((product) => product.candidates.every((candidate) => candidate.sourceEvidenceIds.length > 0)), true)
})


test('product detail research action is presented as an agent run', () => {
  const source = readFileSync('components/product/research-button.tsx', 'utf8')

  assert.equal(source.includes('BotIcon'), true)
  assert.equal(source.includes('Run Research Agent'), true)
  assert.equal(source.includes('rounded-xl bg-gradient-to-r from-fuchsia-500 via-violet-500 to-sky-400'), true)
  assert.equal(source.includes('beginResearchActivity'), true)
  assert.equal(source.includes('research-flight-orb'), true)
  assert.equal(source.includes('Research missing info'), false)
})


test('research workspace page and navigation animation are wired', () => {
  const pageSource = readFileSync('app/research/page.tsx', 'utf8')
  const topNavSource = readFileSync('components/app/top-nav.tsx', 'utf8')
  const activitySource = readFileSync('components/app/research-activity.ts', 'utf8')
  const globalsSource = readFileSync('app/globals.css', 'utf8')

  assert.equal(pageSource.includes('Research agent queue'), true)
  assert.equal(pageSource.includes('listResearchJobs'), true)
  assert.equal(topNavSource.includes('useResearchActivity'), true)
  assert.equal(topNavSource.includes('research-nav-active'), true)
  assert.equal(activitySource.includes('mirakl-research-active-count'), true)
  assert.equal(globalsSource.includes('research-star-flight'), true)
})
