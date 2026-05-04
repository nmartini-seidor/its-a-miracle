import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { test } from 'node:test'

const { getFieldLabel } = await import('../lib/demo-contract.ts')
const { listProducts, listSchemas } = await import('../server/data.ts')
const { updateStoredSchema } = await import('../server/store.ts')
const { schemas: baseSchemas } = await import('../lib/fixtures.ts')

test('schemas overview stays table-first and links to per-schema configuration pages', async () => {
  const source = readFileSync('app/schemas/page.tsx', 'utf8')
  const detailSource = readFileSync('app/schemas/[slug]/page.tsx', 'utf8')
  const formSource = readFileSync('components/schema/schema-configuration-form.tsx', 'utf8')
  const schemas = await listSchemas()

  assert.equal(source.includes('Schema configuration'), true)
  assert.equal(source.includes('Schema families'), true)
  assert.equal(source.includes('Configure'), true)
  assert.equal(source.includes('href={`/schemas/${schema.slug}`}'), true)
  assert.equal(source.includes('grid gap-6 xl:grid-cols-2'), false)
  assert.equal(detailSource.includes('SchemaConfigurationForm'), true)
  assert.equal(formSource.includes('Save schema'), true)
  assert.equal(formSource.includes('Required attributes'), true)
  assert.equal(formSource.includes('Recommended attributes'), true)
  assert.equal(existsSync('app/schemas/[slug]/page.tsx'), true)
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

test('schema configuration updates persist in local workspace state', async () => {
  const base = baseSchemas.find((schema) => schema.slug === 'headphones-earbuds')
  assert.ok(base)

  const updated = updateStoredSchema(baseSchemas, base.slug, {
    ...base,
    name: 'Headphones configuration test',
    linkedCategories: ['Audio test'],
  })

  assert.equal(updated?.name, 'Headphones configuration test')
  assert.equal((await listSchemas()).find((schema) => schema.slug === base.slug)?.name, 'Headphones configuration test')

  updateStoredSchema(baseSchemas, base.slug, base)
})
