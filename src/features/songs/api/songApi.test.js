import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getSongsApi } from './songApi.js'

const { backendApi } = vi.hoisted(() => ({ backendApi: vi.fn() }))

vi.mock('../../../helpers/backendApi.js', () => ({ backendApi }))

describe('getSongsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns songs from the API response', async () => {
    backendApi.mockResolvedValue({ data: { songs: [{ id: 1 }] } })

    await expect(getSongsApi()).resolves.toEqual([{ id: 1 }])
    expect(backendApi).toHaveBeenCalledWith('/songs')
  })

  it('propagates backend failures', async () => {
    const failure = new Error('offline')
    backendApi.mockRejectedValue(failure)

    await expect(getSongsApi()).rejects.toBe(failure)
  })
})
