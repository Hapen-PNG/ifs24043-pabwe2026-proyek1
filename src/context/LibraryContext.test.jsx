import { configureStore } from '@reduxjs/toolkit'
import { act, renderHook, waitFor } from '@testing-library/react'
import { createElement } from 'react'
import { Provider } from 'react-redux'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { usePlayer } from './PlayerContext.jsx'
import { LibraryProvider, useLibrary } from './LibraryContext.jsx'
import libraryReducer from '../features/library/states/reducer.js'

const { requests } = vi.hoisted(() => ({
  requests: {
    addFavorite: vi.fn(),
    addPlaylistSong: vi.fn(),
    createPlaylist: vi.fn(),
    deletePlaylist: vi.fn(),
    fetchLibrary: vi.fn(),
    removeFavorite: vi.fn(),
    removePlaylistSong: vi.fn(),
    renamePlaylist: vi.fn(),
  },
}))

vi.mock('../context/PlayerContext.jsx', () => ({ usePlayer: vi.fn() }))
vi.mock('../features/library/api/libraryApi.js', () => ({
  addPlaylistSongApi: requests.addPlaylistSong,
  createPlaylistApi: requests.createPlaylist,
  deleteFavoriteApi: requests.removeFavorite,
  deletePlaylistApi: requests.deletePlaylist,
  getLibraryApi: requests.fetchLibrary,
  putFavoriteApi: requests.addFavorite,
  removePlaylistSongApi: requests.removePlaylistSong,
  renamePlaylistApi: requests.renamePlaylist,
}))

const songs = [
  { id: 1, title: 'Pagi', artist: 'Ayu', album: 'Awal' },
  { id: 2, title: 'Malam', artist: 'Nara', album: 'Senja' },
]
const emptyLibrary = { favorites: [], playlists: [], status: 'idle', error: null }

function renderLibrary({ userId = 1, library = emptyLibrary } = {}) {
  const store = configureStore({
    reducer: {
      users: (state = { user: userId === null ? null : { id: userId } }) => state,
      library: libraryReducer,
    },
    preloadedState: { library },
  })
  const wrapper = ({ children }) => createElement(
    Provider,
    { store },
    createElement(LibraryProvider, null, children),
  )
  return { ...renderHook(() => useLibrary(), { wrapper }), store }
}

describe('LibraryContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    usePlayer.mockReturnValue({ songs })
    requests.fetchLibrary.mockResolvedValue(emptyLibrary)
    requests.addFavorite.mockImplementation(async (songId) => songs.find((song) => song.id === songId))
    requests.removeFavorite.mockResolvedValue(undefined)
    requests.createPlaylist.mockImplementation(async (name) => ({
      id: 50,
      name,
      songs: [],
    }))
    requests.renamePlaylist.mockImplementation(async (payload) => ({
      id: payload.id,
      name: payload.name,
      songs: [],
    }))
    requests.deletePlaylist.mockResolvedValue(undefined)
    requests.addPlaylistSong.mockImplementation(async (payload) => ({
      id: payload.playlistId,
      name: 'Mix',
      songs: [songs.find((song) => song.id === payload.songId)],
    }))
    requests.removePlaylistSong.mockResolvedValue(undefined)
  })

  it('throws when useLibrary is rendered outside its provider', () => {
    expect(() => renderHook(() => useLibrary())).toThrow(
      'useLibrary harus digunakan di dalam LibraryProvider.',
    )
  })

  it('clears library state when there is no authenticated user', async () => {
    const { result } = renderLibrary({
      userId: null,
      library: { favorites: [{ id: 9 }], playlists: [], status: 'failed', error: 'old' },
    })

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.favoriteSongs).toEqual([])
    expect(requests.fetchLibrary).not.toHaveBeenCalled()
  })

  it('loads user library and exposes derived favorite and playlist values', async () => {
    requests.fetchLibrary.mockResolvedValue({
      favorites: [songs[0]],
      playlists: [{ id: 4, name: 'Mix', songs: [songs[1]] }],
    })
    const { result } = renderLibrary()

    await waitFor(() => expect(result.current.favoriteSongs).toEqual([songs[0]]))
    expect(result.current.favoriteIds).toEqual([1])
    expect(result.current.playlists).toEqual([
      { id: 4, name: 'Mix', songs: [songs[1]], songIds: [2] },
    ])
    expect(result.current.dataUnavailable).toBe(false)
  })

  it('does not expose stale legacy data when the library load fails', async () => {
    requests.fetchLibrary.mockRejectedValue(new Error('offline'))
    const { result } = renderLibrary()

    await waitFor(() => expect(result.current.dataUnavailable).toBe(true))
    expect(result.current.favoriteSongs).toEqual([])
    expect(result.current.playlists).toEqual([])
  })

  it('ignores favorite toggles for song ids missing from the catalog', async () => {
    const { result } = renderLibrary()

    await act(async () => result.current.toggleFavorite(99))
    expect(requests.addFavorite).not.toHaveBeenCalled()
    expect(requests.removeFavorite).not.toHaveBeenCalled()
  })

  it('optimistically adds and removes a favorite', async () => {
    const { result } = renderLibrary()
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => result.current.toggleFavorite(1))
    expect(requests.addFavorite).toHaveBeenCalledWith(1)
    expect(result.current.favoriteIds).toContain(1)

    await act(async () => result.current.toggleFavorite(1))
    expect(requests.removeFavorite).toHaveBeenCalledWith(1)
    expect(result.current.favoriteIds).not.toContain(1)
  })

  it('rolls back an optimistic favorite update when its request fails', async () => {
    requests.addFavorite.mockRejectedValue(new Error('offline'))
    const { result } = renderLibrary()

    await act(async () => result.current.toggleFavorite(1))

    expect(result.current.favoriteIds).toEqual([])
    expect(result.current.dataUnavailable).toBe(true)
  })

  it('validates playlist names before making a request', async () => {
    const { result } = renderLibrary()

    expect(() => result.current.createPlaylist('  ')).toThrow('Nama playlist wajib diisi.')
    expect(() => result.current.renamePlaylist(1, '  ')).toThrow('Nama playlist wajib diisi.')
  })

  it('creates, renames, and deletes playlists optimistically', async () => {
    const initialPlaylist = { id: 4, name: 'Mix lama', songs: [] }
    requests.fetchLibrary.mockResolvedValue({
      favorites: [],
      playlists: [initialPlaylist],
    })
    const { result } = renderLibrary({
      library: {
        favorites: [],
        playlists: [initialPlaylist],
        status: 'idle',
        error: null,
      },
    })
    await waitFor(() => expect(result.current.playlists[0].id).toBe(4))

    const created = await result.current.createPlaylist('  Pagi  ')
    expect(requests.createPlaylist).toHaveBeenCalledWith('Pagi')
    expect(created).toEqual({ id: 50, name: 'Pagi', songs: [] })

    await act(async () => result.current.renamePlaylist(4, '  Baru  '))
    expect(requests.renamePlaylist).toHaveBeenCalledWith({ id: 4, name: 'Baru' })
    expect(result.current.playlists.find((playlist) => playlist.id === 4).name).toBe('Baru')

    await act(async () => result.current.deletePlaylist(4))
    expect(requests.deletePlaylist).toHaveBeenCalledWith(4)
    expect(result.current.playlists).toEqual([
      { id: 50, name: 'Pagi', songs: [], songIds: [] },
    ])
  })

  it('rolls back failed playlist updates and rejects failed creation result to undefined', async () => {
    requests.createPlaylist.mockRejectedValue(new Error('offline'))
    const { result } = renderLibrary()

    let created
    await act(async () => {
      created = await result.current.createPlaylist('Broken')
    })

    expect(created).toBeUndefined()
    expect(result.current.playlists).toEqual([])
    expect(result.current.dataUnavailable).toBe(true)
  })

  it('adds a song to a playlist, skips duplicates, and ignores unknown songs', async () => {
    const initialPlaylist = { id: 4, name: 'Mix', songs: [] }
    requests.fetchLibrary.mockResolvedValue({
      favorites: [],
      playlists: [initialPlaylist],
    })
    const { result } = renderLibrary({
      library: { ...emptyLibrary, playlists: [initialPlaylist] },
    })
    await waitFor(() => expect(result.current.playlists[0].id).toBe(4))

    await act(async () => result.current.addSongToPlaylist(4, 2))
    expect(requests.addPlaylistSong).toHaveBeenCalledWith({ playlistId: 4, songId: 2 })
    expect(result.current.playlists[0].songIds).toEqual([2])
    const playlistsAfterAddingSong = result.current.playlists

    await act(async () => result.current.addSongToPlaylist(4, 2))
    expect(requests.addPlaylistSong).toHaveBeenCalledTimes(1)
    expect(result.current.playlists).toEqual(playlistsAfterAddingSong)
    await act(async () => result.current.addSongToPlaylist(4, 999))
    expect(requests.addPlaylistSong).toHaveBeenCalledTimes(1)
  })

  it('removes a song from the selected playlist', async () => {
    const initialPlaylist = { id: 4, name: 'Mix', songs: [songs[0], songs[1]] }
    requests.fetchLibrary.mockResolvedValue({
      favorites: [],
      playlists: [initialPlaylist],
    })
    const { result } = renderLibrary({
      library: {
        ...emptyLibrary,
        playlists: [initialPlaylist],
      },
    })
    await waitFor(() => expect(result.current.playlists[0].id).toBe(4))

    await act(async () => result.current.removeSongFromPlaylist(4, 1))

    expect(requests.removePlaylistSong).toHaveBeenCalledWith({ playlistId: 4, songId: 1 })
    expect(result.current.playlists[0].songIds).toEqual([2])
  })
})
