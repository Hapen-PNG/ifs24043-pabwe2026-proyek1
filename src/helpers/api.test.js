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
})
