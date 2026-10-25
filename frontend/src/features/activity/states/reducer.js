import { createSlice } from '@reduxjs/toolkit'
import {
  addSearchHistory,
  clearSearchHistory,
  fetchRecent,
  fetchSearchHistory,
  fetchStats,
  recordPlay,
  recordRecent,
  removeSearchHistory,
} from './action.js'
import { login, logout } from '../../auth/states/action.js'

const initialState = {
  recent: [],
  stats: { totalPlays: 0, topPlayed: [] },
  searchHistory: [],
  recentStatus: 'idle',
  statsStatus: 'idle',
  searchHistoryStatus: 'idle',
}

const activitySlice = createSlice({
  name: 'activity',
  initialState,
  reducers: {
    replaceActivity(_state, action) {
      return { ...initialState, ...action.payload }
    },
    setSearchHistory(state, action) {
      state.searchHistory = action.payload
    },
    addRecentOptimistically(state, action) {
      state.recent = [
        action.payload,
        ...state.recent.filter((song) => song.id !== action.payload.id),
      ].slice(0, 5)
    },
  },
  extraReducers(builder) {
    builder
      .addCase(login.fulfilled, () => initialState)
      .addCase(logout.fulfilled, () => initialState)
      .addCase(logout.rejected, () => initialState)
      .addCase(fetchRecent.pending, (state) => { state.recentStatus = 'loading' })
      .addCase(fetchRecent.fulfilled, (state, action) => {
        state.recentStatus = 'succeeded'
        state.recent = action.payload
      })
      .addCase(fetchRecent.rejected, (state) => {
        state.recentStatus = 'failed'
        state.recent = []
      })
      .addCase(recordRecent.fulfilled, (state, action) => { state.recent = action.payload })
      .addCase(recordRecent.rejected, (state, action) => {
        state.recent = state.recent.filter((song) => song.id !== action.meta.arg)
        state.recentStatus = 'failed'
      })
      .addCase(recordPlay.pending, (state, action) => {
        const song = action.meta.arg
        state.stats.totalPlays += 1
        const current = state.stats.topPlayed.find((item) => item.id === song.id)
        if (current) current.count += 1
        else state.stats.topPlayed.push({ ...song, count: 1 })
        state.stats.topPlayed.sort((a, b) => b.count - a.count)
        state.stats.topPlayed = state.stats.topPlayed.slice(0, 3)
      })
      .addCase(recordPlay.rejected, (state, action) => {
        const songId = action.meta.arg.id
        state.stats.totalPlays = Math.max(0, state.stats.totalPlays - 1)
        const current = state.stats.topPlayed.find((item) => item.id === songId)
        if (current) current.count = Math.max(0, current.count - 1)
        state.stats.topPlayed = state.stats.topPlayed.filter((item) => item.count > 0)
        state.statsStatus = 'failed'
      })
      .addCase(fetchStats.pending, (state) => { state.statsStatus = 'loading' })
      .addCase(fetchStats.fulfilled, (state, action) => {
        state.statsStatus = 'succeeded'
        state.stats = action.payload
      })
      .addCase(fetchStats.rejected, (state) => {
        state.statsStatus = 'failed'
        state.stats = { totalPlays: 0, topPlayed: [] }
      })
      .addCase(fetchSearchHistory.pending, (state) => { state.searchHistoryStatus = 'loading' })
      .addCase(fetchSearchHistory.fulfilled, (state, action) => {
        state.searchHistoryStatus = 'succeeded'
        state.searchHistory = action.payload
      })
      .addCase(fetchSearchHistory.rejected, (state) => {
        state.searchHistoryStatus = 'failed'
        state.searchHistory = []
      })
      .addCase(addSearchHistory.fulfilled, (state, action) => {
        state.searchHistoryStatus = 'succeeded'
        state.searchHistory = action.payload
      })
      .addCase(addSearchHistory.rejected, (state) => { state.searchHistoryStatus = 'failed' })
      .addCase(removeSearchHistory.fulfilled, (state, action) => {
        state.searchHistoryStatus = 'succeeded'
        state.searchHistory = state.searchHistory.filter((item) => item.id !== action.meta.arg)
      })
      .addCase(removeSearchHistory.rejected, (state) => { state.searchHistoryStatus = 'failed' })
      .addCase(clearSearchHistory.fulfilled, (state) => {
        state.searchHistoryStatus = 'succeeded'
        state.searchHistory = []
      })
      .addCase(clearSearchHistory.rejected, (state) => { state.searchHistoryStatus = 'failed' })
  },
})

export const { addRecentOptimistically, replaceActivity, setSearchHistory } = activitySlice.actions
export default activitySlice.reducer
