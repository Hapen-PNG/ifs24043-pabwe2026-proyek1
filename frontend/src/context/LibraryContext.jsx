import { createContext, useCallback, useContext, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { usePlayer } from './PlayerContext.jsx'
import { clearLegacyData } from '../helpers/legacyData.js'
import {
  addFavorite as addFavoriteRequest,
  addPlaylistSong as addPlaylistSongRequest,
  createPlaylist as createPlaylistRequest,
  deletePlaylist as deletePlaylistRequest,
  fetchLibrary,
  removeFavorite as removeFavoriteRequest,
  removePlaylistSong as removePlaylistSongRequest,
  renamePlaylist as renamePlaylistRequest,
} from '../features/library/states/action.js'
import { replaceLibrary } from '../features/library/states/reducer.js'

const LibraryContext = createContext(null)

function takeSnapshot(library) {
  return {
    ...library,
    favorites: [...library.favorites],
    playlists: library.playlists.map((playlist) => ({
      ...playlist,
      songs: [...(playlist.songs ?? [])],
    })),
  }
}

export function LibraryProvider({ children }) {
  const dispatch = useDispatch()
  const userId = useSelector((state) => state.users.user?.id)
  const library = useSelector((state) => state.library)
  const { songs } = usePlayer()

  useEffect(() => {
    if (userId === undefined || userId === null) {
      dispatch(replaceLibrary({ favorites: [], playlists: [], status: 'idle', error: null }))
      return
    }
    dispatch(fetchLibrary())
      .unwrap()
      .then(() => clearLegacyData(['favorites', 'playlists']))
      .catch(() => {})
  }, [dispatch, userId])

  const performOptimistic = useCallback(async (optimisticUpdate, request) => {
    const snapshot = takeSnapshot(library)
    dispatch(replaceLibrary(optimisticUpdate(snapshot)))
    try {
      return await request()
    } catch (error) {
      dispatch(replaceLibrary({ ...snapshot, status: 'failed', error: error.message }))
      return undefined
    }
  }, [dispatch, library])

  const toggleFavorite = useCallback((songId) => {
    const exists = library.favorites.some((song) => song.id === songId)
    const song = songs.find((item) => item.id === songId)
    if (!exists && !song) return Promise.resolve()
    return performOptimistic(
      (snapshot) => ({
        ...snapshot,
        favorites: exists
          ? snapshot.favorites.filter((item) => item.id !== songId)
          : [song, ...snapshot.favorites],
      }),
      async () => {
        if (exists) await dispatch(removeFavoriteRequest(songId)).unwrap()
        else await dispatch(addFavoriteRequest(songId)).unwrap()
      },
    )
  }, [dispatch, library.favorites, performOptimistic, songs])

  const createPlaylist = useCallback((name) => {
    const trimmedName = name.trim()
    if (!trimmedName) throw new Error('Nama playlist wajib diisi.')
    const clientId = `pending-${Date.now()}-${Math.random().toString(36).slice(2)}`
    const pendingPlaylist = { id: clientId, name: trimmedName, songs: [] }
    return performOptimistic(
      (snapshot) => ({ ...snapshot, playlists: [pendingPlaylist, ...snapshot.playlists] }),
      () => dispatch(createPlaylistRequest({ name: trimmedName, clientId })).unwrap(),
    )
  }, [dispatch, performOptimistic])

  const renamePlaylist = useCallback((playlistId, name) => {
    const trimmedName = name.trim()
    if (!trimmedName) throw new Error('Nama playlist wajib diisi.')
    return performOptimistic(
      (snapshot) => ({
        ...snapshot,
        playlists: snapshot.playlists.map((playlist) =>
          playlist.id === playlistId ? { ...playlist, name: trimmedName } : playlist,
        ),
      }),
      () => dispatch(renamePlaylistRequest({ id: playlistId, name: trimmedName })).unwrap(),
    )
  }, [dispatch, performOptimistic])

  const deletePlaylist = useCallback((playlistId) => performOptimistic(
    (snapshot) => ({
      ...snapshot,
      playlists: snapshot.playlists.filter((playlist) => playlist.id !== playlistId),
    }),
    () => dispatch(deletePlaylistRequest(playlistId)).unwrap(),
  ), [dispatch, performOptimistic])

  const addSongToPlaylist = useCallback((playlistId, songId) => {
    if (!songs.some((song) => song.id === songId)) return Promise.resolve()
    return performOptimistic(
      (snapshot) => ({
        ...snapshot,
        playlists: snapshot.playlists.map((playlist) =>
          playlist.id === playlistId && !playlist.songs.some((song) => song.id === songId)
            ? { ...playlist, songs: [...playlist.songs, songs.find((song) => song.id === songId)] }
            : playlist,
        ),
      }),
      () => dispatch(addPlaylistSongRequest({ playlistId, songId })).unwrap(),
    )
  }, [dispatch, performOptimistic, songs])

  const removeSongFromPlaylist = useCallback((playlistId, songId) => performOptimistic(
    (snapshot) => ({
      ...snapshot,
      playlists: snapshot.playlists.map((playlist) =>
        playlist.id === playlistId
          ? { ...playlist, songs: playlist.songs.filter((song) => song.id !== songId) }
          : playlist,
      ),
    }),
    () => dispatch(removePlaylistSongRequest({ playlistId, songId })).unwrap(),
  ), [dispatch, performOptimistic])

  const favoriteIds = library.favorites.map((song) => song.id)
  const playlists = library.playlists.map((playlist) => ({
    ...playlist,
    songIds: playlist.songs.map((song) => song.id),
  }))

  return (
    <LibraryContext.Provider
      value={{
        favoriteIds,
        favoriteSongs: library.favorites,
        playlists,
        loading: library.status === 'loading',
        dataUnavailable: library.status === 'failed',
        toggleFavorite,
        createPlaylist,
        renamePlaylist,
        deletePlaylist,
        addSongToPlaylist,
        removeSongFromPlaylist,
      }}
    >
      {children}
    </LibraryContext.Provider>
  )
}

export function useLibrary() {
  const library = useContext(LibraryContext)
  if (!library) throw new Error('useLibrary harus digunakan di dalam LibraryProvider.')
  return library
}
