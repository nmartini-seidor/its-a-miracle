import assert from 'node:assert/strict'
import { test } from 'node:test'

function scoreBand(score) {
  if (score < 40) return 'red'
  if (score < 70) return 'amber'
  if (score < 85) return 'neutral'
  return 'green'
}

test('score bands match documented thresholds', () => {
  assert.equal(scoreBand(12), 'red')
  assert.equal(scoreBand(55), 'amber')
  assert.equal(scoreBand(75), 'neutral')
  assert.equal(scoreBand(91), 'green')
})
