import { createSlice } from '@reduxjs/toolkit'
import { login, logout } from '../../auth/states/action.js'
import {
  fetchCurrentUser,
  updateCurrentUser,
  updateCurrentUserPhoto,
} from './action.js'

const initialState = {
  user: null,
  status: 'idle',
  error: null,
}

const userSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    clearUserError(state) {
      state.error = null
    },
  },
  extraReducers(builder) {
    builder
      .addCase(login.fulfilled, (state, action) => {
        state.user = action.payload.user
        state.error = null
      })
      .addCase(logout.fulfilled, () => initialState)
      .addCase(logout.rejected, () => initialState)
      .addCase(fetchCurrentUser.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.user = action.payload
        state.error = null
      })
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload?.message ?? action.error.message
        if (action.payload?.status === 401) state.user = null
      })
      .addCase(updateCurrentUser.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(updateCurrentUser.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.user = action.payload
        state.error = null
      })
      .addCase(updateCurrentUser.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload?.message ?? action.error.message
      })
      .addCase(updateCurrentUserPhoto.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(updateCurrentUserPhoto.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.user = action.payload
        state.error = null
      })
      .addCase(updateCurrentUserPhoto.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload?.message ?? action.error.message
      })
  },
})

export const { clearUserError } = userSlice.actions
export default userSlice.reducer
