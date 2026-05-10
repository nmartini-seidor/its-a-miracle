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
    enabledAggregatorIds: ['official-manufacturer', 'apple-official'],
  })

  assert.equal(saved.defaultResearchDelaySeconds, 45)
  assert.equal(saved.maxEvidencePerProduct, 6)
  assert.equal(saved.defaultCandidateConfidence, 'high')
  assert.deepEqual(saved.enabledAggregatorIds, ['official-manufacturer', 'apple-official'])

  resetDemoState()
  const afterReset = await getDemoSettings()
  assert.equal(afterReset.defaultResearchDelaySeconds, 45)
  assert.equal(afterReset.maxEvidencePerProduct, 6)
  assert.equal(afterReset.defaultCandidateConfidence, 'high')
  assert.deepEqual(afterReset.enabledAggregatorIds, ['official-manufacturer', 'apple-official'])

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
  assert.equal(tabsSource.includes('whitespace-normal'), false)
  assert.equal(tabsSource.includes('hidden max-w-full'), false)
  assert.equal(tabsSource.includes('Changes are saved locally'), false)
  assert.equal(tabsSource.includes('currentTab.description'), true)
  assert.equal(tabsSource.includes('Workspace'), true)
  assert.equal(tabsSource.includes('Operator API key'), false)
  assert.equal(tabsSource.includes('Operator API credential used by the server for Mirakl catalog and product workflow requests.'), false)
  assert.equal(tabsSource.includes('credential placeholder'), false)
  assert.equal(tabsSource.includes('value="************" readOnly'), false)
  assert.equal(tabsSource.includes('label="Mirakl base URL"'), false)
  assert.equal(tabsSource.includes('Research'), true)
  assert.equal(tabsSource.includes('Schemas'), true)
  assert.equal(tabsSource.includes('Evidence'), true)
  assert.equal(tabsSource.includes('Export'), true)
  assert.equal(tabsSource.includes('Integrations'), true)
  assert.equal(tabsSource.indexOf('value: "integrations"') < tabsSource.indexOf('value: "workspace"'), true)
  assert.equal(tabsSource.includes('useState("integrations")'), true)
  assert.equal(tabsSource.includes('MIRAKL connection'), true)
  assert.equal(tabsSource.includes('/api/integrations/mirakl/connectivity'), true)
  assert.equal(tabsSource.includes('/logos/mirakl.svg'), true)
  assert.equal(tabsSource.includes('/logos/mirakl-config.png'), true)
  assert.equal(tabsSource.includes('/logos/akeneo.svg'), true)
  assert.equal(tabsSource.includes('/logos/salsify.svg'), true)
  assert.equal(tabsSource.includes('/logos/inriver.svg'), true)
  assert.equal(tabsSource.includes('/logos/sales-layer.png'), true)
  assert.equal(tabsSource.includes('The key is used only for this check and is not saved in local settings.'), false)
  assert.equal(tabsSource.includes('placeholder="https://your-operator.mirakl.net"'), true)
  assert.equal(tabsSource.includes('setIntegrationForm({ miraklBaseUrl: "", operatorKey: "" })'), true)
  assert.equal(tabsSource.includes('>Placeholder<'), false)
  assert.equal((await getDemoSettings()).miraklBaseUrl, 'https://seidor-dev.mirakl.net')
  assert.equal(schemas.length >= 5, true)
})
