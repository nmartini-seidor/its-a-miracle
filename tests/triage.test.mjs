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

test('empty triage state offers direct catalog import only when no products exist', () => {
  const source = readFileSync('components/product/triage-dashboard.tsx', 'utf8')

  assert.equal(source.includes('hasProducts ? ('), true)
  assert.equal(source.includes('No products match this filter'), true)
  assert.equal(source.includes('Change the filter or run research to create candidates'), true)
  assert.equal(source.includes('No products imported yet'), true)
  assert.equal(source.includes('Import the Product catalog'), true)
  assert.equal(source.includes('actions="import"'), true)
  assert.equal(source.indexOf('No products match this filter') < source.indexOf('No products imported yet'), true)
})

test('triage sort controls use lucide icons for the priority options', () => {
  const source = readFileSync('components/product/triage-dashboard.tsx', 'utf8')

  assert.equal(source.includes('BoxesIcon'), true)
  assert.equal(source.includes('ListChecksIcon'), true)
  assert.equal(source.includes('StarIcon'), true)
  assert.equal(source.includes('All products", Icon'), true)
  assert.equal(source.includes('Needs enrichment", Icon'), true)
  assert.equal(source.includes('Has candidates", Icon'), true)
  assert.equal(source.includes('Hero product", Icon'), true)
  assert.equal(source.includes('filter.Icon'), true)
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
  assert.equal(dashboardSource.includes('<Panel bodyClassName="p-0 sm:p-0">'), true)
})

test('research agent controls sit outside the table card and above sort controls', () => {
  const source = readFileSync('components/product/triage-dashboard.tsx', 'utf8')

  assert.equal(source.indexOf('Run Research Agent') < source.indexOf('<Panel bodyClassName="p-0 sm:p-0">'), true)
  assert.equal(source.indexOf('Run Research Agent') < source.indexOf('sortOptions.map'), true)
  assert.equal(source.indexOf('Cancel') < source.indexOf('sortOptions.map'), true)
  assert.equal(source.includes('rounded-xl bg-gradient-to-r from-fuchsia-500 via-violet-500 to-sky-400'), true)
  assert.equal(source.includes('research-flight-orb'), true)
  assert.equal(source.includes('size="lg"'), true)
})

test('product filters and sorting controls sit outside the flush table panel', () => {
  const source = readFileSync('components/product/triage-dashboard.tsx', 'utf8')

  assert.equal(source.indexOf('filterOptions.map') < source.indexOf('<Panel bodyClassName="p-0 sm:p-0">'), true)
  assert.equal(source.indexOf('sortOptions.map') < source.indexOf('<Panel bodyClassName="p-0 sm:p-0">'), true)
  assert.equal(source.includes('<Table surface="flush">'), true)
})

test('empty product state disables research and table controls with a broken-catalog icon', () => {
  const source = readFileSync('components/product/triage-dashboard.tsx', 'utf8')

  assert.equal(source.includes('PackageXIcon'), true)
  assert.equal(source.includes('disabled={!hasProducts || queuePending || researchPaused || (selectionMode && selectedCount === 0)}'), true)
  assert.equal(source.includes('selectionMode && !queuePending'), true)
  assert.equal(source.match(/disabled={!hasProducts}/g)?.length, 2)
  assert.equal(source.includes('max-w-none whitespace-nowrap text-sm'), true)
})
