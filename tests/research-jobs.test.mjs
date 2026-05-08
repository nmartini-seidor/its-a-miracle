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
  syncProductWithMirakl,
} = await import('../server/store.ts')

const placeholderResearchPattern =
  /product dimensions verified|dimensiones verificadas|current-generation console|ecosistema de consolas|not applicable|no aplicable|rechargeable battery|batería recargable|integrated microphone|matriz de micrófonos|up to 10 hours|hasta 10 horas|compatible stylus supported|4 HDMI ports|3840 x 2160|2400 x 1080/i

function researchText(product) {
  return [
    ...product.candidates.flatMap((candidate) => [candidate.candidateValue, candidate.reason ?? '']),
    ...product.evidence.flatMap((evidence) => [
      evidence.summary,
      ...Object.values(evidence.extractedFields),
    ]),
  ].join(' ')
}

function canonicalCandidateValue(value) {
  return value
    .toLowerCase()
    .replace(/\bwi[\s-]?fi\b/g, 'wifi')
    .replace(/\b(\d+)\s*(gb|tb)\b/g, '$1$2')
    .replace(/\b(\d+(?:[.,]\d+)?)\s*p\b/g, '$1in')
    .replace(/\s+/g, '')
    .replace(/[^\p{Letter}\p{Number}.]/gu, '')
}

test('research job transitions from queued to running to succeeded and applies new evidence/candidates', () => {
  resetDemoState()
  importDemoProducts()
  const initialProduct = getStoredProduct('galaxy-a55')
  const initialEvidenceCount = initialProduct.evidence.length
  const initialCandidateCount = initialProduct.candidates.length

  const run = createMockResearchRun('galaxy-a55')
  assert.equal(run.status, 'QUEUED')
  assert.equal(getStoredProduct('galaxy-a55').listingStatus, 'RESEARCH_IN_PROGRESS')

  const queued = getResearchRun(run.id, new Date(Date.parse(run.createdAt) + 500).toISOString())
  assert.equal(queued.status, 'QUEUED')

  const running = getResearchRun(run.id, new Date(Date.parse(run.createdAt) + 1500).toISOString())
  assert.equal(running.status, 'RUNNING')
  assert.equal(getStoredProduct('galaxy-a55').evidence.length, initialEvidenceCount)

  const completed = getResearchRun(run.id, new Date(Date.parse(run.createdAt) + 6000).toISOString())
  assert.equal(completed.status, 'SUCCEEDED')
  const researchedProduct = getStoredProduct('galaxy-a55')
  assert.equal(researchedProduct.evidence.length >= initialEvidenceCount + 2, true)
  assert.equal(researchedProduct.candidates.length >= initialCandidateCount + 1, true)
  assert.equal(researchedProduct.candidates.every((candidate) => candidate.sourceEvidenceIds.length > 0), true)
  assert.equal(researchedProduct.evidence.every((evidence) => evidence.sourceUrl?.startsWith('https://')), true)
  assert.equal(researchedProduct.evidence.some((evidence) => evidence.sourceName === 'Mirakl imported data'), false)
  assert.equal(researchedProduct.evidence.every((evidence) => !/evidence for|candidate product-data/i.test(`${evidence.title} ${evidence.summary}`)), true)
  assert.equal(researchedProduct.evidence.every((evidence) => !/product information highlights/i.test(`${evidence.summary} ${Object.values(evidence.extractedFields).join(' ')}`)), true)
  assert.equal(researchedProduct.candidates.some((candidate) => candidate.fieldName === 'description'), false)
  assert.equal(researchedProduct.candidates.some((candidate) => candidate.fieldName === 'batteryCapacity' && candidate.candidateValue === '5000 mAh'), true)
  assert.equal(placeholderResearchPattern.test(researchText(researchedProduct)), false)
  assert.equal(Object.keys(researchedProduct.bestEvidenceByField).length >= 1, true)
})

test('freeclip research includes replacements for existing Mirakl values', () => {
  resetDemoState()
  importDemoProducts()

  const run = createMockResearchRun('freeclip-2')
  getResearchRun(run.id, new Date(Date.parse(run.createdAt) + 6000).toISOString())

  const product = getStoredProduct('freeclip-2')

  assert.equal(product.candidates.some((candidate) => candidate.fieldName === 'ean' && candidate.currentValue === null && candidate.candidateValue === '6942103169434'), true)
  assert.equal(product.candidates.some((candidate) => candidate.fieldName === 'connectivity' && candidate.currentValue === 'Bluetooth' && candidate.candidateValue === 'Bluetooth 6.0 / dual-device connection'), true)
  assert.equal(product.candidates.some((candidate) => candidate.fieldName === 'batteryLife' && candidate.currentValue === '9 hours standalone / 38 hours with case' && candidate.candidateValue === '9 h earbuds / 38 h with charging case'), true)
  assert.equal(product.candidates.some((candidate) => candidate.fieldName === 'description' && candidate.currentValue === null && candidate.candidateValue.includes('Auriculares true wireless')), true)
  assert.equal(product.candidates.some((candidate) => candidate.currentValue !== null && candidate.currentValue !== 'Missing'), true)
})

test('research evidence does not generate fake vendor descriptions for catalog products', () => {
  resetDemoState()
  importDemoProducts()

  const run = createMockResearchRun('catalog-item-3004083')
  getResearchRun(run.id, new Date(Date.parse(run.createdAt) + 6000).toISOString())

  const product = getStoredProduct('catalog-item-3004083')
  const descriptionEvidence = product.evidence
    .filter((evidence) => evidence.extractedFields.description)
    .map((evidence) => ({
      sourceName: evidence.sourceName,
      description: evidence.extractedFields.description,
    }))

  assert.equal(descriptionEvidence.length, 0)
  assert.equal(product.evidence.every((evidence) => !/product information highlights/i.test(`${evidence.summary} ${Object.values(evidence.extractedFields).join(' ')}`)), true)
  assert.equal(product.candidates.some((candidate) => candidate.fieldName === 'description'), false)
})

test('research supplies curated technical fields for catalog products without placeholder phrases', () => {
  resetDemoState()
  importDemoProducts()

  const run = createMockResearchRun('catalog-item-mkp000905189074')
  getResearchRun(run.id, new Date(Date.parse(run.createdAt) + 6000).toISOString())

  const product = getStoredProduct('catalog-item-mkp000905189074')
  const extractedFields = product.evidence.flatMap((evidence) => Object.keys(evidence.extractedFields))

  assert.equal(product.candidates.some((candidate) => candidate.fieldName === 'dimensions' && candidate.candidateValue === '272 x 116 x 13.9 mm'), true)
  assert.equal(product.candidates.some((candidate) => candidate.fieldName === 'storage' && candidate.candidateValue === '256 GB'), true)
  assert.equal(product.candidates.some((candidate) => candidate.fieldName === 'connectivity' && candidate.candidateValue.includes('Wi-Fi 6')), true)
  assert.equal(product.candidates.some((candidate) => candidate.fieldName === 'usbC' && candidate.candidateValue === 'USB-C'), true)
  assert.equal(product.candidates.some((candidate) => candidate.fieldName === 'weight' && candidate.candidateValue === '534 g'), true)
  assert.equal(extractedFields.includes('dimensions'), true)
  assert.equal(placeholderResearchPattern.test(researchText(product)), false)
})

test('redmi pad research returns good non-Mirakl candidate data', () => {
  resetDemoState()
  importDemoProducts()

  const run = createMockResearchRun('redmi-pad-pro')
  getResearchRun(run.id, new Date(Date.parse(run.createdAt) + 6000).toISOString())

  const product = getStoredProduct('redmi-pad-pro')
  const sourceNames = product.evidence.map((evidence) => evidence.sourceName)

  assert.equal(sourceNames.includes('Mirakl imported data'), false)
  assert.equal(product.candidates.some((candidate) => candidate.fieldName === 'batteryCapacity' && candidate.candidateValue === '10000 mAh'), true)
  assert.equal(product.candidates.some((candidate) => candidate.fieldName === 'stylusSupport' && candidate.candidateValue === 'Xiaomi Focus Pen compatible'), true)
  assert.equal(product.candidates.some((candidate) => candidate.fieldName === 'dimensions' && candidate.candidateValue === '280.0 x 181.85 x 7.52 mm'), true)
  assert.equal(product.candidates.every((candidate) => candidate.sourceEvidenceIds.length > 0), true)
  assert.equal(placeholderResearchPattern.test(researchText(product)), false)
})

test('re-running research replaces duplicate proposed candidates per attribute', () => {
  resetDemoState()
  importDemoProducts()

  const firstRun = createMockResearchRun('freeclip-2')
  getResearchRun(firstRun.id, new Date(Date.parse(firstRun.createdAt) + 6000).toISOString())
  const secondRun = createMockResearchRun('freeclip-2')
  getResearchRun(secondRun.id, new Date(Date.parse(secondRun.createdAt) + 6000).toISOString())

  const product = getStoredProduct('freeclip-2')
  const fields = product.candidates.map((candidate) => candidate.fieldName)
  const evidenceSources = product.evidence.map((evidence) => evidence.aggregatorId)

  assert.equal(fields.length, new Set(fields).size)
  assert.equal(evidenceSources.length, new Set(evidenceSources).size)
  assert.equal(product.candidates.filter((candidate) => candidate.fieldName === 'connectivity').length, 1)
})

test('research assigns each extracted field to one source instead of copying it across vendors', () => {
  resetDemoState()
  importDemoProducts()

  for (const product of listStoredProducts()) {
    const run = createMockResearchRun(product.id)
    getResearchRun(run.id, new Date(Date.parse(run.createdAt) + 6000).toISOString())
  }

  for (const product of listStoredProducts()) {
    const sourceByField = new Map()

    for (const evidence of product.evidence) {
      for (const [field, value] of Object.entries(evidence.extractedFields)) {
        assert.equal(
          sourceByField.has(field),
          false,
          `${product.id} copied ${field} from both ${sourceByField.get(field)?.sourceName} and ${evidence.sourceName}`,
        )
        sourceByField.set(field, { sourceName: evidence.sourceName, value })
      }
    }
  }
})

test('accepting a candidate refreshes export eligibility and listing status', () => {
  resetDemoState()
  importDemoProducts()
  const run = createMockResearchRun('galaxy-a55')
  getResearchRun(run.id, new Date(Date.parse(run.createdAt) + 6000).toISOString())
  const productWithCandidates = getStoredProduct('galaxy-a55')
  addReviewDecision(productWithCandidates.candidates[0].id, 'APPROVE', 'Verified against evidence')
  const preview = exportPreview('galaxy-a55')
  const product = getStoredProduct('galaxy-a55')

  assert.equal(product.listingStatus, 'EXPORT_READY')
  assert.equal(preview.rows.length >= 1, true)
})

test('research runs for every imported product without fabricating missing values', () => {
  resetDemoState()
  importDemoProducts()

  const importedProducts = listStoredProducts()
  assert.equal(importedProducts.length, 55)
  assert.equal(importedProducts.every((product) => product.candidates.length === 0 && product.evidence.length === 0), true)

  for (const product of importedProducts) {
    const run = createMockResearchRun(product.id)
    assert.ok(run)
    getResearchRun(run.id, new Date(Date.parse(run.createdAt) + 6000).toISOString())
  }

  const researchedProducts = listStoredProducts()
  assert.equal(researchedProducts.length, 55)
  assert.equal(researchedProducts.every((product) => product.evidence.length > 0), true)
  assert.equal(researchedProducts.some((product) => product.candidates.length > 0), true)
  assert.equal(researchedProducts.every((product) => product.evidence.every((evidence) => evidence.sourceName !== 'Mirakl imported data')), true)
  assert.equal(researchedProducts.every((product) => product.evidence.every((evidence) => evidence.sourceUrl?.startsWith('https://'))), true)
  assert.equal(researchedProducts.every((product) => product.candidates.every((candidate) => candidate.sourceEvidenceIds.length > 0)), true)
  assert.equal(researchedProducts.every((product) => !placeholderResearchPattern.test(researchText(product))), true)
})

test('research candidates are product-by-product meaningful and not Mirakl formatting echoes', () => {
  resetDemoState()
  importDemoProducts()

  for (const product of listStoredProducts()) {
    const run = createMockResearchRun(product.id)
    getResearchRun(run.id, new Date(Date.parse(run.createdAt) + 6000).toISOString())
  }

  for (const product of listStoredProducts()) {
    const evidenceById = new Map(product.evidence.map((evidence) => [evidence.id, evidence]))
    for (const candidate of product.candidates) {
      if (candidate.currentValue) {
        assert.notEqual(
          canonicalCandidateValue(candidate.currentValue),
          canonicalCandidateValue(candidate.candidateValue),
          `${product.id} has normalization-only candidate for ${candidate.fieldName}`,
        )
      }
      assert.equal(
        candidate.sourceEvidenceIds.some((evidenceId) => evidenceById.get(evidenceId)?.sourceName === 'MediaMarkt product page'),
        false,
        `${product.id} candidate ${candidate.fieldName} is sourced from baseline retailer data`,
      )
    }
  }
})

test('sync applies approved candidates back to the baseline and refreshes quality score', () => {
  resetDemoState()
  importDemoProducts()
  const initialProduct = getStoredProduct('catalog-item-3240734')
  const initialScore = initialProduct.qualityScore

  const run = createMockResearchRun('catalog-item-3240734')
  getResearchRun(run.id, new Date(Date.parse(run.createdAt) + 6000).toISOString())

  const researchedProduct = getStoredProduct('catalog-item-3240734')
  assert.equal(researchedProduct.candidates.some((candidate) => candidate.fieldName === 'ram' && candidate.candidateValue === '16 GB'), true)

  for (const candidate of researchedProduct.candidates) {
    addReviewDecision(candidate.id, 'APPROVE', 'bulk approval')
  }

  const approvedProduct = getStoredProduct('catalog-item-3240734')
  assert.equal(approvedProduct.qualityScore > initialScore, true)
  assert.equal(approvedProduct.candidates.some((candidate) => candidate.status === 'accepted'), true)

  const syncResult = syncProductWithMirakl('catalog-item-3240734')
  const syncedProduct = getStoredProduct('catalog-item-3240734')

  assert.equal(syncResult.syncedFields.includes('ram'), true)
  assert.equal(syncedProduct.baselineAttributes.ram, '16 GB')
  assert.equal(syncedProduct.candidates.some((candidate) => candidate.status === 'accepted'), false)
  assert.equal(syncedProduct.qualityScore > initialScore, true)
})

test('freeclip approved candidates sync into baseline and lift quality score', () => {
  resetDemoState()
  importDemoProducts()
  const initialProduct = getStoredProduct('freeclip-2')
  const initialScore = initialProduct.qualityScore

  const run = createMockResearchRun('freeclip-2')
  getResearchRun(run.id, new Date(Date.parse(run.createdAt) + 6000).toISOString())

  const researchedProduct = getStoredProduct('freeclip-2')
  for (const candidate of researchedProduct.candidates) {
    addReviewDecision(candidate.id, 'APPROVE', 'bulk approval')
  }

  const approvedProduct = getStoredProduct('freeclip-2')
  assert.equal(approvedProduct.candidates.every((candidate) => candidate.status === 'accepted'), true)
  assert.equal(approvedProduct.qualityScore > initialScore, true)

  const syncResult = syncProductWithMirakl('freeclip-2')
  const syncedProduct = getStoredProduct('freeclip-2')

  assert.equal(syncResult.syncedFields.includes('ean'), true)
  assert.equal(syncedProduct.baselineAttributes.ean, '6942103169434')
  assert.equal(syncedProduct.candidates.length, 0)
  assert.equal(syncedProduct.qualityScore > initialScore, true)
})


test('product detail research action is presented as an agent run', () => {
  const source = readFileSync('components/product/research-button.tsx', 'utf8')

  assert.equal(source.includes('BotIcon'), true)
  assert.equal(source.includes('RefreshCwIcon'), true)
  assert.equal(source.includes('animate-spin'), true)
  assert.equal(source.includes('Run Research Agent'), true)
  assert.equal(readFileSync('lib/mock-timing.ts', 'utf8').includes('DEFAULT_MOCK_RESEARCH_AGENT_SECONDS = 5'), true)
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
