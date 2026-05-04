import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { test } from 'node:test'

const { getFieldLabel } = await import('../lib/demo-contract.ts')
const { listProducts, listSchemas } = await import('../server/data.ts')
const { updateStoredProductSchema, updateStoredSchema } = await import('../server/store.ts')
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

test('catalog baseline table exposes flexible in-row schema assignment', async () => {
  const catalogSource = readFileSync('app/catalog/page.tsx', 'utf8')
  const selectSource = readFileSync('components/catalog-schema-select.tsx', 'utf8')
  const routeSource = readFileSync('app/api/products/[id]/schema/route.ts', 'utf8')
  const products = await listProducts()
  const product = products.find((item) => item.id === 'freeclip-2') ?? products[0]
  assert.ok(product)
  const originalSchemaId = product.schemaId
  const nextSchema = baseSchemas.find((schema) => schema.id !== originalSchemaId)
  assert.ok(nextSchema)

  const updated = updateStoredProductSchema(baseSchemas, product.id, nextSchema.id)
  assert.equal(updated?.schemaId, nextSchema.id)
  assert.equal((await listProducts()).find((item) => item.id === product.id)?.schemaId, nextSchema.id)

  updateStoredProductSchema(baseSchemas, product.id, originalSchemaId)

  assert.equal(catalogSource.includes('CatalogSchemaSelect'), true)
  assert.equal(catalogSource.includes('listSchemas'), true)
  assert.equal(selectSource.includes('<select'), true)
  assert.equal(selectSource.includes('Schema assignment'), true)
  assert.equal(selectSource.includes('`/api/products/${productId}/schema`'), true)
  assert.equal(routeSource.includes('updateStoredProductSchema'), true)
})

test('catalog and schemas overview tables are flush inside their panels', () => {
  const catalogSource = readFileSync('app/catalog/page.tsx', 'utf8')
  const schemasSource = readFileSync('app/schemas/page.tsx', 'utf8')

  assert.equal(catalogSource.includes('headerClassName="bg-white" bodyClassName="p-0 sm:p-0"'), true)
  assert.equal(catalogSource.includes('<Table surface="flush">'), true)
  assert.equal(schemasSource.includes('headerClassName="bg-white" bodyClassName="p-0 sm:p-0"'), true)
  assert.equal(schemasSource.includes('<Table surface="flush">'), true)
})
