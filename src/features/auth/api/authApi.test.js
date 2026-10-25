import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as authApi from './authApi.js'
import apiFetch from '../../../helpers/api.js'

vi.mock('../../../helpers/api.js', () => ({ default: vi.fn() }))

describe('auth API', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('registers users and rejects unsuccessful responses', async () => {
    apiFetch.mockResolvedValueOnce({ status: 'success', data: { id: 1 } })
    const registration = { name: 'Ayu', email: 'ayu@example.test', password: 'secret' }

    await expect(authApi.registerApi(registration)).resolves.toEqual({
      status: 'success',
      data: { id: 1 },
    })
    expect(apiFetch).toHaveBeenCalledWith('/auth/register', {
      method: 'POST',
      body: registration,
    })

    apiFetch.mockResolvedValueOnce({ status: 'fail' })
    await expect(authApi.registerApi(registration))
      .rejects.toThrow('Permintaan autentikasi gagal.')
  })

  it('validates login data, stores the token, and returns the user session', async () => {
    const response = {
      status: 'success',
      data: { token: 'session-token', user: { id: 2 } },
    }
    apiFetch.mockResolvedValueOnce(response)

    await expect(authApi.loginApi({ email: 'a@example.test', password: 'secret' }))
      .resolves.toEqual({ token: 'session-token', user: { id: 2 } })
    expect(localStorage.getItem('token')).toBe('session-token')

    apiFetch.mockResolvedValueOnce({ status: 'success', data: { user: { id: 2 } } })
    await expect(authApi.loginApi({ email: 'a@example.test', password: 'secret' }))
      .rejects.toThrow('Respons login API tidak memuat token dan data pengguna.')
  })

  it('reports token storage failures and clears the token after logout', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('storage blocked')
    })
    apiFetch.mockResolvedValueOnce({
      status: 'success',
      data: { token: 'session-token', user: { id: 2 } },
    })
    await expect(authApi.loginApi({ email: 'a@example.test', password: 'secret' }))
      .rejects.toThrow('Sesi tidak dapat disimpan di browser ini.')
    expect(consoleError).toHaveBeenCalledWith('Token API tidak dapat disimpan.', expect.any(Error))

    setItem.mockRestore()
    window.localStorage.setItem('token', 'expired-token')
    apiFetch.mockRejectedValueOnce(new Error('logout failed'))
    await expect(authApi.logoutApi()).rejects.toThrow('logout failed')
    expect(localStorage.getItem('token')).toBeNull()

    apiFetch.mockResolvedValueOnce({ status: 'success' })
    await expect(authApi.logoutApi()).resolves.toEqual({ status: 'success' })
    expect(apiFetch).toHaveBeenLastCalledWith('/auth/logout', { method: 'POST' })
  })

  it('maps password fields to the backend contract', async () => {
    const response = { status: 'success' }
    apiFetch.mockResolvedValue(response)

    await expect(authApi.changePasswordApi({
      password: 'old',
      newPassword: 'new',
      newPasswordConfirmation: 'new',
    })).resolves.toEqual(response)
    expect(apiFetch).toHaveBeenCalledWith('/users/password', {
      method: 'PUT',
      body: {
        password: 'old',
        new_password: 'new',
        new_password_confirmation: 'new',
      },
    })
  })
})
