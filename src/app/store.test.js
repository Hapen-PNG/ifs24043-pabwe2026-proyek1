import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('store', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.resetModules()
  })

  it('includes auth and users reducers', async () => {
    const { store } = await import('./store.js')

    expect(store.getState()).toHaveProperty('auth')
    expect(store.getState()).toHaveProperty('users')
  })

  it('initializes auth session state from the localStorage token', async () => {
    localStorage.setItem('token', 'stored-token')

    const { store } = await import('./store.js')

    expect(store.getState().auth.token).toBe('stored-token')
    expect(store.getState().auth.isInitializing).toBe(true)
  })
})
