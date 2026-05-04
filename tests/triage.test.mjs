import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const { heroProduct, products } = await import('../lib/fixtures.ts')
const { filterProducts, sortProducts } = await import('../lib/triage.ts')

test('filterProducts narrows the dashboard to the expected slices', () => {
  assert.equal(filterProducts(products, 'all').length, products.length)
  assert.deepEqual(filterProducts(products, 'hero-product').map((product) => product.id), [heroProduct.id])
  assert.equal(filterProducts(products, 'with-candidates').every((product) => product.candidates.length > 0), true)
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
  assert.equal(source.includes('Import the Orange electronics catalog'), true)
  assert.equal(source.includes('actions="import"'), true)
})
