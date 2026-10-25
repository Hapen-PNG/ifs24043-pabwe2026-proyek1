import { act, renderHook, waitFor } from '@testing-library/react'
import { configureStore } from '@reduxjs/toolkit'
import { createElement } from 'react'
import { Provider } from 'react-redux'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import activityReducer from '../features/activity/states/reducer.js'
import useSearchHistory from './useSearchHistory.js'

const { apiHistory } = vi.hoisted(() => ({ apiHistory: [] }))

vi.mock('../features/activity/api/activityApi.js', () => ({
  getSearchHistoryApi: vi.fn(async () => [...apiHistory]),
  addSearchApi: vi.fn(async (term) => {
    const existing = apiHistory.find(
      (entry) => entry.term.toLocaleLowerCase() === term.toLocaleLowerCase(),
    )
    if (!existing) {
      apiHistory.unshift({
        id: `history-${Date.now()}-${apiHistory.length}`,
        term,
        created_at: new Date().toISOString(),
      })
      apiHistory.splice(8)
    }
    return [...apiHistory]
  }),
  removeSearchApi: vi.fn(async (id) => {
    const index = apiHistory.findIndex((entry) => entry.id === id)
    if (index >= 0) apiHistory.splice(index, 1)
  }),
  clearSearchApi: vi.fn(async () => {
    apiHistory.splice(0)
  }),
  getRecentApi: vi.fn(),
  addRecentApi: vi.fn(),
  getStatsApi: vi.fn(),
  recordPlayApi: vi.fn(),
}))

function createStore() {
  return configureStore({
    reducer: { activity: activityReducer },
  })
}

function withStore(store) {
  return ({ children }) => createElement(Provider, { store }, children)
}

function makeHistory(terms) {
  return terms.map((term, index) => ({
    id: `seed-${index}`,
    term,
    created_at: new Date(0).toISOString(),
  }))
}

describe('useSearchHistory', () => {
  beforeEach(() => {
    apiHistory.splice(0)
    localStorage.clear()
  })

  it('adds a search term to history', async () => {
    const store = createStore()
    const { result } = renderHook(() => useSearchHistory(1), {
      wrapper: withStore(store),
    })

    await waitFor(() => expect(result.current.loading).toBe(false))
    await act(async () => {
      await result.current.addSearch('Langit Senja')
    })

    expect(result.current.history).toContain('Langit Senja')
  })

  it('does not add duplicate terms, ignoring letter case', async () => {
    apiHistory.push(...makeHistory(['Langit Senja']))
    const store = createStore()
    const { result } = renderHook(() => useSearchHistory(1), {
      wrapper: withStore(store),
    })

    await waitFor(() => expect(result.current.history).toEqual(['Langit Senja']))
    await act(async () => {
      await result.current.addSearch('langit senja')
    })

    expect(result.current.history).toEqual(['Langit Senja'])
  })

  it('keeps at most eight history items', async () => {
    apiHistory.push(...makeHistory(Array.from({ length: 8 }, (_, index) => `Lagu ${index + 1}`)))
    const store = createStore()
    const { result } = renderHook(() => useSearchHistory(1), {
      wrapper: withStore(store),
    })

    await waitFor(() => expect(result.current.history).toHaveLength(8))
    await act(async () => {
      await result.current.addSearch('Lagu baru')
    })

    expect(result.current.history).toHaveLength(8)
    expect(result.current.history[0]).toBe('Lagu baru')
    expect(result.current.history).not.toContain('Lagu 8')
  })

  it('clears all search history', async () => {
    apiHistory.push(...makeHistory(['Lagu A', 'Lagu B']))
    const store = createStore()
    const { result } = renderHook(() => useSearchHistory(1), {
      wrapper: withStore(store),
    })

    await waitFor(() => expect(result.current.history).toHaveLength(2))
    await act(async () => {
      await result.current.clearHistory()
    })

    expect(result.current.history).toEqual([])
  })
})
