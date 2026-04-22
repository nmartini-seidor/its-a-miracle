import assert from 'node:assert/strict'
import { test } from 'node:test'

function scoreBand(score) {
  if (score < 25) return 'red'
  if (score < 70) return 'yellow'
  if (score < 90) return 'blue'
  return 'green'
}

test('score bands match documented thresholds', () => {
  assert.equal(scoreBand(12), 'red')
  assert.equal(scoreBand(24), 'red')
  assert.equal(scoreBand(25), 'yellow')
  assert.equal(scoreBand(69), 'yellow')
  assert.equal(scoreBand(70), 'blue')
  assert.equal(scoreBand(89), 'blue')
  assert.equal(scoreBand(90), 'green')
})
