import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const { getDemoSettings, listAggregators, listSchemas } = await import('../server/data.ts')

test('settings snapshot stays demo-only and maps to enabled aggregator records', async () => {
  const settings = await getDemoSettings()
  const aggregators = await listAggregators()

  assert.equal(settings.environment, 'demo')
  assert.equal(settings.fakeResearchMode, true)
  assert.equal(settings.autoAssignSchemaByCategory, true)
  assert.equal(settings.defaultCandidateConfidence, 'medium')
  assert.equal(settings.enabledAggregatorIds.length > 0, true)

  const enabledAggregatorIds = aggregators.filter((aggregator) => aggregator.enabled).map((aggregator) => aggregator.id)
  assert.deepEqual(settings.enabledAggregatorIds, enabledAggregatorIds)
})

test('settings page source advertises preview-safe configuration sections', async () => {
  const source = readFileSync('app/settings/page.tsx', 'utf8')
  const schemas = await listSchemas()

  assert.equal(source.includes('Read-only demo configuration'), true)
  assert.equal(source.includes('Mirakl workspace mode'), true)
  assert.equal(source.includes('Research orchestration defaults'), true)
  assert.equal(source.includes('Schema governance defaults'), true)
  assert.equal(source.includes('Aggregator trust policy'), true)
  assert.equal(source.includes('No live writes'), true)
  assert.equal(schemas.length >= 5, true)
})
