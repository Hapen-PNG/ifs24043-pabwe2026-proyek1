import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { backendApi } from './backendApi.js'

describe('backendApi', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('serializes JSON requests, attaches authentication, and returns the payload', async () => {
    const payload = { status: 'success', data: { id: 3 } }
    localStorage.setItem('token', 'api-token')
    fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue(payload),
    })

    await expect(backendApi('/songs', {
      method: 'POST',
      body: { songId: 3 },
      headers: { 'X-Trace': 'trace-1' },
    })).resolves.toEqual(payload)

    const [url, request] = fetch.mock.calls[0]
    const headers = new Headers(request.headers)
    expect(url).toMatch(/^https?:\/\/.+\/songs$/)
    expect(headers.get('Accept')).toBe('application/json')
    expect(headers.get('Content-Type')).toBe('application/json')
    expect(headers.get('Authorization')).toBe('Bearer api-token')
    expect(headers.get('X-Trace')).toBe('trace-1')
    expect(request.body).toBe('{"songId":3}')
    expect(request.signal).toBeInstanceOf(AbortSignal)
  })

  it('preserves FormData and tolerates invalid JSON responses', async () => {
    const form = new FormData()
    form.append('photo', 'image-data')
    fetch.mockResolvedValue({
      ok: true,
      status: 204,
      json: vi.fn().mockRejectedValue(new Error('empty response')),
    })

    await expect(backendApi('/profile', { method: 'POST', body: form })).resolves.toBeNull()

    const request = fetch.mock.calls[0][1]
    expect(request.body).toBe(form)
    expect(new Headers(request.headers).has('Content-Type')).toBe(false)
  })

  it('throws response messages or status-based fallback errors', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: vi.fn().mockResolvedValue({ message: 'Access denied' }),
    })
    await expect(backendApi('/private')).rejects.toMatchObject({
      message: 'Access denied',
      status: 403,
    })

    fetch.mockResolvedValueOnce({
      ok: true,
      status: 422,
      json: vi.fn().mockResolvedValue({ status: 'fail' }),
    })
    await expect(backendApi('/invalid')).rejects.toMatchObject({
      message: 'Permintaan gagal (422).',
      status: 422,
    })
  })

  it('converts aborts to a timeout error and always clears the timer', async () => {
    vi.useFakeTimers()
    fetch.mockImplementation((_url, { signal }) => new Promise((_resolve, reject) => {
      signal.addEventListener('abort', () => {
        const error = new Error('aborted')
        error.name = 'AbortError'
        reject(error)
      })
    }))

    const request = backendApi('/slow')
    const timeoutAssertion = expect(request).rejects.toThrow(
      'Permintaan ke server musik melewati batas waktu 8 detik.',
    )
    await vi.advanceTimersByTimeAsync(8000)
    await timeoutAssertion
    expect(vi.getTimerCount()).toBe(0)
  })

  it('propagates non-abort network errors', async () => {
    const networkError = new Error('network down')
    fetch.mockRejectedValue(networkError)

    await expect(backendApi('/songs')).rejects.toBe(networkError)
  })
})
