import { backendApi } from '../../../helpers/backendApi.js'

export async function getLibraryApi() {
  const [favoritesResponse, playlistsResponse] = await Promise.all([
    backendApi('/favorites'),
    backendApi('/playlists'),
  ])
  return {
    favorites: favoritesResponse.data.favorites,
    playlists: playlistsResponse.data.playlists,
  }
}

export async function putFavoriteApi(songId) {
  return (await backendApi(`/favorites/${songId}`, { method: 'PUT' })).data.favorite
}

export async function deleteFavoriteApi(songId) {
  await backendApi(`/favorites/${songId}`, { method: 'DELETE' })
}

export async function createPlaylistApi(name) {
  return (await backendApi('/playlists', { method: 'POST', body: { name } })).data.playlist
}

export async function renamePlaylistApi({ id, name }) {
  return (await backendApi(`/playlists/${id}`, { method: 'PATCH', body: { name } })).data.playlist
}

export async function deletePlaylistApi(id) {
  await backendApi(`/playlists/${id}`, { method: 'DELETE' })
}

export async function addPlaylistSongApi({ playlistId, songId }) {
  return (await backendApi(`/playlists/${playlistId}/songs`, {
    method: 'POST',
    body: { songId },
  })).data.playlist
}

export async function removePlaylistSongApi({ playlistId, songId }) {
  await backendApi(`/playlists/${playlistId}/songs/${songId}`, { method: 'DELETE' })
}
