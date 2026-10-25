import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import VolumeControl from './VolumeControl.jsx'
import { usePlayer } from '../context/PlayerContext.jsx'

vi.mock('../context/PlayerContext.jsx', () => ({ usePlayer: vi.fn() }))

describe('VolumeControl', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('updates the volume slider and toggles mute', () => {
    const setVolume = vi.fn()
    const toggleMute = vi.fn()
    usePlayer.mockReturnValue({
      volume: 0.7,
      isMuted: false,
      setVolume,
      toggleMute,
    })
    const { rerender } = render(<VolumeControl />)

    fireEvent.change(screen.getByRole('slider', { name: 'Volume' }), {
      target: { value: '0.35' },
    })
    expect(setVolume).toHaveBeenCalledWith(0.35)
    fireEvent.click(screen.getByRole('button', { name: 'Bisukan suara' }))
    expect(toggleMute).toHaveBeenCalledOnce()

    usePlayer.mockReturnValue({
      volume: 0.7,
      isMuted: true,
      setVolume,
      toggleMute,
    })
    rerender(<VolumeControl />)
    expect(screen.getByRole('slider', { name: 'Volume' })).toHaveValue('0')
    expect(screen.getByRole('button', { name: 'Nyalakan suara' })).toBeInTheDocument()
  })

  it('shows the muted icon when volume is zero without a mute flag', () => {
    usePlayer.mockReturnValue({
      volume: 0,
      isMuted: false,
      setVolume: vi.fn(),
      toggleMute: vi.fn(),
    })

    render(<VolumeControl />)

    expect(screen.getByRole('slider', { name: 'Volume' })).toHaveValue('0')
  })
})
