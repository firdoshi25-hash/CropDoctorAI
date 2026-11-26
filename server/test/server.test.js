const assert = require('node:assert/strict')
const crypto = require('node:crypto')
const fs = require('node:fs/promises')
const net = require('node:net')
const os = require('node:os')
const path = require('node:path')
const { spawn } = require('node:child_process')
const { after, before, test } = require('node:test')
const supportedLanguages = require('../../shared/languages.json')

let serverProcess
let baseUrl
let serverPort
let temporaryDirectory
let processOutput = ''

before(async () => {
  const probe = net.createServer()
  await new Promise((resolve, reject) => {
    probe.once('error', reject)
    probe.listen(0, '127.0.0.1', resolve)
  })
  const { port } = probe.address()
  serverPort = port
  await new Promise((resolve, reject) => probe.close((error) => error ? reject(error) : resolve()))

  temporaryDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'cropdoctor-test-'))
  baseUrl = `http://127.0.0.1:${port}`
  serverProcess = spawn(process.execPath, ['server.js'], {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, PORT: String(port), DATA_DIR: temporaryDirectory, GEMINI_API_KEY: '' },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  serverProcess.stdout.on('data', (chunk) => { processOutput += chunk.toString() })
  serverProcess.stderr.on('data', (chunk) => { processOutput += chunk.toString() })

  const deadline = Date.now() + 8000
  while (Date.now() < deadline) {
    if (serverProcess.exitCode !== null) throw new Error(`Test API exited early: ${processOutput}`)
    try {
      const response = await fetch(`${baseUrl}/api/health`)
      if (response.ok) return
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 50))
    }
  }
  throw new Error(`Test API did not start: ${processOutput}`)
})

after(async () => {
  if (serverProcess && serverProcess.exitCode === null) {
    await new Promise((resolve) => {
      serverProcess.once('exit', resolve)
      serverProcess.kill('SIGTERM')
    })
  }
  if (temporaryDirectory) await fs.rm(temporaryDirectory, { recursive: true, force: true })
})

test('health endpoint reports server and AI configuration', async () => {
  const response = await fetch(`${baseUrl}/api/health`)
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { status: 'ok', aiConfigured: false, storage: 'local-json' })
})

test('translation endpoint accepts all shared language codes and rejects unsupported languages', async () => {
  for (const { code } of supportedLanguages) {
    const response = await fetch(`${baseUrl}/api/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language: code, texts: [] }),
    })
    assert.equal(response.status, 200, `Expected ${code} to be supported`)
    assert.deepEqual(await response.json(), { translations: [] })
  }

  const english = await fetch(`${baseUrl}/api/translate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ language: 'en', texts: ['CropDoctor AI', 'Crop {name} has 3 leaves.'] }),
  })
  assert.equal(english.status, 200)
  assert.deepEqual(await english.json(), { translations: ['CropDoctor AI', 'Crop {name} has 3 leaves.'] })

  const unsupported = await fetch(`${baseUrl}/api/translate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ language: 'xx', texts: [] }),
  })
  assert.equal(unsupported.status, 400)
  assert.match((await unsupported.json()).error, /supported Indian languages/i)
})

test('non-English translation fails explicitly when Gemini is not configured', async () => {
  for (const code of ['hi', 'bn', 'ur', 'ta', 'te', 'as']) {
    const response = await fetch(`${baseUrl}/api/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language: code, texts: ['Plant Care Guide'] }),
    })
    assert.equal(response.status, 503)
    assert.match((await response.json()).error, /GEMINI_API_KEY/)
  }
})

test('plant library contains at least 30 distinct plants and crops', async () => {
  const response = await fetch(`${baseUrl}/api/users/Alice/library`)
  assert.equal(response.status, 200)
  const { plants } = await response.json()
  assert.ok(plants.length >= 30)
  assert.equal(new Set(plants.map((plant) => plant.name)).size, plants.length)
  assert.ok(plants.every((plant) => plant.name && plant.category && plant.emoji))
})

test('plant information search validates its input and reports missing AI configuration', async () => {
  const invalidPlant = await fetch(`${baseUrl}/api/plants/info`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plant: '   ', language: 'en' }),
  })
  assert.equal(invalidPlant.status, 400)
  assert.match((await invalidPlant.json()).error, /plant name/i)

  const unsupportedLanguage = await fetch(`${baseUrl}/api/plants/info`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plant: 'Tomato', language: 'xx' }),
  })
  assert.equal(unsupportedLanguage.status, 400)

  const noAi = await fetch(`${baseUrl}/api/plants/info`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plant: 'Tomato', language: 'hi' }),
  })
  assert.equal(noAi.status, 503)
  assert.match((await noAi.json()).error, /GEMINI_API_KEY/)
})

test('farmer records are saved and separated by name', async () => {
  const aliceResponse = await fetch(`${baseUrl}/api/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Alice' }),
  })
  assert.equal(aliceResponse.status, 200)
  assert.equal((await aliceResponse.json()).name, 'Alice')

  const bobResponse = await fetch(`${baseUrl}/api/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Bob' }),
  })
  assert.equal(bobResponse.status, 200)
  assert.equal((await bobResponse.json()).name, 'Bob')

  const alice = await (await fetch(`${baseUrl}/api/users/Alice`)).json()
  const bob = await (await fetch(`${baseUrl}/api/users/Bob`)).json()
  assert.deepEqual(alice.scans, [])
  assert.deepEqual(alice.messages, [])
  assert.deepEqual(bob.scans, [])
  assert.deepEqual(bob.messages, [])

  const files = await fs.readdir(path.join(temporaryDirectory, 'users'))
  assert.equal(files.length, 2)
})

test('invalid names are rejected and missing AI configuration is explicit', async () => {
  const invalid = await fetch(`${baseUrl}/api/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: ' ' }),
  })
  assert.equal(invalid.status, 400)
  assert.match((await invalid.json()).error, /name/i)

  const chat = await fetch(`${baseUrl}/api/users/Alice/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'How often should I water my tomato?' }),
  })
  assert.equal(chat.status, 503)
  assert.match((await chat.json()).error, /GEMINI_API_KEY/)

  const storedAlice = await (await fetch(`${baseUrl}/api/users/Alice`)).json()
  assert.deepEqual(storedAlice.messages, [])
})

test('failed plant scans do not save a false result or leave uploaded photos', async () => {
  const form = new FormData()
  form.append('image', new Blob([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00])], { type: 'image/png' }), 'leaf.png')
  form.append('language', 'en')

  const response = await fetch(`${baseUrl}/api/users/Alice/scans`, { method: 'POST', body: form })
  assert.equal(response.status, 503)
  assert.match((await response.json()).error, /GEMINI_API_KEY/)

  const storedAlice = await (await fetch(`${baseUrl}/api/users/Alice`)).json()
  assert.deepEqual(storedAlice.scans, [])

  const userId = crypto.createHash('sha256').update('alice').digest('hex')
  const uploadedFiles = await fs.readdir(path.join(temporaryDirectory, 'uploads', userId))
  assert.deepEqual(uploadedFiles, [])
})

test('invalid image content and language codes are rejected and temporary uploads removed', async () => {
  const invalidImage = new FormData()
  invalidImage.append('image', new Blob(['not an image'], { type: 'image/png' }), 'leaf.png')
  invalidImage.append('language', 'en')
  const badImageResponse = await fetch(`${baseUrl}/api/users/Alice/scans`, { method: 'POST', body: invalidImage })
  assert.equal(badImageResponse.status, 415)
  assert.match((await badImageResponse.json()).error, /valid JPEG, PNG, or WebP/i)

  const invalidLanguage = new FormData()
  invalidLanguage.append('image', new Blob([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])], { type: 'image/png' }), 'leaf.png')
  invalidLanguage.append('language', 'Hindi')
  const badLanguageResponse = await fetch(`${baseUrl}/api/users/Alice/scans`, { method: 'POST', body: invalidLanguage })
  assert.equal(badLanguageResponse.status, 400)
  assert.match((await badLanguageResponse.json()).error, /supported Indian languages/i)

  const userId = crypto.createHash('sha256').update('alice').digest('hex')
  assert.deepEqual(await fs.readdir(path.join(temporaryDirectory, 'uploads', userId)), [])
})

test('farmer JSON data survives a server restart', async () => {
  const create = await fetch(`${baseUrl}/api/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'RestartCheck' }),
  })
  assert.equal(create.status, 200)

  const oldProcess = serverProcess
  await new Promise((resolve) => {
    oldProcess.once('exit', resolve)
    oldProcess.kill('SIGTERM')
  })

  serverProcess = spawn(process.execPath, ['server.js'], {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, PORT: String(serverPort), DATA_DIR: temporaryDirectory, GEMINI_API_KEY: '' },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  serverProcess.stdout.on('data', (chunk) => { processOutput += chunk.toString() })
  serverProcess.stderr.on('data', (chunk) => { processOutput += chunk.toString() })

  const deadline = Date.now() + 8000
  while (Date.now() < deadline) {
    if (serverProcess.exitCode !== null) throw new Error(`Restarted test API exited early: ${processOutput}`)
    try {
      const response = await fetch(`${baseUrl}/api/health`)
      if (response.ok) break
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 50))
    }
  }

  const stored = await fetch(`${baseUrl}/api/users/RestartCheck`)
  assert.equal(stored.status, 200)
  assert.equal((await stored.json()).name, 'RestartCheck')
})
