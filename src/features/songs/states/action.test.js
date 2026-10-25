import { configureStore } from '@reduxjs/toolkit'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchSongs } from './action.js'

const { getSongsApi } = vi.hoisted(() => ({ getSongsApi: vi.fn() }))

vi.mock('../api/songApi.js', () => ({ getSongsApi }))

const store = configureStore({ reducer: (state = {}) => state })

describe('fetchSongs', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns songs from the API', async () => {
    const songs = [{ id: 1, title: 'Pagi' }]
    getSongsApi.mockResolvedValue(songs)

    const result = await store.dispatch(fetchSongs())

    expect(result.meta.requestStatus).toBe('fulfilled')
    expect(result.payload).toEqual(songs)
  })

  it('rejects with the API error message', async () => {
    getSongsApi.mockRejectedValue(new Error('Katalog tidak tersedia'))

    const result = await store.dispatch(fetchSongs())

    expect(result.meta.requestStatus).toBe('rejected')
    expect(result.payload).toBe('Katalog tidak tersedia')
  })
})
