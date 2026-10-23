import { createSlice } from '@reduxjs/toolkit'
import {
  changePassword,
  login,
  logout,
  register,
} from './action.js'
import { fetchCurrentUser } from '../../users/states/action.js'

const TOKEN_KEY = 'token'

function readToken() {
  try {
    window.localStorage.removeItem('mini-music-player:users')
    window.localStorage.removeItem('mini-music-player:user')
    return window.localStorage.getItem(TOKEN_KEY)
  } catch (error) {
    console.error('Token autentikasi tidak dapat dibaca.', error)
    return null
  }
}

const storedToken = readToken()

const initialState = {
  token: storedToken,
  isInitializing: Boolean(storedToken),
  status: 'idle',
  error: null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuthError(state) {
      state.error = null
    },
  },
  extraReducers(builder) {
    builder
      .addCase(login.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.token = action.payload.token
        state.isInitializing = false
        state.error = null
      })
      .addCase(login.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload?.message ?? action.error.message
      })
      .addCase(register.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(register.fulfilled, (state) => {
        state.status = 'succeeded'
        state.error = null
      })
      .addCase(register.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload?.message ?? action.error.message
      })
      .addCase(logout.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(logout.fulfilled, (state) => {
        state.status = 'idle'
        state.token = null
        state.isInitializing = false
        state.error = null
      })
      .addCase(logout.rejected, (state, action) => {
        state.status = 'failed'
        state.token = null
        state.isInitializing = false
        state.error = action.payload?.message ?? action.error.message
      })
      .addCase(fetchCurrentUser.fulfilled, (state) => {
        state.isInitializing = false
        state.error = null
      })
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        state.isInitializing = false
        state.error = action.payload?.message ?? action.error.message
        if (action.payload?.status === 401) {
          state.token = null
        }
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.error = action.payload?.message ?? action.error.message
      })
  },
})

export const { clearAuthError } = authSlice.actions
export default authSlice.reducer
