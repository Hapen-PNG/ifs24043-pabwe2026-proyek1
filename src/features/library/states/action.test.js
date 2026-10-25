import { configureStore } from '@reduxjs/toolkit'
import { beforeEach, describe, expect, it, vi } from 'vitest'
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

const { api } = vi.hoisted(() => ({
  api: {
    addPlaylistSongApi: vi.fn(),
    createPlaylistApi: vi.fn(),
    deleteFavoriteApi: vi.fn(),
    deletePlaylistApi: vi.fn(),
    getLibraryApi: vi.fn(),
    putFavoriteApi: vi.fn(),
    removePlaylistSongApi: vi.fn(),
    renamePlaylistApi: vi.fn(),
  },
}))

vi.mock('../api/libraryApi.js', () => api)

const store = configureStore({ reducer: (state = {}) => state })

describe('library actions', () => {
  beforeEach(() => vi.clearAllMocks())

  it.each([
    ['fetchLibrary', fetchLibrary, api.getLibraryApi, undefined, { favorites: [], playlists: [] }],
    ['addFavorite', addFavorite, api.putFavoriteApi, 4, { id: 4 }],
    ['removeFavorite', removeFavorite, api.deleteFavoriteApi, 4, undefined],
    ['createPlaylist', createPlaylist, api.createPlaylistApi, { name: 'Pagi', clientId: 'local' }, { id: 8 }],
    ['renamePlaylist', renamePlaylist, api.renamePlaylistApi, { id: 8, name: 'Malam' }, { id: 8 }],
    ['deletePlaylist', deletePlaylist, api.deletePlaylistApi, 8, undefined],
    ['addPlaylistSong', addPlaylistSong, api.addPlaylistSongApi, { playlistId: 8, songId: 4 }, { id: 8 }],
    ['removePlaylistSong', removePlaylistSong, api.removePlaylistSongApi, { playlistId: 8, songId: 4 }, undefined],
  ])('dispatches %s to the API and returns its value', async (_name, action, request, args, result) => {
    request.mockResolvedValue(result)

    const dispatched = await store.dispatch(action(args))

    expect(dispatched.meta.requestStatus).toBe('fulfilled')
    expect(request).toHaveBeenCalledWith(
      _name === 'createPlaylist' ? 'Pagi' : args,
    )
    expect(dispatched.payload).toEqual(result)
  })

  it('rejects with the API error message', async () => {
    api.putFavoriteApi.mockRejectedValue(new Error('Lagu tidak ditemukan'))

    const dispatched = await store.dispatch(addFavorite(404))

    expect(dispatched.meta.requestStatus).toBe('rejected')
    expect(dispatched.payload).toBe('Lagu tidak ditemukan')
  })
})
