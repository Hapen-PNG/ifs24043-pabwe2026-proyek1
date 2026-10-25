import { beforeEach, describe, expect, it, vi } from 'vitest'
import apiFetch, { ApiError } from './api.js'

describe('apiFetch', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    vi.stubGlobal('fetch', vi.fn())
  })

  it('adds the Bearer authorization header when a token is stored', async () => {
    localStorage.setItem('token', 'test-token')
    fetch.mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: vi.fn().mockResolvedValue({ status: 'success' }),
    })

    await apiFetch('/users/me')

    const requestHeaders = new Headers(fetch.mock.calls[0][1].headers)
    expect(requestHeaders.get('Authorization')).toBe('Bearer test-token')
  })

  it('returns JSON data for a successful response', async () => {
    const responseData = { status: 'success', data: { id: 42 } }
    fetch.mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: vi.fn().mockResolvedValue(responseData),
    })

    await expect(apiFetch('/users/me')).resolves.toEqual(responseData)
  })

  it('throws ApiError with status 401 for an unauthorized response', async () => {
    fetch.mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      headers: new Headers({ 'content-type': 'application/json' }),
      json: vi.fn().mockResolvedValue({ message: 'Token tidak valid' }),
    })

    const error = await apiFetch('/users/me').catch((caughtError) => caughtError)

    expect(error).toBeInstanceOf(ApiError)
    expect(error.status).toBe(401)
  })

  it('returns null for 204 responses and text for non-JSON responses', async () => {
    fetch
      .mockResolvedValueOnce({
        ok: true,
        status: 204,
        headers: new Headers(),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'text/plain' }),
        text: vi.fn().mockResolvedValue('accepted'),
      })

    await expect(apiFetch('/empty')).resolves.toBeNull()
    await expect(apiFetch('/status')).resolves.toBe('accepted')
  })

  it('serializes object bodies but preserves FormData and URLSearchParams', async () => {
    fetch.mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers(),
      text: vi.fn().mockResolvedValue('ok'),
    })

    await apiFetch('/relative', {
      method: 'POST',
      body: { songId: 4 },
      headers: { 'X-Request': 'test' },
    })
    const [, jsonRequest] = fetch.mock.calls[0]
    expect(jsonRequest.body).toBe('{"songId":4}')
    expect(new Headers(jsonRequest.headers).get('Content-Type')).toBe('application/json')
    expect(new Headers(jsonRequest.headers).get('X-Request')).toBe('test')

    const form = new FormData()
    form.append('photo', 'image')
    await apiFetch('/form', { method: 'POST', body: form })
    expect(fetch.mock.calls[1][1].body).toBe(form)
    expect(new Headers(fetch.mock.calls[1][1].headers).has('Content-Type')).toBe(false)

    const params = new URLSearchParams({ q: 'song' })
    await apiFetch('https://external.example.test/search', { method: 'POST', body: params })
    expect(fetch.mock.calls[2][0]).toBe('https://external.example.test/search')
    expect(fetch.mock.calls[2][1].body).toBe(params)
  })

  it('constructs ApiError messages for API-level failure payloads and empty bodies', async () => {
    fetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: vi.fn().mockResolvedValue({ status: 'fail', error: 'Invalid request' }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
        headers: new Headers({ 'content-type': 'text/plain' }),
        text: vi.fn().mockResolvedValue('  '),
      })

    await expect(apiFetch('/fail')).rejects.toMatchObject({
      name: 'ApiError',
      message: 'Invalid request',
      status: 200,
      data: { status: 'fail', error: 'Invalid request' },
    })
    await expect(apiFetch('/offline')).rejects.toMatchObject({
      message: 'Service Unavailable',
      status: 503,
      data: '  ',
    })
  })
})
