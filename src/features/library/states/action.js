import { createAsyncThunk } from '@reduxjs/toolkit'
import {
  addPlaylistSongApi,
  createPlaylistApi,
  deleteFavoriteApi,
  deletePlaylistApi,
  getLibraryApi,
  putFavoriteApi,
  removePlaylistSongApi,
  renamePlaylistApi,
} from '../api/libraryApi.js'

function createRequest(type, request) {
  return createAsyncThunk(type, async (argument, { rejectWithValue }) => {
    try {
      return await request(argument)
    } catch (error) {
      return rejectWithValue(error.message)
    }
  })
}

export const fetchLibrary = createRequest('library/fetchLibrary', getLibraryApi)
export const addFavorite = createRequest('library/addFavorite', putFavoriteApi)
export const removeFavorite = createRequest('library/removeFavorite', deleteFavoriteApi)
export const createPlaylist = createRequest(
  'library/createPlaylist',
  ({ name }) => createPlaylistApi(name),
)
export const renamePlaylist = createRequest('library/renamePlaylist', renamePlaylistApi)
export const deletePlaylist = createRequest('library/deletePlaylist', deletePlaylistApi)
export const addPlaylistSong = createRequest('library/addPlaylistSong', addPlaylistSongApi)
export const removePlaylistSong = createRequest('library/removePlaylistSong', removePlaylistSongApi)
