const fs = require('node:fs/promises')
const path = require('node:path')
const crypto = require('node:crypto')

class JsonCache {
  constructor(filename, maxEntries) {
    this.filename = filename
    this.maxEntries = maxEntries
    this.values = null
    this.loading = null
    this.writeQueue = Promise.resolve()
    this.inFlight = new Map()
  }

  async load() {
    if (this.values) return this.values
    if (!this.loading) {
      this.loading = fs.readFile(this.filename, 'utf8')
        .then((contents) => {
          const parsed = JSON.parse(contents)
          if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
            throw new TypeError('Cache file must contain a JSON object.')
          }
          this.values = parsed
        })
        .catch(async (error) => {
          if (error.code !== 'ENOENT') {
            console.error(`Could not read persistent cache ${this.filename}:`, error.message)
          }
          this.values = Object.create(null)
        })
    }
    await this.loading
    return this.values
  }

  async get(key) {
    const values = await this.load()
    if (!Object.hasOwn(values, key)) return undefined
    const value = values[key]
    delete values[key]
    values[key] = value
    return value
  }

  async setMany(entries) {
    const values = await this.load()
    for (const [key, value] of entries) {
      delete values[key]
      values[key] = value
    }
    const keys = Object.keys(values)
    while (keys.length > this.maxEntries) delete values[keys.shift()]
    await this.persist()
  }

  async persist() {
    const serialized = JSON.stringify(this.values)
    const write = this.writeQueue.catch(() => {}).then(async () => {
      await fs.mkdir(path.dirname(this.filename), { recursive: true })
      const temporaryFile = `${this.filename}.${process.pid}.${crypto.randomUUID()}.tmp`
      try {
        await fs.writeFile(temporaryFile, serialized, { mode: 0o600 })
        await fs.rename(temporaryFile, this.filename)
      } catch (error) {
        await fs.unlink(temporaryFile).catch(() => {})
        throw error
      }
    })
    this.writeQueue = write
    try {
      await write
    } catch (error) {
      console.error(`Could not persist cache ${this.filename}:`, error.message)
    }
  }

  async getOrCreate(key, createValue) {
    const cached = await this.get(key)
    if (cached !== undefined) return cached
    if (this.inFlight.has(key)) return this.inFlight.get(key)

    const request = Promise.resolve()
      .then(createValue)
      .then(async (value) => {
        await this.setMany([[key, value]])
        return value
      })
      .finally(() => this.inFlight.delete(key))
    this.inFlight.set(key, request)
    return request
  }
}

module.exports = { JsonCache }
