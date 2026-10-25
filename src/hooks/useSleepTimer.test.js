import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import useSleepTimer from './useSleepTimer.js'

describe('useSleepTimer', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('ignores unsupported durations and pauses at the selected deadline', () => {
    vi.useFakeTimers()
    const pause = vi.fn()
    const { result } = renderHook(() => useSleepTimer(pause))

    act(() => result.current.start(10))
    expect(result.current.remainingSeconds).toBe(0)
    expect(pause).not.toHaveBeenCalled()

    act(() => result.current.start(15))
    expect(result.current.remainingSeconds).toBe(900)
    act(() => vi.advanceTimersByTime(2500))
    expect(result.current.remainingSeconds).toBe(898)

    act(() => vi.advanceTimersByTime(897500))
    expect(result.current.remainingSeconds).toBe(0)
    expect(pause).toHaveBeenCalledTimes(1)
  })

  it('cancels an active timer and clears its interval', () => {
    vi.useFakeTimers()
    const pause = vi.fn()
    const { result } = renderHook(() => useSleepTimer(pause))

    act(() => result.current.start(30))
    act(() => result.current.cancel())
    act(() => vi.advanceTimersByTime(1800000))

    expect(result.current.remainingSeconds).toBe(0)
    expect(pause).not.toHaveBeenCalled()
    expect(vi.getTimerCount()).toBe(0)
  })
})
