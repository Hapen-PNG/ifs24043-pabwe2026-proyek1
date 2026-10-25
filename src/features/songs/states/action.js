import { createAsyncThunk } from '@reduxjs/toolkit'
import { getSongsApi } from '../api/songApi.js'

export const fetchSongs = createAsyncThunk(
  'songs/fetchSongs',
  async (_, { rejectWithValue }) => {
    try {
      return await getSongsApi()
    } catch (error) {
      return rejectWithValue(error.message)
    }
  },
)
