import { configureStore } from '@reduxjs/toolkit'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  fetchCurrentUser,
  updateCurrentUser,
  updateCurrentUserPhoto,
} from './action.js'

const { api } = vi.hoisted(() => ({
  api: {
    getCurrentUserApi: vi.fn(),
    updateCurrentUserApi: vi.fn(),
    updateCurrentUserPhotoApi: vi.fn(),
  },
}))

vi.mock('../api/userApi.js', () => api)

const store = configureStore({ reducer: (state = {}) => state })

describe('users actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it.each([
    ['fetchCurrentUser', fetchCurrentUser, api.getCurrentUserApi, undefined, { id: 1 }],
    ['updateCurrentUser', updateCurrentUser, api.updateCurrentUserApi, { name: 'Ayu' }, { id: 1, name: 'Ayu' }],
    ['updateCurrentUserPhoto', updateCurrentUserPhoto, api.updateCurrentUserPhotoApi, new Blob(['photo']), { id: 1 }],
  ])('returns API result for %s', async (_name, action, request, args, result) => {
    request.mockResolvedValue(result)

    const dispatched = await store.dispatch(action(args))

    expect(dispatched.meta.requestStatus).toBe('fulfilled')
    expect(dispatched.payload).toEqual(result)
    if (_name === 'fetchCurrentUser') expect(request).toHaveBeenCalledWith()
    else expect(request).toHaveBeenCalledWith(args)
  })

  it('removes the stored token when fetchCurrentUser receives a 401', async () => {
    localStorage.setItem('token', 'expired-token')
    api.getCurrentUserApi.mockRejectedValue(Object.assign(new Error('Unauthorized'), { status: 401 }))

    const dispatched = await store.dispatch(fetchCurrentUser())

    expect(dispatched.meta.requestStatus).toBe('rejected')
    expect(dispatched.payload).toEqual({ message: 'Unauthorized', status: 401 })
    expect(localStorage.getItem('token')).toBeNull()
  })

  it('preserves the token for non-401 user request failures', async () => {
    localStorage.setItem('token', 'valid-token')
    api.getCurrentUserApi.mockRejectedValue(Object.assign(new Error('Server error'), { status: 500 }))

    const dispatched = await store.dispatch(fetchCurrentUser())

    expect(dispatched.payload).toEqual({ message: 'Server error', status: 500 })
    expect(localStorage.getItem('token')).toBe('valid-token')
  })

  it('uses the fallback error message for non-Error failures', async () => {
    api.updateCurrentUserApi.mockRejectedValue('unexpected')

    const dispatched = await store.dispatch(updateCurrentUser({ name: 'Ayu' }))

    expect(dispatched.payload).toEqual({
      message: 'Permintaan gagal. Silakan coba lagi.',
      status: undefined,
    })
  })
})
