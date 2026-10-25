import { describe, expect, it } from 'vitest'
import fallbackSongs from '../../../data/songs.js'
import songsReducer from './reducer.js'
import { fetchSongs } from './action.js'

describe('songs reducer', () => {
  it('returns fallback songs in its initial state', () => {
    expect(songsReducer(undefined, { type: 'unknown' })).toEqual({
      items: fallbackSongs,
      status: 'idle',
      error: null,
      source: 'fallback',
    })
  })

  it('sets loading state and clears errors when fetching starts', () => {
    const state = songsReducer(
      { items: fallbackSongs, status: 'failed', error: 'old error', source: 'fallback' },
      fetchSongs.pending('songs-id'),
    )

    expect(state).toMatchObject({
      status: 'loading',
      error: null,
      source: 'fallback',
      items: fallbackSongs,
    })
  })

  it('stores backend songs after a successful fetch', () => {
    const songs = [{ id: 1, title: 'Ruang Senja' }]
    const state = songsReducer(
      undefined,
      fetchSongs.fulfilled(songs, 'songs-id'),
    )

    expect(state).toEqual({
      items: songs,
      status: 'succeeded',
      error: null,
      source: 'backend',
    })
  })

  it('keeps fallback source and stores the error after a rejected fetch', () => {
    const state = songsReducer(
      undefined,
      fetchSongs.rejected(
        { message: 'Network error' },
        'songs-id',
        undefined,
        'Katalog tidak tersedia',
      ),
    )

    expect(state).toMatchObject({
      status: 'failed',
      error: 'Katalog tidak tersedia',
      source: 'fallback',
      items: fallbackSongs,
    })
  })
})
