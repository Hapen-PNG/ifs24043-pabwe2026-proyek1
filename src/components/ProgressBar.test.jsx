import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { usePlayer } from '../context/PlayerContext.jsx'
import ProgressBar from './ProgressBar.jsx'

vi.mock('../context/PlayerContext.jsx', () => ({
  usePlayer: vi.fn(),
}))

describe('ProgressBar', () => {
  const seek = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    usePlayer.mockReturnValue({
      currentTime: 125,
      duration: 245,
      seek,
    })
  })

  it('displays the current time and duration in mm:ss format', () => {
    render(<ProgressBar />)

    expect(screen.getByText('02:05')).toBeInTheDocument()
    expect(screen.getByText('04:05')).toBeInTheDocument()
  })

  it('calls seek with the slider value when its position changes', () => {
    render(<ProgressBar />)

    fireEvent.change(screen.getByRole('slider', { name: 'Posisi pemutaran' }), {
      target: { value: '90.5' },
    })

    expect(seek).toHaveBeenCalledWith(90.5)
  })
})
