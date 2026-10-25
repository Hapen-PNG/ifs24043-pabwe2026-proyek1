import { backendApi } from '../../../helpers/backendApi.js'

export async function getRecentApi() {
  return (await backendApi('/recent')).data.recent
}

export async function addRecentApi(songId) {
  return (await backendApi('/recent', { method: 'POST', body: { songId } })).data.recent
}

export async function getStatsApi() {
  return (await backendApi('/stats')).data.stats
}

export async function recordPlayApi(songId) {
  return (await backendApi('/stats/play', { method: 'POST', body: { songId } })).data.playCount
}

export async function getSearchHistoryApi() {
  return (await backendApi('/search-history')).data.history
}

export async function addSearchApi(term) {
  return (await backendApi('/search-history', { method: 'POST', body: { term } })).data.history
}

export async function removeSearchApi(id) {
  await backendApi(`/search-history/${id}`, { method: 'DELETE' })
}

export async function clearSearchApi() {
  await backendApi('/search-history', { method: 'DELETE' })
}
