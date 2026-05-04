import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const { heroProduct, products } = await import('../lib/fixtures.ts')
const { filterProducts, sortProducts } = await import('../lib/triage.ts')

test('filterProducts narrows the dashboard to the expected slices', () => {
  assert.equal(filterProducts(products, 'all').length, products.length)
  assert.deepEqual(filterProducts(products, 'hero-product').map((product) => product.id), [heroProduct.id])
  assert.equal(filterProducts(products, 'with-candidates').length, 0)
  assert.equal(filterProducts(products, 'needs-enrichment').every((product) => product.listingStatus !== 'READY_FOR_REVIEW'), true)
})

test('sortProducts orders by the selected triage priority', () => {
  const byScore = sortProducts(products, 'score-asc')
  assert.equal(byScore[0].id, heroProduct.id)

  const byWarnings = sortProducts(products, 'warnings-desc')
  assert.equal(byWarnings[0].warnings.length >= byWarnings.at(-1).warnings.length, true)

  const byCategory = sortProducts(products, 'category-asc')
  assert.deepEqual(byCategory.map((product) => product.categoryPath.join('/')).slice(0, 2), [
    'Audio/Headphones & Earbuds',
    'Audio/Headphones & Earbuds',
  ])
})

test('empty triage state offers direct catalog import', () => {
  const source = readFileSync('components/product/triage-dashboard.tsx', 'utf8')

  assert.equal(source.includes('No products imported yet'), true)
  assert.equal(source.includes('Import the electronics catalog'), true)
  assert.equal(source.includes('actions="import"'), true)
})

test('triage sort controls use lucide icons for the priority options', () => {
  const source = readFileSync('components/product/triage-dashboard.tsx', 'utf8')

  assert.equal(source.includes('ArrowDownWideNarrowIcon'), true)
  assert.equal(source.includes('TriangleAlertIcon'), true)
  assert.equal(source.includes('FolderTreeIcon'), true)
  assert.equal(source.includes('BotIcon'), true)
  assert.equal(source.includes('Lowest score'), true)
  assert.equal(source.includes('Most warnings'), true)
  assert.equal(source.includes('Category'), true)
})


test('triage research agent flow exposes bulk selection and queue controls', () => {
  const source = readFileSync('components/product/triage-dashboard.tsx', 'utf8')

  assert.equal(source.includes('Run Research Agent'), true)
  assert.equal(source.includes('Queue Research for'), true)
  assert.equal(source.includes('Cancel'), true)
  assert.equal(source.includes('selectionMode && <TableHead className="w-10">Select</TableHead>'), true)
  assert.equal(source.includes('type="checkbox"'), true)
  assert.equal(source.includes('/research-jobs'), true)
})


test('product triage uses the page subtitle instead of a duplicate panel title', () => {
  const pageSource = readFileSync('app/page.tsx', 'utf8')
  const dashboardSource = readFileSync('components/product/triage-dashboard.tsx', 'utf8')

  assert.equal(pageSource.includes('The table is the workspace now: filter, sort, scan the warnings'), true)
  assert.equal(dashboardSource.includes('Catalog triage queue'), false)
  assert.equal(dashboardSource.includes('<Panel>'), true)
})

test('research agent controls sit outside the table card and above sort controls', () => {
  const source = readFileSync('components/product/triage-dashboard.tsx', 'utf8')

  assert.equal(source.indexOf('Run Research Agent') < source.indexOf('<Panel>'), true)
  assert.equal(source.indexOf('Run Research Agent') < source.indexOf('sortOptions.map'), true)
  assert.equal(source.indexOf('Cancel') < source.indexOf('sortOptions.map'), true)
  assert.equal(source.includes('bg-blue-600'), true)
  assert.equal(source.includes('size="lg"'), true)
})
