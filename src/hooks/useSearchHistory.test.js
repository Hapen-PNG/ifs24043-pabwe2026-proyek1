import { act, renderHook, waitFor } from '@testing-library/react'
import { configureStore } from '@reduxjs/toolkit'
import { createElement } from 'react'
import { Provider } from 'react-redux'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import activityReducer from '../features/activity/states/reducer.js'
import useSearchHistory from './useSearchHistory.js'

const { apiHistory, requests } = vi.hoisted(() => ({
  apiHistory: [],
  requests: {
    fetch: vi.fn(),
    add: vi.fn(),
    remove: vi.fn(),
    clear: vi.fn(),
  },
}))

vi.mock('../features/activity/api/activityApi.js', () => ({
  getSearchHistoryApi: requests.fetch,
  addSearchApi: requests.add,
  removeSearchApi: requests.remove,
  clearSearchApi: requests.clear,
  getRecentApi: vi.fn(),
  addRecentApi: vi.fn(),
  getStatsApi: vi.fn(),
  recordPlayApi: vi.fn(),
}))

function addToApiHistory(term) {
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
}

function removeFromApiHistory(id) {
    const index = apiHistory.findIndex((entry) => entry.id === id)
    if (index >= 0) apiHistory.splice(index, 1)
}

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
    vi.clearAllMocks()
    requests.fetch.mockImplementation(async () => [...apiHistory])
    requests.add.mockImplementation(async (term) => addToApiHistory(term))
    requests.remove.mockImplementation(async (id) => removeFromApiHistory(id))
    requests.clear.mockImplementation(async () => apiHistory.splice(0))
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

  it('ignores blank terms, unknown entries, and operations for anonymous users', async () => {
    const store = createStore()
    const { result } = renderHook(() => useSearchHistory(null), {
      wrapper: withStore(store),
    })

    await act(async () => {
      await result.current.addSearch('  ')
      await result.current.addSearch('Term')
      await result.current.removeSearch('missing')
      await result.current.clearHistory()
    })

    expect(requests.fetch).not.toHaveBeenCalled()
    expect(requests.add).not.toHaveBeenCalled()
    expect(requests.remove).not.toHaveBeenCalled()
    expect(requests.clear).not.toHaveBeenCalled()
  })

  it('removes a selected search term', async () => {
    apiHistory.push(...makeHistory(['A', 'B']))
    const store = createStore()
    const { result } = renderHook(() => useSearchHistory(1), {
      wrapper: withStore(store),
    })
    await waitFor(() => expect(result.current.history).toEqual(['A', 'B']))

    await act(async () => result.current.removeSearch('A'))
    expect(result.current.history).toEqual(['B'])
    expect(requests.remove).toHaveBeenCalledWith('seed-0')
  })

  it('restores previous state when add, remove, or clear fails', async () => {
    apiHistory.push(...makeHistory(['Seed']))
    const store = createStore()
    const { result } = renderHook(() => useSearchHistory(1), {
      wrapper: withStore(store),
    })
    await waitFor(() => expect(result.current.history).toEqual(['Seed']))

    requests.add.mockRejectedValueOnce(new Error('add failed'))
    await act(async () => result.current.addSearch('New'))
    expect(result.current.history).toEqual(['Seed'])

    requests.remove.mockRejectedValueOnce(new Error('remove failed'))
    await act(async () => result.current.removeSearch('Seed'))
    expect(result.current.history).toEqual(['Seed'])

    requests.clear.mockRejectedValueOnce(new Error('clear failed'))
    await act(async () => result.current.clearHistory())
    expect(result.current.history).toEqual(['Seed'])
  })
})
