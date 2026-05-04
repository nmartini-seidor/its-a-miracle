import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const { getDemoSettings, listAggregators, listSchemas } = await import('../server/data.ts')
const { resetDemoState, updateStoredSettings } = await import('../server/store.ts')
const { demoSettings } = await import('../lib/fixtures.ts')

test('settings snapshot stays local-only and maps to enabled aggregator records', async () => {
  updateStoredSettings(demoSettings)
  resetDemoState()
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

test('settings can be changed and reset keeps configuration while clearing catalog state', async () => {
  updateStoredSettings(demoSettings)
  resetDemoState()
  const saved = updateStoredSettings({
    defaultResearchDelaySeconds: 45,
    maxEvidencePerProduct: 6,
    defaultCandidateConfidence: 'high',
    enabledAggregatorIds: ['official-manufacturer', 'source-catalog'],
  })

  assert.equal(saved.defaultResearchDelaySeconds, 45)
  assert.equal(saved.maxEvidencePerProduct, 6)
  assert.equal(saved.defaultCandidateConfidence, 'high')
  assert.deepEqual(saved.enabledAggregatorIds, ['official-manufacturer', 'source-catalog'])

  resetDemoState()
  const afterReset = await getDemoSettings()
  assert.equal(afterReset.defaultResearchDelaySeconds, 45)
  assert.equal(afterReset.maxEvidencePerProduct, 6)
  assert.equal(afterReset.defaultCandidateConfidence, 'high')
  assert.deepEqual(afterReset.enabledAggregatorIds, ['official-manufacturer', 'source-catalog'])

  updateStoredSettings(demoSettings)
})

test('settings page source advertises tabbed configurable sections', async () => {
  const pageSource = readFileSync('app/settings/page.tsx', 'utf8')
  const tabsSource = readFileSync('components/settings/settings-tabs.tsx', 'utf8')
  const schemas = await listSchemas()

  assert.equal(pageSource.includes('Workspace configuration'), true)
  assert.equal(tabsSource.includes('TabsTrigger'), true)
  assert.equal(tabsSource.includes('Save changes'), true)
  assert.equal(tabsSource.includes('Local configuration'), false)
  assert.equal(tabsSource.includes('evidence sources enabled'), false)
  assert.equal(tabsSource.includes('schema families</Badge>'), false)
  assert.equal(tabsSource.includes('whitespace-normal'), true)
  assert.equal(tabsSource.includes('Workspace'), true)
  assert.equal(tabsSource.includes('Research defaults'), true)
  assert.equal(tabsSource.includes('Schema matching'), true)
  assert.equal(tabsSource.includes('Evidence sources'), true)
  assert.equal(tabsSource.includes('Export governance'), true)
  assert.equal((await getDemoSettings()).miraklBaseUrl, 'https://seidor-dev.mirakl.net')
  assert.equal(schemas.length >= 5, true)
})
