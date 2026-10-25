import { backendApi } from '../../../helpers/backendApi.js'

export async function getSongsApi() {
  const response = await backendApi('/songs')
  return response.data.songs
}
