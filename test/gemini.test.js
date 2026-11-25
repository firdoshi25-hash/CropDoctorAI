const assert = require('node:assert/strict')
const { test } = require('node:test')
const { withGeminiRetry } = require('../gemini')

test('Gemini retry uses bounded exponential backoff for temporary server errors', async () => {
  let calls = 0
  const delays = []
  const result = await withGeminiRetry(async () => {
    calls += 1
    if (calls < 3) throw Object.assign(new Error('temporary provider error'), { status: 503 })
    return 'success'
  }, async (delay) => delays.push(delay))

  assert.equal(result, 'success')
  assert.equal(calls, 3)
  assert.equal(delays.length, 2)
  assert.ok(delays[0] >= 400 && delays[0] < 500)
  assert.ok(delays[1] >= 800 && delays[1] < 900)
})

test('Gemini retries a transient rate limit once but does not retry quota or auth failures', async () => {
  let calls = 0
  await assert.rejects(withGeminiRetry(async () => {
    calls += 1
    throw Object.assign(new Error('rate limit'), { status: 429 })
  }, async () => {}), /rate limit/)
  assert.equal(calls, 2)

  for (const error of [
    Object.assign(new Error('quota exceeded for this billing account'), { status: 429 }),
    Object.assign(new Error('bad API key'), { status: 403 }),
    Object.assign(new Error('bad request'), { status: 400 }),
  ]) {
    calls = 0
    await assert.rejects(withGeminiRetry(async () => {
      calls += 1
      throw error
    }, async () => {}))
    assert.equal(calls, 1)
  }
})
