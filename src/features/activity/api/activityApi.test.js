import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as activityApi from './activityApi.js'

const { backendApi } = vi.hoisted(() => ({ backendApi: vi.fn() }))

vi.mock('../../../helpers/backendApi.js', () => ({ backendApi }))

describe('activity API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('maps recent plays and statistics responses', async () => {
    backendApi
      .mockResolvedValueOnce({ data: { recent: [{ id: 1 }] } })
      .mockResolvedValueOnce({ data: { recent: [{ id: 2 }] } })
      .mockResolvedValueOnce({ data: { stats: { totalPlays: 4 } } })
      .mockResolvedValueOnce({ data: { playCount: 5 } })

    await expect(activityApi.getRecentApi()).resolves.toEqual([{ id: 1 }])
    await expect(activityApi.addRecentApi(2)).resolves.toEqual([{ id: 2 }])
    await expect(activityApi.getStatsApi()).resolves.toEqual({ totalPlays: 4 })
    await expect(activityApi.recordPlayApi(2)).resolves.toBe(5)

    expect(backendApi).toHaveBeenNthCalledWith(1, '/recent')
    expect(backendApi).toHaveBeenNthCalledWith(2, '/recent', {
      method: 'POST',
      body: { songId: 2 },
    })
    expect(backendApi).toHaveBeenNthCalledWith(3, '/stats')
    expect(backendApi).toHaveBeenNthCalledWith(4, '/stats/play', {
      method: 'POST',
      body: { songId: 2 },
    })
  })

  it('maps search history operations to their endpoints', async () => {
    backendApi
      .mockResolvedValueOnce({ data: { history: [{ id: 7, term: 'senja' }] } })
      .mockResolvedValueOnce({ data: { history: [{ id: 8, term: 'pagi' }] } })
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined)

    await expect(activityApi.getSearchHistoryApi()).resolves.toEqual([
      { id: 7, term: 'senja' },
    ])
    await expect(activityApi.addSearchApi('pagi')).resolves.toEqual([
      { id: 8, term: 'pagi' },
    ])
    await expect(activityApi.removeSearchApi(7)).resolves.toBeUndefined()
    await expect(activityApi.clearSearchApi()).resolves.toBeUndefined()

    expect(backendApi).toHaveBeenNthCalledWith(1, '/search-history')
    expect(backendApi).toHaveBeenNthCalledWith(2, '/search-history', {
      method: 'POST',
      body: { term: 'pagi' },
    })
    expect(backendApi).toHaveBeenNthCalledWith(3, '/search-history/7', {
      method: 'DELETE',
    })
    expect(backendApi).toHaveBeenNthCalledWith(4, '/search-history', {
      method: 'DELETE',
    })
  })
})
