import { createAsyncThunk } from '@reduxjs/toolkit'
import {
  addRecentApi,
  addSearchApi,
  clearSearchApi,
  getRecentApi,
  getSearchHistoryApi,
  getStatsApi,
  recordPlayApi,
  removeSearchApi,
} from '../api/activityApi.js'

function createRequest(type, request) {
  return createAsyncThunk(type, async (argument, { rejectWithValue }) => {
    try {
      return await request(argument)
    } catch (error) {
      return rejectWithValue(error.message)
    }
  })
}

export const fetchRecent = createRequest('activity/fetchRecent', getRecentApi)
export const recordRecent = createRequest('activity/recordRecent', addRecentApi)
export const fetchStats = createRequest('activity/fetchStats', getStatsApi)
export const recordPlay = createRequest('activity/recordPlay', (song) => recordPlayApi(song.id))
export const fetchSearchHistory = createRequest('activity/fetchSearchHistory', getSearchHistoryApi)
export const addSearchHistory = createRequest('activity/addSearchHistory', addSearchApi)
export const removeSearchHistory = createRequest('activity/removeSearchHistory', removeSearchApi)
export const clearSearchHistory = createRequest('activity/clearSearchHistory', clearSearchApi)
