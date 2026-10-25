import { configureStore } from '@reduxjs/toolkit'
import { act, renderHook, waitFor } from '@testing-library/react'
import { createElement } from 'react'
import { Provider } from 'react-redux'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import activityReducer from '../features/activity/states/reducer.js'
import usePlaybackStats from './usePlaybackStats.js'

const { getStatsApi, recordPlayApi } = vi.hoisted(() => ({
  getStatsApi: vi.fn(),
  recordPlayApi: vi.fn(),
}))

vi.mock('../features/activity/api/activityApi.js', () => ({
  getRecentApi: vi.fn(),
  addRecentApi: vi.fn(),
  getStatsApi,
  recordPlayApi,
  getSearchHistoryApi: vi.fn(),
  addSearchApi: vi.fn(),
  removeSearchApi: vi.fn(),
  clearSearchApi: vi.fn(),
}))

function renderStats(audio, song, user = { id: 8 }) {
  const store = configureStore({ reducer: { activity: activityReducer } })
  const wrapper = ({ children }) => createElement(Provider, { store }, children)
  return {
    ...renderHook(() => usePlaybackStats({ current: audio }, song, user), { wrapper }),
    store,
  }
}

describe('usePlaybackStats', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getStatsApi.mockResolvedValue({
      totalPlays: 3,
      topPlayed: [{ id: 1, title: 'Pagi', count: 2 }],
    })
    recordPlayApi.mockResolvedValue({})
  })

  it('loads and derives statistics and records valid audio play events', async () => {
    const audio = new EventTarget()
    const addListener = vi.spyOn(audio, 'addEventListener')
    const { result, store } = renderStats(audio, { id: '1', title: 'Pagi' })

    await waitFor(() => expect(result.current.statsLoading).toBe(false))
    expect(result.current.totalPlayCount).toBe(3)
    expect(result.current.topPlayedSongs).toEqual([{ id: 1, title: 'Pagi', count: 2 }])
    expect(result.current.playCounts).toEqual({ 1: 2 })
    expect(result.current.currentSongId).toBe('1')
    expect(addListener).toHaveBeenCalledWith('play', expect.any(Function))

    await act(async () => {
      audio.dispatchEvent(new Event('play'))
      await Promise.resolve()
    })
    await waitFor(() => expect(recordPlayApi).toHaveBeenCalledWith('1'))
    expect(store.getState().activity.stats.totalPlays).toBe(4)
  })

  it('skips loading and event registration without a user or audio element', () => {
    const { result } = renderStats(null, null, null)

    expect(result.current.currentSongId).toBeUndefined()
    expect(result.current.statsLoading).toBe(false)
    expect(getStatsApi).not.toHaveBeenCalled()
  })

  it('ignores invalid song identifiers and removes the listener on unmount', async () => {
    const audio = new EventTarget()
    const removeListener = vi.spyOn(audio, 'removeEventListener')
    const { unmount } = renderStats(audio, { id: 1.5 })

    await waitFor(() => expect(getStatsApi).toHaveBeenCalledOnce())
    await act(async () => audio.dispatchEvent(new Event('play')))
    expect(recordPlayApi).not.toHaveBeenCalled()

    unmount()
    expect(removeListener).toHaveBeenCalledWith('play', expect.any(Function))
  })

  it('exposes a statistics request failure', async () => {
    getStatsApi.mockRejectedValue(new Error('offline'))
    const { result } = renderStats(new EventTarget(), { id: 1 })

    await waitFor(() => expect(result.current.statsUnavailable).toBe(true))
    expect(result.current.totalPlayCount).toBe(0)
    expect(result.current.topPlayedSongs).toEqual([])
  })
})
