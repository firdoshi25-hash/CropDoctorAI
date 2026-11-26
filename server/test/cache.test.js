const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const os = require('node:os')
const path = require('node:path')
const { test } = require('node:test')
const { JsonCache } = require('../cache')

test('JSON cache persists values, deduplicates concurrent factories, and bounds entries', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'cropdoctor-cache-test-'))
  const filename = path.join(directory, 'cache.json')

  try {
    const cache = new JsonCache(filename, 2)
    let factoryCalls = 0
    const factory = async () => {
      factoryCalls += 1
      await new Promise((resolve) => setTimeout(resolve, 10))
      return { result: 'cached' }
    }

    const [first, second] = await Promise.all([
      cache.getOrCreate('shared', factory),
      cache.getOrCreate('shared', factory),
    ])
    assert.deepEqual(first, { result: 'cached' })
    assert.deepEqual(second, first)
    assert.equal(factoryCalls, 1)

    await cache.setMany([['second', 2], ['third', 3]])
    assert.equal(Object.keys(JSON.parse(await fs.readFile(filename, 'utf8'))).length, 2)

    const restartedCache = new JsonCache(filename, 2)
    assert.equal(await restartedCache.get('third'), 3)
    assert.equal(await restartedCache.get('shared'), undefined)
  } finally {
    await fs.rm(directory, { recursive: true, force: true })
  }
})
