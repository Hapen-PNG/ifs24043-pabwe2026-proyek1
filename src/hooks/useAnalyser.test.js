import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import useAnalyser from './useAnalyser.js'

function makeAudioContext(state = 'running') {
  const source = { connect: vi.fn(), disconnect: vi.fn() }
  const analyser = { connect: vi.fn(), disconnect: vi.fn(), fftSize: 0 }
  const context = {
    state,
    destination: {},
    createMediaElementSource: vi.fn(() => source),
    createAnalyser: vi.fn(() => analyser),
    resume: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
  }
  const Constructor = vi.fn(function AudioContext() {
    return context
  })
  return { Constructor, context, source, analyser }
}

describe('useAnalyser', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('does nothing without audio and reports unsupported Web Audio', () => {
    vi.stubGlobal('AudioContext', undefined)
    vi.stubGlobal('webkitAudioContext', undefined)
    const { result, rerender } = renderHook(({ audioRef }) => useAnalyser(audioRef), {
      initialProps: { audioRef: { current: null } },
    })

    expect(result.current.analyserError).toBeNull()
    rerender({ audioRef: { current: {} } })
    expect(result.current.analyserError).toBe('Web Audio API tidak didukung oleh browser ini.')
  })

  it('connects the audio graph once, resumes suspended audio, then cleans up', async () => {
    vi.useFakeTimers()
    const audio = {}
    const audioRef = { current: audio }
    const mocks = makeAudioContext('suspended')
    vi.stubGlobal('AudioContext', mocks.Constructor)
    const { result, unmount } = renderHook(() => useAnalyser(audioRef))

    expect(mocks.Constructor).toHaveBeenCalledOnce()
    expect(mocks.context.createMediaElementSource).toHaveBeenCalledWith(audio)
    expect(mocks.analyser.fftSize).toBe(128)
    expect(mocks.source.connect).toHaveBeenCalledWith(mocks.analyser)
    expect(mocks.analyser.connect).toHaveBeenCalledWith(mocks.context.destination)
    await act(async () => result.current.resumeAudioContext())
    expect(mocks.context.resume).toHaveBeenCalledOnce()

    unmount()
    act(() => vi.runOnlyPendingTimers())
    expect(mocks.source.disconnect).toHaveBeenCalledOnce()
    expect(mocks.analyser.disconnect).toHaveBeenCalledOnce()
    expect(mocks.context.close).toHaveBeenCalledOnce()
  })

  it('returns the Error message when creating the analyser fails', () => {
    const failure = new Error('audio graph failed')
    const context = {
      state: 'closed',
      createMediaElementSource: vi.fn(() => {
        throw failure
      }),
      close: vi.fn(),
    }
    vi.stubGlobal('AudioContext', vi.fn(function AudioContext() {
      return context
    }))
    const { result } = renderHook(() => useAnalyser({ current: {} }))

    expect(result.current.analyserError).toBe('audio graph failed')
  })

  it('uses a fallback message for non-Error failures and avoids closing a closed context', () => {
    vi.useFakeTimers()
    const context = {
      state: 'closed',
      createMediaElementSource: vi.fn(() => {
        throw 'connection failed'
      }),
      close: vi.fn(),
    }
    vi.stubGlobal('AudioContext', vi.fn(function AudioContext() {
      return context
    }))
    const { result, unmount } = renderHook(() => useAnalyser({ current: {} }))

    expect(result.current.analyserError).toBe('Gagal menghubungkan audio ke Web Audio API.')
    unmount()
    act(() => vi.runOnlyPendingTimers())
    expect(context.close).not.toHaveBeenCalled()
  })
})
