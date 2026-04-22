import assert from 'node:assert/strict'
import { test } from 'node:test'

const { qualityScore, scoreBand } = await import('../lib/scoring.ts')

test('score bands match documented thresholds', () => {
  assert.equal(scoreBand(12), 'red')
  assert.equal(scoreBand(24), 'red')
  assert.equal(scoreBand(25), 'yellow')
  assert.equal(scoreBand(69), 'yellow')
  assert.equal(scoreBand(70), 'blue')
  assert.equal(scoreBand(89), 'blue')
  assert.equal(scoreBand(90), 'green')
})

test('qualityScore rewards populated baseline fields and penalizes warnings', () => {
  const scored = qualityScore({
    brand: 'Huawei',
    baselineDescription: 'Compact open-ear earbuds with charging case.',
    baselineAttributes: {
      brand: 'Huawei',
      batteryLife: '9 hours',
      usbC: 'USB-C',
      bluetoothVersion: '6.0',
    },
    warnings: ['EAN missing'],
  })

  assert.equal(scored.score, 95)
  assert.equal(scored.band, 'green')
})
