import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const { getFieldLabel } = await import('../lib/demo-contract.ts')
const { listProducts, listSchemas } = await import('../server/data.ts')

test('schemas page source advertises completeness sections', async () => {
  const source = readFileSync('app/schemas/page.tsx', 'utf8')
  const schemas = await listSchemas()

  assert.equal(source.includes('Schema rules'), true)
  assert.equal(source.includes('Completeness rules at a glance'), true)
  assert.equal(source.includes('Required to exit review'), true)
  assert.equal(source.includes('Recommended coverage'), true)
  assert.equal(source.includes('Warning pressure'), true)
  assert.equal(source.includes('Scoring guidance'), true)
  assert.equal(source.includes('Products mapped to this schema'), true)
  assert.equal(schemas.length >= 5, true)
})

test('schema data exposes category-specific completeness rules and mapped products', async () => {
  const [schemas, products] = await Promise.all([listSchemas(), listProducts()])
  const headphones = schemas.find((schema) => schema.slug === 'headphones-earbuds')
  const laptops = schemas.find((schema) => schema.slug === 'laptops')

  assert.ok(headphones)
  assert.ok(laptops)
  assert.deepEqual(headphones.linkedCategories, ['Audio', 'Wearable audio'])
  assert.deepEqual(
    headphones.requiredAttributes.slice(0, 4).map((field) => getFieldLabel(field)),
    ['Brand', 'Product name', 'EAN', 'Connectivity'],
  )
  assert.deepEqual(
    headphones.recommendedAttributes.slice(0, 3).map((field) => getFieldLabel(field)),
    ['Bluetooth version', 'USB-C', 'Microphone'],
  )

  const mappedProductTitles = products.filter((product) => product.schemaId === headphones.id).map((product) => product.title)
  assert.deepEqual(mappedProductTitles, ['Huawei FreeClip 2', 'Sony WH-1000XM5'])
  assert.equal(products.some((product) => product.schemaId === laptops.id), true)
})
