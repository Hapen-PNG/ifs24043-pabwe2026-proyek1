import { configureStore } from '@reduxjs/toolkit'
import { act, renderHook, waitFor } from '@testing-library/react'
import { createElement } from 'react'
import { Provider } from 'react-redux'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import activityReducer from '../features/activity/states/reducer.js'
import useLibraryFeatures from './useLibraryFeatures.js'
import { usePlayer } from '../context/PlayerContext.jsx'

const { getRecentApi } = vi.hoisted(() => ({ getRecentApi: vi.fn() }))

vi.mock('../context/PlayerContext.jsx', () => ({ usePlayer: vi.fn() }))
vi.mock('../features/activity/api/activityApi.js', () => ({
  getRecentApi,
  addRecentApi: vi.fn(),
  getStatsApi: vi.fn(),
  recordPlayApi: vi.fn(),
  getSearchHistoryApi: vi.fn(),
  addSearchApi: vi.fn(),
  removeSearchApi: vi.fn(),
  clearSearchApi: vi.fn(),
}))

function renderFeatures(user) {
  const store = configureStore({ reducer: { activity: activityReducer } })
  const wrapper = ({ children }) => createElement(Provider, { store }, children)
  return { ...renderHook(() => useLibraryFeatures(user), { wrapper }), store }
}

describe('useLibraryFeatures', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    usePlayer.mockReturnValue({
      songs: [{ id: 1, title: 'Catalog version' }],
    })
    getRecentApi.mockResolvedValue([
      { id: 1, title: 'Old version' },
      { id: 2, title: 'Unavailable song' },
    ])
  })

  it('loads recent plays and prefers matching catalog songs', async () => {
    const { result } = renderFeatures({ id: 5 })

    await waitFor(() => expect(result.current.recentLoading).toBe(false))
    expect(getRecentApi).toHaveBeenCalledOnce()
    expect(result.current.recentSongs).toEqual([
      { id: 1, title: 'Catalog version' },
      { id: 2, title: 'Unavailable song' },
    ])
    expect(result.current.recentUnavailable).toBe(false)
  })

  it('does not fetch for an anonymous user', () => {
    const { result } = renderFeatures(null)

    expect(result.current.recentSongs).toEqual([])
    expect(result.current.recentLoading).toBe(false)
    expect(getRecentApi).not.toHaveBeenCalled()
  })

  it('exposes the failed request state', async () => {
    getRecentApi.mockRejectedValue(new Error('offline'))
    const { result } = renderFeatures({ id: 5 })

    await waitFor(() => expect(result.current.recentUnavailable).toBe(true))
    expect(result.current.recentSongs).toEqual([])
  })
})
