import { createAsyncThunk } from '@reduxjs/toolkit'
import {
  changePasswordApi,
  loginApi,
  logoutApi,
  registerApi,
} from '../api/authApi.js'

function rejectWithMessage(error, rejectWithValue) {
  return rejectWithValue(
    {
      message: error instanceof Error ? error.message : 'Permintaan gagal. Silakan coba lagi.',
      status: error?.status,
    },
  )
}

export const login = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      return await loginApi(credentials)
    } catch (error) {
      return rejectWithMessage(error, rejectWithValue)
    }
  },
)

export const register = createAsyncThunk(
  'auth/register',
  async (details, { rejectWithValue }) => {
    try {
      return await registerApi(details)
    } catch (error) {
      return rejectWithMessage(error, rejectWithValue)
    }
  },
)

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      return await logoutApi()
    } catch (error) {
      return rejectWithMessage(error, rejectWithValue)
    }
  },
)

export const changePassword = createAsyncThunk(
  'auth/changePassword',
  async (passwords, { rejectWithValue }) => {
    try {
      return await changePasswordApi(passwords)
    } catch (error) {
      return rejectWithMessage(error, rejectWithValue)
    }
  },
)
