import { createSlice } from '@reduxjs/toolkit'
import fallbackSongs from '../../../data/songs.js'
import { fetchSongs } from './action.js'

const songsSlice = createSlice({
  name: 'songs',
  initialState: { items: fallbackSongs, status: 'idle', error: null, source: 'fallback' },
  reducers: {},
  extraReducers(builder) {
    builder
      .addCase(fetchSongs.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchSongs.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.items = action.payload
        state.source = 'backend'
      })
      .addCase(fetchSongs.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload ?? action.error.message
        state.source = 'fallback'
      })
  },
})

export default songsSlice.reducer
