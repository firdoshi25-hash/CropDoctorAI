async function request(path, options = {}) {
  let response
  try {
    response = await fetch(path, { ...options, signal: options.signal || AbortSignal.timeout(90000) })
  } catch (error) {
    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      throw new Error('The request took too long. Check your connection and try again.')
    }
    throw new Error('Cannot reach the CropDoctor server. Start the server and try again.')
  }

  const responseText = await response.text()
  let body
  try {
    body = responseText ? JSON.parse(responseText) : {}
  } catch {
    throw new Error(response.ok
      ? 'The server returned an invalid response. Please try again.'
      : `Request failed (${response.status}).`)
  }
  if (!response.ok) {
    throw new Error(body.error || `Request failed (${response.status}).`)
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new Error('The server returned an invalid response. Please try again.')
  }
  return body
}

function farmerPath(name) {
  return `/api/users/${encodeURIComponent(name)}`
}

export function createFarmer(name) {
  return request('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  })
}

export function getFarmer(name) {
  return request(farmerPath(name))
}

export function getPlantLibrary(name) {
  return request(`${farmerPath(name)}/library`)
}

export function scanPlant(name, file, language, targetPlant = '') {
  const formData = new FormData()
  formData.append('image', file)
  formData.append('language', language)
  if (targetPlant) formData.append('targetPlant', targetPlant)
  return request(`${farmerPath(name)}/scans`, { method: 'POST', body: formData })
}

export function getPlantInfo(plant, language) {
  return request('/api/plants/info', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plant, language }),
  })
}

export function askAssistant(name, message, language) {
  return request(`${farmerPath(name)}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, language }),
  })
}

export function translateInterface(language, texts) {
  return request('/api/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ language, texts }),
  }).then((result) => {
    if (!Array.isArray(result.translations)
      || result.translations.length !== texts.length
      || result.translations.some((value) => typeof value !== 'string' || !value.trim())) {
      throw new Error('The translation service returned an incomplete translation. Please try again.')
    }
    return result
  })
}
