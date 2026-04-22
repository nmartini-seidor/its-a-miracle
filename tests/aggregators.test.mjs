import assert from 'node:assert/strict'
import { test } from 'node:test'

const { aggregators, heroProduct } = await import('../lib/fixtures.ts')

function getAuthorityTier(authorityScore) {
  if (authorityScore >= 90) return 'canonical-anchor'
  if (authorityScore >= 80) return 'trusted-specialist'
  if (authorityScore >= 60) return 'corroborating'
  return 'supporting-only'
}

test('aggregator definitions preserve a believable authority ladder', () => {
  const byId = new Map(aggregators.map((aggregator) => [aggregator.id, aggregator]))

  assert.equal(byId.get('official-manufacturer')?.defaultConfidence, 'high')
  assert.equal(getAuthorityTier(byId.get('official-manufacturer')?.authorityScore ?? 0), 'canonical-anchor')

  assert.equal(byId.get('spec-database')?.defaultConfidence, 'high')
  assert.equal(getAuthorityTier(byId.get('spec-database')?.authorityScore ?? 0), 'trusted-specialist')

  assert.equal(byId.get('trusted-retailer')?.defaultConfidence, 'medium')
  assert.equal(getAuthorityTier(byId.get('trusted-retailer')?.authorityScore ?? 0), 'corroborating')

  assert.equal(byId.get('marketplace-listing')?.defaultConfidence, 'low')
  assert.equal(getAuthorityTier(byId.get('marketplace-listing')?.authorityScore ?? 0), 'supporting-only')

  assert.equal(byId.get('internal-reference')?.enabled, true)
  assert.equal(getAuthorityTier(byId.get('internal-reference')?.authorityScore ?? 0), 'trusted-specialist')
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
