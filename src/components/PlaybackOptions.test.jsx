import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import PlaybackOptions from './PlaybackOptions.jsx'
import { usePlayer } from '../context/PlayerContext.jsx'

vi.mock('../context/PlayerContext.jsx', () => ({ usePlayer: vi.fn() }))

describe('PlaybackOptions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('changes playback rate and starts each available timer duration', () => {
    const setPlaybackRate = vi.fn()
    const startTimer = vi.fn()
    usePlayer.mockReturnValue({ playbackRate: 1, setPlaybackRate })
    render(
      <PlaybackOptions
        remainingSeconds={0}
        startTimer={startTimer}
        cancelTimer={vi.fn()}
      />,
    )

    fireEvent.change(screen.getByLabelText('Kecepatan'), { target: { value: '1.5' } })
    expect(setPlaybackRate).toHaveBeenCalledWith(1.5)
    fireEvent.click(screen.getByRole('button', { name: '15 mnt' }))
    fireEvent.click(screen.getByRole('button', { name: '30 mnt' }))
    fireEvent.click(screen.getByRole('button', { name: '60 mnt' }))
    expect(startTimer.mock.calls).toEqual([[15], [30], [60]])
  })

  it('formats the active countdown and cancels the timer', () => {
    const cancelTimer = vi.fn()
    usePlayer.mockReturnValue({ playbackRate: 0.75, setPlaybackRate: vi.fn() })
    render(
      <PlaybackOptions
        remainingSeconds={3661}
        startTimer={vi.fn()}
        cancelTimer={cancelTimer}
      />,
    )

    expect(screen.getByRole('timer')).toHaveTextContent('61:01')
    expect(screen.queryByRole('button', { name: '15 mnt' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Batal' }))
    expect(cancelTimer).toHaveBeenCalledOnce()
  })
})
