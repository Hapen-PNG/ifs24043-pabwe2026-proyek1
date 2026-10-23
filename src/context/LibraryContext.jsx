import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { usePlayer } from './PlayerContext.jsx'

const LibraryContext = createContext(null)

function readArray(key) {
  try {
    const value = window.localStorage.getItem(key)
    const parsed = value ? JSON.parse(value) : []
    return Array.isArray(parsed) ? parsed : []
  } catch (error) {
    console.error(`Gagal membaca data koleksi (${key}).`, error)
    return []
  }
}

function getUserKey(user) {
  return user?.id === undefined || user?.id === null
    ? null
    : String(user.id)
}

function initialLibrary(user) {
  const key = getUserKey(user)
  return {
    owner: key,
    favoriteIds: key ? readArray(`mini-music-player:favorites:${key}`) : [],
    playlists: key ? readArray(`mini-music-player:playlists:${key}`) : [],
  }
}

export function LibraryProvider({ children }) {
  const user = useSelector((state) => state.users.user)
  const { songs } = usePlayer()
  const userKey = getUserKey(user)
  const [library, setLibrary] = useState(() => initialLibrary(user))

  useEffect(() => {
    if (library.owner !== userKey) {
      setLibrary(initialLibrary(user))
    }
  }, [library.owner, user, userKey])

  useEffect(() => {
    if (!userKey || library.owner !== userKey) return
    try {
      window.localStorage.setItem(
        `mini-music-player:favorites:${userKey}`,
        JSON.stringify(library.favoriteIds),
      )
      window.localStorage.setItem(
        `mini-music-player:playlists:${userKey}`,
        JSON.stringify(library.playlists),
      )
    } catch (error) {
      console.error('Gagal menyimpan koleksi pengguna.', error)
    }
  }, [library, userKey])

  const toggleFavorite = useCallback((songId) => {
    setLibrary((current) => ({
      ...current,
      favoriteIds: current.favoriteIds.includes(songId)
        ? current.favoriteIds.filter((id) => id !== songId)
        : [songId, ...current.favoriteIds],
    }))
  }, [])

  const createPlaylist = useCallback((name) => {
    const trimmedName = name.trim()
    if (!trimmedName) throw new Error('Nama playlist wajib diisi.')
    const playlist = {
      id: `playlist-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name: trimmedName,
      songIds: [],
    }
    setLibrary((current) => ({
      ...current,
      playlists: [...current.playlists, playlist],
    }))
    return playlist
  }, [])

  const renamePlaylist = useCallback((playlistId, name) => {
    const trimmedName = name.trim()
    if (!trimmedName) throw new Error('Nama playlist wajib diisi.')
    setLibrary((current) => ({
      ...current,
      playlists: current.playlists.map((playlist) =>
        playlist.id === playlistId ? { ...playlist, name: trimmedName } : playlist,
      ),
    }))
  }, [])

  const deletePlaylist = useCallback((playlistId) => {
    setLibrary((current) => ({
      ...current,
      playlists: current.playlists.filter((playlist) => playlist.id !== playlistId),
    }))
  }, [])

  const addSongToPlaylist = useCallback((playlistId, songId) => {
    if (!songs.some((song) => song.id === songId)) return
    setLibrary((current) => ({
      ...current,
      playlists: current.playlists.map((playlist) =>
        playlist.id === playlistId && !playlist.songIds.includes(songId)
          ? { ...playlist, songIds: [...playlist.songIds, songId] }
          : playlist,
      ),
    }))
  }, [songs])

  const removeSongFromPlaylist = useCallback((playlistId, songId) => {
    setLibrary((current) => ({
      ...current,
      playlists: current.playlists.map((playlist) =>
        playlist.id === playlistId
          ? { ...playlist, songIds: playlist.songIds.filter((id) => id !== songId) }
          : playlist,
      ),
    }))
  }, [])

  const favoriteSongs = library.favoriteIds
    .map((id) => songs.find((song) => song.id === id))
    .filter(Boolean)
  const playlists = library.playlists.map((playlist) => ({
    ...playlist,
    songs: playlist.songIds
      .map((id) => songs.find((song) => song.id === id))
      .filter(Boolean),
  }))

  return (
    <LibraryContext.Provider
      value={{
        favoriteIds: library.favoriteIds,
        favoriteSongs,
        playlists,
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
