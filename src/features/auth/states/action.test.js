import { configureStore } from '@reduxjs/toolkit'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { changePassword, login, logout, register } from './action.js'

const { api } = vi.hoisted(() => ({
  api: {
    changePasswordApi: vi.fn(),
    loginApi: vi.fn(),
    logoutApi: vi.fn(),
    registerApi: vi.fn(),
  },
}))

vi.mock('../api/authApi.js', () => api)

const store = configureStore({ reducer: (state = {}) => state })

describe('auth actions', () => {
  beforeEach(() => vi.clearAllMocks())

  it.each([
    ['login', login, api.loginApi, { email: 'a@example.com', password: 'secret' }],
    ['register', register, api.registerApi, { name: 'Ayu', email: 'a@example.com' }],
    ['logout', logout, api.logoutApi, undefined],
    ['changePassword', changePassword, api.changePasswordApi, { password: 'old' }],
  ])('resolves %s with the API result', async (_name, action, request, args) => {
    const result = { status: 'success' }
    request.mockResolvedValue(result)

    const dispatched = await store.dispatch(action(args))

    expect(dispatched.payload).toEqual(result)
    expect(dispatched.meta.requestStatus).toBe('fulfilled')
    if (_name === 'logout') expect(request).toHaveBeenCalledWith()
    else expect(request).toHaveBeenCalledWith(args)
  })

  it.each([
    ['Error', new Error('API failed'), 'API failed'],
    ['non-Error', 'unexpected', 'Permintaan gagal. Silakan coba lagi.'],
  ])('serializes %s API failures from login', async (_name, failure, message) => {
    api.loginApi.mockRejectedValue(failure)

    const dispatched = await store.dispatch(login({ email: 'x' }))

    expect(dispatched.meta.requestStatus).toBe('rejected')
    expect(dispatched.payload).toMatchObject({ message })
  })
})
