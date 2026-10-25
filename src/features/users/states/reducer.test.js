import { describe, expect, it } from 'vitest'
import userReducer from './reducer.js'
import { login, logout } from '../../auth/states/action.js'
import {
  fetchCurrentUser,
  updateCurrentUser,
  updateCurrentUserPhoto,
} from './action.js'

const initialState = { user: null, status: 'idle', error: null }

describe('users reducer', () => {
  it('returns its initial state', () => {
    expect(userReducer(undefined, { type: 'unknown' })).toEqual(initialState)
  })

  it('sets the user on login.fulfilled and clears the error', () => {
    const user = { id: 1, name: 'Nara' }
    const state = userReducer(
      { ...initialState, error: 'previous error' },
      login.fulfilled({ user }, 'login-id', {}),
    )

    expect(state.user).toEqual(user)
    expect(state.error).toBeNull()
  })

  it.each([
    ['logout.fulfilled', logout.fulfilled(undefined, 'logout-id')],
    ['logout.rejected', logout.rejected({ message: 'Network error' }, 'logout-id')],
  ])('resets to initial state on %s', (_label, action) => {
    expect(
      userReducer({ user: { id: 3 }, status: 'failed', error: 'error' }, action),
    ).toEqual(initialState)
  })

  it('handles fetchCurrentUser pending, fulfilled, and rejected actions', () => {
    const pending = userReducer(
      { ...initialState, error: 'previous error' },
      fetchCurrentUser.pending('fetch-user-id'),
    )
    expect(pending.status).toBe('loading')
    expect(pending.error).toBeNull()

    const user = { id: 2, name: 'Ayu' }
    const fulfilled = userReducer(
      pending,
      fetchCurrentUser.fulfilled(user, 'fetch-user-id'),
    )
    expect(fulfilled).toMatchObject({ user, status: 'succeeded', error: null })

    const rejected = userReducer(
      fulfilled,
      fetchCurrentUser.rejected(
        { message: 'Unauthorized' },
        'fetch-user-id',
        undefined,
        { message: 'Token tidak valid', status: 401 },
      ),
    )
    expect(rejected).toMatchObject({
      user: null,
      status: 'failed',
      error: 'Token tidak valid',
    })

    const rejectedWithoutUnauthorizedStatus = userReducer(
      { ...fulfilled, user },
      fetchCurrentUser.rejected(
        { message: 'Network error' },
        'fetch-user-id',
        undefined,
        { message: 'Server tidak tersedia', status: 500 },
      ),
    )
    expect(rejectedWithoutUnauthorizedStatus).toMatchObject({
      user,
      status: 'failed',
      error: 'Server tidak tersedia',
    })
  })

  it.each([
    ['updateCurrentUser', updateCurrentUser, { id: 4, name: 'Dara' }],
    ['updateCurrentUserPhoto', updateCurrentUserPhoto, { id: 4, photo: '/avatar.svg' }],
  ])('handles %s pending, fulfilled, and rejected actions', (_label, actionCreator, user) => {
    const arg = _label === 'updateCurrentUser' ? { name: user.name } : 'photo-file'
    const pending = userReducer(
      { ...initialState, error: 'previous error' },
      actionCreator.pending('update-id', arg),
    )
    expect(pending.status).toBe('loading')
    expect(pending.error).toBeNull()

    const fulfilled = userReducer(
      pending,
      actionCreator.fulfilled(user, 'update-id', arg),
    )
    expect(fulfilled).toMatchObject({ user, status: 'succeeded', error: null })

    const rejected = userReducer(
      fulfilled,
      actionCreator.rejected(
        { message: 'Request failed' },
        'update-id',
        arg,
        { message: 'Profil gagal diperbarui' },
      ),
    )
    expect(rejected).toMatchObject({
      user,
      status: 'failed',
      error: 'Profil gagal diperbarui',
    })
  })
})
