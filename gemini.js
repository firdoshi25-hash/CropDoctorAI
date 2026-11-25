const MAX_SERVER_RETRIES = 2
const MAX_429_RETRIES = 1
const BASE_RETRY_DELAY_MS = 400
const MAX_RETRY_DELAY_MS = 4000

function getErrorStatus(error) {
  const status = Number(error?.status || error?.statusCode || error?.response?.status)
  return Number.isInteger(status) ? status : 0
}

function isPermanentQuotaError(error) {
  return /quota|billing|daily limit|resource_exhausted|limit:\s*0/i.test(String(error?.message || ''))
}

function getRetryAfterMs(error) {
  const headers = error?.headers || error?.response?.headers
  const value = typeof headers?.get === 'function'
    ? headers.get('retry-after')
    : headers?.['retry-after'] || headers?.['Retry-After']
  if (!value) return 0
  const seconds = Number(value)
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000)
  const timestamp = Date.parse(value)
  return Number.isFinite(timestamp) ? Math.max(0, timestamp - Date.now()) : 0
}

function isRetryable(error, retryNumber) {
  const status = getErrorStatus(error)
  if (status >= 500 && status <= 599) return retryNumber <= MAX_SERVER_RETRIES
  if (status === 429 && !isPermanentQuotaError(error)) return retryNumber <= MAX_429_RETRIES
  return false
}

async function withGeminiRetry(operation, wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))) {
  let retryNumber = 0
  while (true) {
    try {
      return await operation()
    } catch (error) {
      retryNumber += 1
      if (!isRetryable(error, retryNumber)) throw error
      const exponentialDelay = Math.min(BASE_RETRY_DELAY_MS * (2 ** (retryNumber - 1)), MAX_RETRY_DELAY_MS)
      const retryAfter = Math.min(getRetryAfterMs(error), MAX_RETRY_DELAY_MS)
      await wait(Math.max(exponentialDelay, retryAfter) + Math.floor(Math.random() * 100))
    }
  }
}

module.exports = { getErrorStatus, isPermanentQuotaError, withGeminiRetry }
