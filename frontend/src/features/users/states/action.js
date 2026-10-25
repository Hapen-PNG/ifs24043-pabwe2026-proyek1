import { createAsyncThunk } from '@reduxjs/toolkit'
import {
  getCurrentUserApi,
  updateCurrentUserApi,
  updateCurrentUserPhotoApi,
} from '../api/userApi.js'

function rejectWithMessage(error, rejectWithValue) {
  return rejectWithValue({
    message: error instanceof Error ? error.message : 'Permintaan gagal. Silakan coba lagi.',
    status: error?.status,
  })
}

export const fetchCurrentUser = createAsyncThunk(
  'users/fetchCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      return await getCurrentUserApi()
    } catch (error) {
      if (error?.status === 401) {
        try {
          window.localStorage.removeItem('token')
        } catch (storageError) {
          console.error('Token autentikasi tidak dapat dihapus.', storageError)
        }
      }
      return rejectWithMessage(error, rejectWithValue)
    }
  },
)

export const updateCurrentUser = createAsyncThunk(
  'users/updateCurrentUser',
  async (profile, { rejectWithValue }) => {
    try {
      return await updateCurrentUserApi(profile)
    } catch (error) {
      return rejectWithMessage(error, rejectWithValue)
    }
  },
)

export const updateCurrentUserPhoto = createAsyncThunk(
  'users/updateCurrentUserPhoto',
  async (photo, { rejectWithValue }) => {
    try {
      return await updateCurrentUserPhotoApi(photo)
    } catch (error) {
      return rejectWithMessage(error, rejectWithValue)
    }
  },
)
