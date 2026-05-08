import assert from 'node:assert/strict'
import { test } from 'node:test'

const { heroProduct, products, schemas } = await import('../lib/fixtures.ts')
const { buildReviewFieldRows, getCandidateByField, orderReviewFields } = await import('../lib/product-review.ts')

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
  assert.equal(descriptionRow?.baselineMissing, true)
  assert.equal(descriptionRow?.hasCandidate, false)
  assert.equal(descriptionRow?.baselineNeedsAttention, true)
  assert.equal(compatibilityRow?.evidenceValue, null)
  assert.equal(compatibilityRow?.candidateValue, null)
  assert.equal(compatibilityRow?.hasCandidate, false)
  assert.equal(noiseReductionRow?.evidenceValue, null)
  assert.equal(noiseReductionRow?.candidateValue, null)
  assert.equal(noiseReductionRow?.hasCandidate, false)
})

test('accepted review candidates are marked on the comparison row', () => {
  const product = structuredClone(heroProduct)
  product.candidates.push({
    id: 'cand-description-accepted',
    productId: product.id,
    fieldName: 'description',
    currentValue: product.baselineAttributes.description,
    candidateValue: 'Descripción SEO aprobada para Mirakl.',
    confidence: 'medium',
    status: 'accepted',
    sourceEvidenceIds: [],
  })

  const reviewRows = buildReviewFieldRows(product, heroSchema)
  const descriptionRow = reviewRows.find((row) => row.field === 'description')

  assert.equal(descriptionRow?.candidateValue, 'Descripción SEO aprobada para Mirakl.')
  assert.equal(descriptionRow?.candidateStatus, 'accepted')
  assert.equal(descriptionRow?.hasCandidate, true)
  assert.equal(descriptionRow?.baselineValue, 'Descripción SEO aprobada para Mirakl.')
  assert.equal(descriptionRow?.baselineProjected, true)
  assert.equal(descriptionRow?.baselineMissing, false)
  assert.equal(descriptionRow?.baselineNeedsAttention, false)
})

test('accepted candidates project over existing Mirakl values while staying approved', () => {
  const product = structuredClone(heroProduct)
  product.candidates.push({
    id: 'cand-product-name-accepted',
    productId: product.id,
    fieldName: 'productName',
    currentValue: product.baselineAttributes.productName,
    candidateValue: 'Huawei FreeClip 2 Open Earbuds',
    confidence: 'high',
    status: 'accepted',
    sourceEvidenceIds: [],
  })

  const reviewRows = buildReviewFieldRows(product, heroSchema)
  const productNameRow = reviewRows.find((row) => row.field === 'productName')

  assert.equal(productNameRow?.baselineValue, 'Huawei FreeClip 2 Open Earbuds')
  assert.equal(productNameRow?.candidateValue, 'Huawei FreeClip 2 Open Earbuds')
  assert.equal(productNameRow?.candidateStatus, 'accepted')
  assert.equal(productNameRow?.baselineProjected, true)
})

test('description attention only appears for actual storefront-noise descriptions', () => {
  const nintendoBundle = products.find((product) => product.id === 'catalog-item-mkp000906664010')
  const samsungLaptop = products.find((product) => product.id === 'catalog-item-3240734')
  const gamingSchema = schemas.find((schema) => schema.id === nintendoBundle?.schemaId) ?? null
  const laptopSchema = schemas.find((schema) => schema.id === samsungLaptop?.schemaId) ?? null

  const nintendoDescription = buildReviewFieldRows(nintendoBundle, gamingSchema).find((row) => row.field === 'description')
  const samsungDescription = buildReviewFieldRows(samsungLaptop, laptopSchema).find((row) => row.field === 'description')

  assert.equal(nintendoDescription?.baselineNeedsAttention, true)
  assert.equal(nintendoDescription?.baselineWarnings.some((warning) => /descripci/i.test(warning)), true)
  assert.equal(samsungDescription?.baselineNeedsAttention, false)
  assert.equal(samsungDescription?.baselineWarnings.length, 0)
})

test('review candidates collapse duplicate fields to the strongest current row', () => {
  const product = structuredClone(heroProduct)
  product.candidates.push(
    {
      id: 'cand-connectivity-old',
      productId: product.id,
      fieldName: 'connectivity',
      currentValue: 'Bluetooth',
      candidateValue: 'Bluetooth 5.3',
      confidence: 'medium',
      status: 'proposed',
      sourceEvidenceIds: ['ev-old'],
    },
    {
      id: 'cand-connectivity-new',
      productId: product.id,
      fieldName: 'connectivity',
      currentValue: 'Bluetooth',
      candidateValue: 'Bluetooth 6.0 / dual-device connection',
      confidence: 'high',
      status: 'proposed',
      sourceEvidenceIds: ['ev-new'],
    },
  )

  const candidateByField = getCandidateByField(product)

  assert.equal(candidateByField.get('connectivity')?.id, 'cand-connectivity-new')
  assert.equal([...candidateByField.keys()].filter((field) => field === 'connectivity').length, 1)
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
  const syncButtonSource = await readFile(new URL('../components/product/sync-mirakl-button.tsx', import.meta.url), 'utf8')
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
  assert.equal(productPageSource.includes('confidenceClass(candidate.confidence)'), false)
  assert.equal(productPageSource.includes('confidenceClass(evidence.confidence)'), true)
  assert.equal(productPageSource.includes('status={candidate.status}'), true)
  assert.equal(productPageSource.includes('displayCandidates.map'), true)
  assert.equal(productPageSource.includes('getCandidateByField(product)'), true)
  assert.equal(productPageSource.includes('latestEvidenceBySource(product.evidence)'), true)
  assert.equal(productPageSource.includes('SeoDescriptionButton'), false)
  assert.equal(productPageSource.includes('row.field === "description"'), false)
  assert.equal(productPageSource.includes('CheckCircle2Icon'), true)
  assert.equal(productPageSource.includes('row.candidateStatus === "accepted"'), true)
  assert.equal(productPageSource.includes('row.baselineProjected'), true)
  assert.equal(productPageSource.includes('Approved Mirakl value'), true)
  assert.equal(productPageSource.includes('candidate.status === "accepted"'), true)
  assert.equal(productPageSource.includes('>MIRAKL<'), true)
  assert.equal(productPageSource.includes('attentionRows.length'), true)
  assert.equal(productPageSource.includes('label: "Quality"'), true)
  assert.equal(productPageSource.includes('accessory: acceptedCandidateIds.length > 0'), true)
  assert.equal(productPageSource.includes('Sync!'), false)
  assert.equal(productPageSource.includes('animate-pulse'), true)
  assert.equal(productPageSource.includes('AI translation'), true)
  assert.equal(productPageSource.includes('isAiTranslation(row.candidateReason)'), true)
  assert.equal(productPageSource.includes('target="_blank"'), true)
  assert.equal(productPageSource.includes('rel="noreferrer"'), true)
  assert.equal(productPageSource.includes('evidence.sourceName'), true)
  assert.equal(productPageSource.includes('{evidence.title}'), false)
  assert.equal(exportButtonSource.includes('download = `${productId}-mirakl-export.json`'), true)
  assert.equal(exportButtonSource.includes('Export file'), false)
  assert.equal(exportButtonSource.includes('Export'), true)
  assert.equal(exportButtonSource.includes('Approve ALL'), true)
  assert.equal(exportButtonSource.includes('proposedCandidateIds'), true)
  assert.equal(exportButtonSource.includes('acceptedCandidateIds.length === 0'), true)
  assert.equal(exportButtonSource.includes('proposedCandidateIds.length === 0'), true)
  assert.equal(exportButtonSource.includes('syncWithMirakl'), false)
  assert.equal(productPageSource.includes('SyncMiraklButton'), true)
  assert.equal(productPageSource.includes('canSync={acceptedCandidateIds.length > 0}'), true)
  assert.equal(syncButtonSource.includes('Sync with Mirakl'), true)
  assert.equal(syncButtonSource.includes('/sync'), true)
  assert.equal(syncButtonSource.includes('!canSync'), true)
  assert.equal(syncButtonSource.includes('bg-blue-600'), true)
  assert.equal(syncButtonSource.includes('hover:bg-blue-700'), true)
})


test('candidate action rows only expose accept and reject decisions', async () => {
  const { readFile } = await import('node:fs/promises')
  const candidateActionsSource = await readFile(new URL('../components/product/candidate-actions.tsx', import.meta.url), 'utf8')

  assert.equal(candidateActionsSource.includes('useEffect'), true)
  assert.equal(candidateActionsSource.includes('setStatus(initialStatus)'), true)
  assert.equal(candidateActionsSource.includes('More evidence'), false)
  assert.equal(candidateActionsSource.includes('REQUEST_MORE_EVIDENCE'), false)
  assert.equal(candidateActionsSource.includes('Accept'), false)
  assert.equal(candidateActionsSource.includes('Approve'), true)
  assert.equal(candidateActionsSource.includes('Approved'), true)
  assert.equal(candidateActionsSource.includes('Rejected'), true)
  assert.equal(candidateActionsSource.includes('Reject'), true)
})
