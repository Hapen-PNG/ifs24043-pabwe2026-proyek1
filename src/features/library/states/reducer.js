import { createSlice } from '@reduxjs/toolkit'
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
import { login, logout } from '../../auth/states/action.js'

const initialState = { favorites: [], playlists: [], status: 'idle', error: null }

const librarySlice = createSlice({
  name: 'library',
  initialState,
  reducers: {
    replaceLibrary(_state, action) {
      return action.payload
    },
  },
  extraReducers(builder) {
    builder
      .addCase(login.fulfilled, () => initialState)
      .addCase(logout.fulfilled, () => initialState)
      .addCase(logout.rejected, () => initialState)
      .addCase(fetchLibrary.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchLibrary.fulfilled, (state, action) => ({
        ...state,
        ...action.payload,
        status: 'succeeded',
        error: null,
      }))
      .addCase(fetchLibrary.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload ?? action.error.message
        state.favorites = []
        state.playlists = []
      })
      .addCase(addFavorite.fulfilled, (state, action) => {
        if (!state.favorites.some((song) => song.id === action.payload.id)) {
          state.favorites.unshift(action.payload)
        }
      })
      .addCase(removeFavorite.fulfilled, (state, action) => {
        state.favorites = state.favorites.filter((song) => song.id !== action.meta.arg)
      })
      .addCase(createPlaylist.fulfilled, (state, action) => {
        const pendingIndex = state.playlists.findIndex(
          (playlist) => playlist.id === action.meta.arg.clientId,
        )
        if (pendingIndex >= 0) state.playlists[pendingIndex] = action.payload
        else state.playlists.unshift(action.payload)
      })
      .addCase(renamePlaylist.fulfilled, (state, action) => {
        state.playlists = state.playlists.map((playlist) =>
          playlist.id === action.payload.id ? action.payload : playlist,
        )
      })
      .addCase(deletePlaylist.fulfilled, (state, action) => {
        state.playlists = state.playlists.filter((playlist) => playlist.id !== action.meta.arg)
      })
      .addCase(addPlaylistSong.fulfilled, (state, action) => {
        state.playlists = state.playlists.map((playlist) =>
          playlist.id === action.payload.id ? action.payload : playlist,
        )
      })
      .addCase(removePlaylistSong.fulfilled, (state, action) => {
        state.playlists = state.playlists.map((playlist) =>
          playlist.id === action.meta.arg.playlistId
            ? { ...playlist, songs: playlist.songs.filter((song) => song.id !== action.meta.arg.songId) }
            : playlist,
        )
      })
  },
})

export const { replaceLibrary } = librarySlice.actions
export default librarySlice.reducer
