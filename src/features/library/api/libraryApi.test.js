import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as libraryApi from './libraryApi.js'

const { backendApi } = vi.hoisted(() => ({ backendApi: vi.fn() }))

vi.mock('../../../helpers/backendApi.js', () => ({ backendApi }))

describe('library API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads favorites and playlists together and propagates a failed request', async () => {
    backendApi
      .mockResolvedValueOnce({ data: { favorites: [{ id: 1 }] } })
      .mockResolvedValueOnce({ data: { playlists: [{ id: 2 }] } })

    await expect(libraryApi.getLibraryApi()).resolves.toEqual({
      favorites: [{ id: 1 }],
      playlists: [{ id: 2 }],
    })
    expect(backendApi).toHaveBeenNthCalledWith(1, '/favorites')
    expect(backendApi).toHaveBeenNthCalledWith(2, '/playlists')

    const failure = new Error('offline')
    backendApi.mockRejectedValueOnce(failure)
    backendApi.mockResolvedValueOnce({ data: { playlists: [] } })
    await expect(libraryApi.getLibraryApi()).rejects.toBe(failure)
  })

  it('maps favorite and playlist CRUD calls and response data', async () => {
    backendApi
      .mockResolvedValueOnce({ data: { favorite: { id: 4 } } })
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({ data: { playlist: { id: 5 } } })
      .mockResolvedValueOnce({ data: { playlist: { id: 5, name: 'Mix' } } })
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({ data: { playlist: { id: 5, songs: [{ id: 1 }] } } })
      .mockResolvedValueOnce(undefined)

    await expect(libraryApi.putFavoriteApi(4)).resolves.toEqual({ id: 4 })
    await expect(libraryApi.deleteFavoriteApi(4)).resolves.toBeUndefined()
    await expect(libraryApi.createPlaylistApi('Mix')).resolves.toEqual({ id: 5 })
    await expect(libraryApi.renamePlaylistApi({ id: 5, name: 'Mix' }))
      .resolves.toEqual({ id: 5, name: 'Mix' })
    await expect(libraryApi.deletePlaylistApi(5)).resolves.toBeUndefined()
    await expect(libraryApi.addPlaylistSongApi({ playlistId: 5, songId: 1 }))
      .resolves.toEqual({ id: 5, songs: [{ id: 1 }] })
    await expect(libraryApi.removePlaylistSongApi({ playlistId: 5, songId: 1 }))
      .resolves.toBeUndefined()

    expect(backendApi.mock.calls).toEqual([
      ['/favorites/4', { method: 'PUT' }],
      ['/favorites/4', { method: 'DELETE' }],
      ['/playlists', { method: 'POST', body: { name: 'Mix' } }],
      ['/playlists/5', { method: 'PATCH', body: { name: 'Mix' } }],
      ['/playlists/5', { method: 'DELETE' }],
      ['/playlists/5/songs', { method: 'POST', body: { songId: 1 } }],
      ['/playlists/5/songs/1', { method: 'DELETE' }],
    ])
  })
})
