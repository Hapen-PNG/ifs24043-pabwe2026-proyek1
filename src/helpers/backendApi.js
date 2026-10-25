const TOKEN_KEY = 'token'

export async function backendApi(path, options = {}) {
  const baseUrl = (API_BASEURL || '').replace(/\/+$/, '')
  if (!baseUrl) throw new Error('VITE_API_BASEURL belum dikonfigurasi.')

  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), 8000)
  const token = window.localStorage.getItem(TOKEN_KEY)
  const headers = new Headers(options.headers)
  headers.set('Accept', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)
  if (options.body !== undefined && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  try {
    const response = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers,
      body: options.body === undefined || options.body instanceof FormData
        ? options.body
        : JSON.stringify(options.body),
      signal: controller.signal,
    })
    let payload
    try {
      payload = await response.json()
    } catch {
      payload = null
    }
    if (!response.ok || payload?.status === 'fail') {
      const error = new Error(payload?.message || `Permintaan gagal (${response.status}).`)
      error.status = response.status
      throw error
    }
    return payload
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Permintaan ke server musik melewati batas waktu 8 detik.')
    }
    throw error
  } finally {
    window.clearTimeout(timeoutId)
  }
}
