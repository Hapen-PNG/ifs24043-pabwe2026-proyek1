import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as userApi from './userApi.js'
import apiFetch from '../../../helpers/api.js'

vi.mock('../../../helpers/api.js', () => ({ default: vi.fn() }))

describe('user API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns the current user and rejects missing or unsuccessful user data', async () => {
    const user = { id: 1, name: 'Ayu' }
    apiFetch.mockResolvedValueOnce({ status: 'success', data: { user } })
    await expect(userApi.getCurrentUserApi()).resolves.toEqual(user)

    apiFetch.mockResolvedValueOnce({ status: 'success', data: {} })
    await expect(userApi.getCurrentUserApi())
      .rejects.toThrow('Respons profil API tidak memuat data pengguna.')

    apiFetch.mockResolvedValueOnce({ status: 'fail', message: 'Not allowed' })
    await expect(userApi.getCurrentUserApi()).rejects.toThrow('Not allowed')
  })

  it('updates the current user with the supplied profile data', async () => {
    const user = { id: 1, name: 'Nara', email: 'nara@example.test' }
    apiFetch.mockResolvedValueOnce({ status: 'success', data: { user } })

    await expect(userApi.updateCurrentUserApi(user)).resolves.toEqual(user)
    expect(apiFetch).toHaveBeenCalledWith('/users/me', {
      method: 'PUT',
      body: { name: user.name, email: user.email },
    })
  })

  it('uploads a photo as FormData and returns the refreshed profile', async () => {
    const photo = new File(['image'], 'profile.png', { type: 'image/png' })
    const user = { id: 1, name: 'Ayu' }
    apiFetch
      .mockResolvedValueOnce({ status: 'success' })
      .mockResolvedValueOnce({ status: 'success', data: { user } })

    await expect(userApi.updateCurrentUserPhotoApi(photo)).resolves.toEqual(user)

    const [path, request] = apiFetch.mock.calls[0]
    expect(path).toBe('/users/me/photo')
    expect(request.method).toBe('POST')
    expect(request.body).toBeInstanceOf(FormData)
    expect(request.body.get('photo')).toBe(photo)
    expect(apiFetch).toHaveBeenNthCalledWith(2, '/users/me')
  })

  it('uses the upload-specific failure message for an unsuccessful response', async () => {
    apiFetch.mockResolvedValueOnce({ status: 'fail' })
    const photo = new File(['image'], 'profile.png', { type: 'image/png' })

    await expect(userApi.updateCurrentUserPhotoApi(photo))
      .rejects.toThrow('Foto profil gagal diperbarui.')
  })
})
