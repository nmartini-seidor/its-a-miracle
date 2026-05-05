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
  assert.equal(brandRow?.baselineNeedsAttention, true)
  assert.equal(descriptionRow?.baselineMissing, false)
  assert.equal(descriptionRow?.hasCandidate, false)
  assert.equal(descriptionRow?.baselineNeedsAttention, true)
  assert.equal(compatibilityRow?.evidenceValue, null)
  assert.equal(compatibilityRow?.candidateValue, null)
  assert.equal(compatibilityRow?.hasCandidate, false)
  assert.equal(noiseReductionRow?.evidenceValue, null)
  assert.equal(noiseReductionRow?.candidateValue, null)
  assert.equal(noiseReductionRow?.hasCandidate, false)
})

test('product comparison table is flush inside its panel instead of a nested card', async () => {
  const { readFile } = await import('node:fs/promises')
  const productPageSource = await readFile(new URL('../app/products/[id]/page.tsx', import.meta.url), 'utf8')
  const tableSource = await readFile(new URL('../components/ui/table.tsx', import.meta.url), 'utf8')

  assert.match(tableSource, /surface\?: "card" \| "flush"/)
  assert.match(tableSource, /surface = "card"/)
  assert.match(productPageSource, /Product data comparison" description="Review Mirakl values against the candidate value and supporting evidence sources\." headerClassName="bg-white" bodyClassName="p-0 sm:p-0"/)
  assert.match(productPageSource, /<Table surface="flush">/)
})

test('hero product baseline includes product name and product detail uses icon tabs with export action', async () => {
  const { readFile } = await import('node:fs/promises')
  const productPageSource = await readFile(new URL('../app/products/[id]/page.tsx', import.meta.url), 'utf8')
  const exportButtonSource = await readFile(new URL('../components/product/export-payload-panel.tsx', import.meta.url), 'utf8')
  const reviewRows = buildReviewFieldRows(heroProduct, heroSchema)
  const productNameRow = reviewRows.find((row) => row.field === 'productName')

  assert.equal(productNameRow?.baselineValue, 'Huawei FreeClip 2')
  assert.equal(productNameRow?.baselineMissing, false)
  assert.equal(productPageSource.includes('GitCompareArrowsIcon'), true)
  assert.equal(productPageSource.includes('rounded-lg border border-slate-200 bg-slate-100 p-1'), true)
  assert.equal(productPageSource.includes('data-[state=active]:bg-white'), true)
  assert.equal(productPageSource.includes('ListChecksIcon'), true)
  assert.equal(productPageSource.includes('FileSearchIcon'), true)
  assert.equal(productPageSource.includes('value="export"'), false)
  assert.equal(productPageSource.includes('Candidate decisions'), false)
  assert.equal(productPageSource.includes('Evidence sources'), false)
  assert.equal(productPageSource.includes('formatEnumLabel(candidate.status)'), false)
  assert.equal(productPageSource.includes('confidenceClass(candidate.confidence)'), true)
  assert.equal(productPageSource.includes('confidenceClass(evidence.confidence)'), true)
  assert.equal(productPageSource.includes('status={candidate.status}'), true)
  assert.equal(productPageSource.includes('SeoDescriptionButton'), true)
  assert.equal(productPageSource.includes('row.field === "description"'), true)
  assert.equal(exportButtonSource.includes('download = `${productId}-mirakl-export.json`'), true)
  assert.equal(exportButtonSource.includes('Export file'), false)
  assert.equal(exportButtonSource.includes('Export'), true)
  assert.equal(exportButtonSource.includes('Sync'), true)
  assert.equal(exportButtonSource.includes('syncWithMirakl'), true)
})


test('candidate action rows only expose accept and reject decisions', async () => {
  const { readFile } = await import('node:fs/promises')
  const candidateActionsSource = await readFile(new URL('../components/product/candidate-actions.tsx', import.meta.url), 'utf8')

  assert.equal(candidateActionsSource.includes('More evidence'), false)
  assert.equal(candidateActionsSource.includes('REQUEST_MORE_EVIDENCE'), false)
  assert.equal(candidateActionsSource.includes('Accept'), false)
  assert.equal(candidateActionsSource.includes('Approve'), true)
  assert.equal(candidateActionsSource.includes('Approved'), true)
  assert.equal(candidateActionsSource.includes('Rejected'), true)
  assert.equal(candidateActionsSource.includes('Reject'), true)
})
