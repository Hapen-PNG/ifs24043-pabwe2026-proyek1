import { describe, expect, it } from 'vitest'
import { login, logout } from '../../auth/states/action.js'
import {
  addFavorite,
  addPlaylistSong,
  createPlaylist,
  deletePlaylist,
  fetchLibrary,
  removeFavorite,
  removePlaylistSong,
  renamePlaylist,
} from './action.js'
import libraryReducer from './reducer.js'

const initialState = { favorites: [], playlists: [], status: 'idle', error: null }

describe('library reducer', () => {
  it('returns its initial state', () => {
    expect(libraryReducer(undefined, { type: 'unknown' })).toEqual(initialState)
  })

  it.each([
    ['login.fulfilled', login.fulfilled({ token: 'token', user: {} }, 'login-id', {})],
    ['logout.fulfilled', logout.fulfilled(undefined, 'logout-id')],
    ['logout.rejected', logout.rejected({ message: 'Network error' }, 'logout-id')],
  ])('resets library on %s', (_label, action) => {
    expect(
      libraryReducer(
        { favorites: [{ id: 1 }], playlists: [{ id: 2 }], status: 'failed', error: 'error' },
        action,
      ),
    ).toEqual(initialState)
  })

  it('handles fetchLibrary pending, fulfilled, and rejected actions', () => {
    const pending = libraryReducer(
      { ...initialState, error: 'previous error' },
      fetchLibrary.pending('library-id'),
    )
    expect(pending).toMatchObject({ status: 'loading', error: null })

    const library = { favorites: [{ id: 1 }], playlists: [{ id: 2, name: 'Pagi' }] }
    const fulfilled = libraryReducer(
      pending,
      fetchLibrary.fulfilled(library, 'library-id'),
    )
    expect(fulfilled).toEqual({ ...library, status: 'succeeded', error: null })

    const rejected = libraryReducer(
      fulfilled,
      fetchLibrary.rejected(
        { message: 'Network error' },
        'library-id',
        undefined,
        'Koleksi gagal dimuat',
      ),
    )
    expect(rejected).toEqual({
      favorites: [],
      playlists: [],
      status: 'failed',
      error: 'Koleksi gagal dimuat',
    })
  })

  it('adds favorites once and removes a favorite by id', () => {
    const song = { id: 5, title: 'Senja' }
    const withFavorite = libraryReducer(
      initialState,
      addFavorite.fulfilled(song, 'add-favorite-id', 5),
    )
    const withoutDuplicate = libraryReducer(
      withFavorite,
      addFavorite.fulfilled(song, 'add-duplicate-id', 5),
    )
    expect(withoutDuplicate.favorites).toEqual([song])

    const removed = libraryReducer(
      withoutDuplicate,
      removeFavorite.fulfilled(undefined, 'remove-favorite-id', 5),
    )
    expect(removed.favorites).toEqual([])
  })

  it('creates and renames playlists', () => {
    const pendingPlaylist = { id: 'client-1', name: 'Draft', songs: [] }
    const state = { ...initialState, playlists: [pendingPlaylist] }
    const createdPlaylist = { id: 10, name: 'Baru', songs: [] }
    const created = libraryReducer(
      state,
      createPlaylist.fulfilled(createdPlaylist, 'create-id', {
        clientId: 'client-1',
        name: 'Baru',
      }),
    )
    expect(created.playlists).toEqual([createdPlaylist])

    const renamedPlaylist = { ...createdPlaylist, name: 'Pagi' }
    const renamed = libraryReducer(
      created,
      renamePlaylist.fulfilled(renamedPlaylist, 'rename-id', {
        id: 10,
        name: 'Pagi',
      }),
    )
    expect(renamed.playlists).toEqual([renamedPlaylist])
  })

  it('prepends a created playlist when no optimistic client entry exists', () => {
    const playlist = { id: 12, name: 'Malam', songs: [] }
    const state = { ...initialState, playlists: [{ id: 3, name: 'Lama', songs: [] }] }

    expect(
      libraryReducer(
        state,
        createPlaylist.fulfilled(playlist, 'create-id', { clientId: 'missing', name: 'Malam' }),
      ).playlists,
    ).toEqual([playlist, ...state.playlists])
  })

  it('deletes a playlist by id', () => {
    const state = {
      ...initialState,
      playlists: [{ id: 1, name: 'Keep' }, { id: 2, name: 'Delete' }],
    }

    expect(
      libraryReducer(state, deletePlaylist.fulfilled(undefined, 'delete-id', 2)).playlists,
    ).toEqual([{ id: 1, name: 'Keep' }])
  })

  it('adds and removes songs from a playlist', () => {
    const originalPlaylist = { id: 1, name: 'Favorit', songs: [{ id: 2 }] }
    const addedPlaylist = {
      id: 1,
      name: 'Favorit',
      songs: [{ id: 2 }, { id: 3 }],
    }
    const afterAdd = libraryReducer(
      { ...initialState, playlists: [originalPlaylist] },
      addPlaylistSong.fulfilled(addedPlaylist, 'add-song-id', {
        playlistId: 1,
        songId: 3,
      }),
    )
    expect(afterAdd.playlists).toEqual([addedPlaylist])

    const afterRemove = libraryReducer(
      afterAdd,
      removePlaylistSong.fulfilled(undefined, 'remove-song-id', {
        playlistId: 1,
        songId: 2,
      }),
    )
    expect(afterRemove.playlists).toEqual([{ ...addedPlaylist, songs: [{ id: 3 }] }])
  })
})
