import { configureStore } from '@reduxjs/toolkit'
import { beforeEach, describe, expect, it, vi } from 'vitest'
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

const { api } = vi.hoisted(() => ({
  api: {
    addRecentApi: vi.fn(),
    addSearchApi: vi.fn(),
    clearSearchApi: vi.fn(),
    getRecentApi: vi.fn(),
    getSearchHistoryApi: vi.fn(),
    getStatsApi: vi.fn(),
    recordPlayApi: vi.fn(),
    removeSearchApi: vi.fn(),
  },
}))

vi.mock('../api/activityApi.js', () => api)

const store = configureStore({ reducer: (state = {}) => state })

describe('activity actions', () => {
  beforeEach(() => vi.clearAllMocks())

  it.each([
    ['fetchRecent', fetchRecent, api.getRecentApi, undefined, [{ id: 1 }], undefined],
    ['recordRecent', recordRecent, api.addRecentApi, 1, [{ id: 1 }], 1],
    ['fetchStats', fetchStats, api.getStatsApi, undefined, { totalPlays: 2 }, undefined],
    ['recordPlay', recordPlay, api.recordPlayApi, { id: 5 }, { count: 1 }, 5],
    ['fetchSearchHistory', fetchSearchHistory, api.getSearchHistoryApi, undefined, [{ id: 1 }], undefined],
    ['addSearchHistory', addSearchHistory, api.addSearchApi, 'Pagi', [{ term: 'Pagi' }], 'Pagi'],
    ['removeSearchHistory', removeSearchHistory, api.removeSearchApi, 3, undefined, 3],
    ['clearSearchHistory', clearSearchHistory, api.clearSearchApi, undefined, undefined, undefined],
  ])('dispatches %s and returns successful API result', async (_name, action, request, args, result, apiArg) => {
    request.mockResolvedValue(result)

    const dispatched = await store.dispatch(action(args))

    expect(dispatched.meta.requestStatus).toBe('fulfilled')
    expect(dispatched.payload).toEqual(result)
    expect(request).toHaveBeenCalledWith(apiArg)
  })

  it('rejects with the API message', async () => {
    api.addSearchApi.mockRejectedValue(new Error('Search history unavailable'))

    const result = await store.dispatch(addSearchHistory('Pagi'))

    expect(result.meta.requestStatus).toBe('rejected')
    expect(result.payload).toBe('Search history unavailable')
  })
})
