const BASE_URL = (DELCOM_BASEURL || '').replace(/\/+$/, '')
const TOKEN_KEY = 'token'

export class ApiError extends Error {
  constructor(message, { status, data } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

async function readResponse(response) {
  if (response.status === 204) return null

  const contentType = response.headers.get('content-type') ?? ''
  if (contentType.includes('application/json')) {
    return response.json()
  }

  const text = await response.text()
  return text || null
}

function getErrorMessage(data, statusText) {
  if (typeof data === 'string' && data.trim()) return data
  if (data && typeof data === 'object') {
    const message = data.message ?? data.error
    if (typeof message === 'string' && message.trim()) return message
  }
  return statusText || 'Permintaan API gagal.'
}

export async function apiFetch(path, options = {}) {
  if (!BASE_URL) {
    throw new Error('DELCOM_BASEURL belum dikonfigurasi.')
  }

  const { headers: suppliedHeaders, body, ...requestOptions } = options
  const headers = new Headers(suppliedHeaders)
  headers.set('Accept', 'application/json')

  const token = window.localStorage.getItem(TOKEN_KEY)
  if (token) headers.set('Authorization', `Bearer ${token}`)

  let requestBody = body
  if (
    body !== undefined &&
    body !== null &&
    typeof body !== 'string' &&
    !(body instanceof FormData) &&
    !(body instanceof Blob) &&
    !(body instanceof URLSearchParams)
  ) {
    headers.set('Content-Type', 'application/json')
    requestBody = JSON.stringify(body)
  }

  const url = /^https?:\/\//i.test(path)
    ? path
    : `${BASE_URL}/${String(path).replace(/^\/+/, '')}`
  const response = await fetch(url, {
    ...requestOptions,
    headers,
    body: requestBody,
  })
  const data = await readResponse(response)

  if (
    !response.ok ||
    (data && typeof data === 'object' && ['fail', 'error'].includes(data.status))
  ) {
    throw new ApiError(getErrorMessage(data, response.statusText), {
      status: response.status,
      data,
    })
  }

  return data
}

export default apiFetch
