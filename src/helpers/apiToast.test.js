import { beforeEach, describe, expect, it, vi } from 'vitest'
import { showApiError } from './apiToast.js'

const { fire, mixin, loadSweetAlert } = vi.hoisted(() => {
  const fire = vi.fn().mockResolvedValue(undefined)
  const mixin = vi.fn(() => ({ fire }))
  return {
    fire,
    mixin,
    loadSweetAlert: vi.fn(async () => ({ mixin })),
  }
})

vi.mock('./loadSweetAlert.js', () => ({ default: loadSweetAlert }))

describe('showApiError', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    fire.mockResolvedValue(undefined)
    mixin.mockReturnValue({ fire })
    loadSweetAlert.mockResolvedValue({ mixin })
  })

  it('shows an Error message in a toast and waits for the alert', async () => {
    const error = new Error('Server tidak tersedia')

    await showApiError(error)

    expect(mixin).toHaveBeenCalledWith({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 1800,
      timerProgressBar: true,
    })
    expect(fire).toHaveBeenCalledWith({
      icon: 'error',
      title: 'Server tidak tersedia',
    })
  })

  it('uses the fallback message for non-Error values', async () => {
    await showApiError('failure')

    expect(fire).toHaveBeenCalledWith({
      icon: 'error',
      title: 'Permintaan gagal. Coba lagi.',
    })
  })

  it('propagates a failed alert load', async () => {
    loadSweetAlert.mockRejectedValueOnce(new Error('alert load failed'))

    await expect(showApiError(new Error('failure'))).rejects.toThrow('alert load failed')
    expect(mixin).not.toHaveBeenCalled()
  })
})
