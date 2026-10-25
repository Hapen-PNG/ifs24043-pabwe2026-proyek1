import { describe, expect, it } from 'vitest'
import authReducer from './reducer.js'
import { login, logout } from './action.js'

describe('auth reducer', () => {
  it('clears the token and initialization state after logout succeeds', () => {
    const state = {
      token: 'existing-token',
      isInitializing: true,
      status: 'loading',
      error: null,
    }

    const nextState = authReducer(state, logout.fulfilled(undefined, 'logout-req'))

    expect(nextState.token).toBeNull()
    expect(nextState.isInitializing).toBe(false)
  })

  it('stores the token from a successful login payload', () => {
    const payload = { token: 'new-token', user: { id: 1 } }
    const state = {
      token: null,
      isInitializing: false,
      status: 'loading',
      error: null,
    }

    const nextState = authReducer(state, login.fulfilled(payload, 'login-req', {}))

    expect(nextState.token).toBe('new-token')
  })

  it('stores the rejection payload message as the auth error', () => {
    const state = {
      token: null,
      isInitializing: false,
      status: 'loading',
      error: null,
    }

    const nextState = authReducer(
      state,
      login.rejected(null, 'login-req', {}, { message: 'Kredensial tidak valid' }),
    )

    expect(nextState.error).toBe('Kredensial tidak valid')
  })
})
