import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { test } from 'node:test'

const { aggregators, heroProduct } = await import('../lib/fixtures.ts')
const { getAuthorityTier } = await import('../lib/aggregator-policy.ts')
const { listAggregators } = await import('../server/data.ts')
const { updateStoredAggregator } = await import('../server/store.ts')

function getAuthorityTierId(authorityScore) {
  return getAuthorityTier(authorityScore).id
}

test('aggregator definitions preserve a believable authority ladder', () => {
  const byId = new Map(aggregators.map((aggregator) => [aggregator.id, aggregator]))

  assert.equal(byId.get('official-manufacturer')?.defaultConfidence, 'high')
  assert.equal(getAuthorityTierId(byId.get('official-manufacturer')?.authorityScore ?? 0), 'canonical-anchor')

  assert.equal(byId.get('spec-database')?.defaultConfidence, 'high')
  assert.equal(getAuthorityTierId(byId.get('spec-database')?.authorityScore ?? 0), 'trusted-specialist')

  assert.equal(byId.get('trusted-retailer')?.defaultConfidence, 'medium')
  assert.equal(getAuthorityTierId(byId.get('trusted-retailer')?.authorityScore ?? 0), 'corroborating-source')

  assert.equal(byId.get('marketplace-listing')?.defaultConfidence, 'low')
  assert.equal(getAuthorityTierId(byId.get('marketplace-listing')?.authorityScore ?? 0), 'supporting-only')

  assert.equal(byId.get('internal-reference')?.enabled, true)
  assert.equal(getAuthorityTierId(byId.get('internal-reference')?.authorityScore ?? 0), 'trusted-specialist')
})

test('active hero-product evidence respects the provider confidence posture', () => {
  const providers = new Map(aggregators.map((aggregator) => [aggregator.id, aggregator]))

  for (const evidence of heroProduct.evidence) {
    const provider = providers.get(evidence.aggregatorId)
    assert.ok(provider, `expected provider for ${evidence.aggregatorId}`)
    assert.equal(provider.enabled, true)

    if (provider.type === 'manufacturer') {
      assert.equal(evidence.confidence, 'high')
    }

    if (provider.type === 'retailer') {
      assert.notEqual(evidence.confidence, 'high')
    }

    if (provider.authorityScore < 60) {
      assert.notEqual(evidence.confidence, 'high')
    }
  }
})

test('every aggregator carries enough metadata to explain preview-safe confidence rules', () => {
  for (const aggregator of aggregators) {
    assert.equal(aggregator.coverageTags.length > 0, true, `${aggregator.id} should explain what it covers`)
    assert.equal(aggregator.sampleDomains.length > 0, true, `${aggregator.id} should expose sample domains`)
    assert.equal(aggregator.confidencePolicy.length >= 40, true, `${aggregator.id} should describe its confidence policy`)
    assert.match(aggregator.baseUrl, /^https:\/\//)
  }
})

test('aggregators overview is list-first and links to configuration pages', () => {
  const source = readFileSync('app/aggregators/page.tsx', 'utf8')
  const detailSource = readFileSync('app/aggregators/[id]/page.tsx', 'utf8')
  const formSource = readFileSync('components/aggregator/aggregator-configuration-form.tsx', 'utf8')

  assert.equal(source.includes('Aggregator configuration'), true)
  assert.equal(source.includes('Why authority matters'), true)
  assert.equal(source.includes('href={`/aggregators/${aggregator.id}`}'), true)
  assert.equal(source.includes('Provider authority matrix'), false)
  assert.equal(detailSource.includes('AggregatorConfigurationForm'), true)
  assert.equal(formSource.includes('Save aggregator'), true)
  assert.equal(formSource.includes('Authority and confidence'), true)
  assert.equal(existsSync('app/aggregators/[id]/page.tsx'), true)
})

test('aggregator configuration updates persist in local workspace state', async () => {
  const base = aggregators.find((aggregator) => aggregator.id === 'trusted-retailer')
  assert.ok(base)

  const updated = updateStoredAggregator(aggregators, base.id, {
    ...base,
    name: 'Trusted retailer test',
    authorityScore: 72,
  })

  assert.equal(updated?.name, 'Trusted retailer test')
  assert.equal((await listAggregators()).find((aggregator) => aggregator.id === base.id)?.authorityScore, 72)

  updateStoredAggregator(aggregators, base.id, base)
})
