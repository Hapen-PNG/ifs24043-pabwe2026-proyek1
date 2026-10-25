import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Player from './Player.jsx'
import { usePlayer } from '../context/PlayerContext.jsx'

vi.mock('../context/PlayerContext.jsx', () => ({ usePlayer: vi.fn() }))
vi.mock('./ProgressBar.jsx', () => ({ default: () => <div>progress</div> }))
vi.mock('./Visualizer.jsx', () => ({ default: () => <div>visualizer</div> }))
vi.mock('./VolumeControl.jsx', () => ({ default: () => <div>volume control</div> }))

describe('Player', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows an empty-catalog message', () => {
    usePlayer.mockReturnValue({ currentSong: null })

    render(<Player />)

    expect(screen.getByText('Belum ada lagu untuk diputar.')).toBeInTheDocument()
  })

  it('renders the current track, errors, and controls their playback state', () => {
    const actions = {
      toggle: vi.fn(),
      next: vi.fn(),
      prev: vi.fn(),
      toggleShuffle: vi.fn(),
      cycleRepeat: vi.fn(),
    }
    usePlayer.mockReturnValue({
      currentSong: { id: 1, title: 'Pagi', artist: 'Ayu', cover: '' },
      isPlaying: false,
      playbackError: 'File audio belum tersedia',
      isShuffle: false,
      repeatMode: 'off',
      ...actions,
    })
    const { rerender } = render(<Player />)

    expect(screen.getByRole('alert')).toHaveTextContent('File audio belum tersedia')
    expect(screen.getByText('visualizer')).toBeInTheDocument()
    expect(screen.getByText('progress')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Acak lagu' }))
    fireEvent.click(screen.getByRole('button', { name: 'Lagu sebelumnya' }))
    fireEvent.click(screen.getByRole('button', { name: 'Putar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Lagu berikutnya' }))
    fireEvent.click(screen.getByRole('button', { name: 'Ulangi: mati' }))
    expect(actions.toggleShuffle).toHaveBeenCalledOnce()
    expect(actions.prev).toHaveBeenCalledOnce()
    expect(actions.toggle).toHaveBeenCalledOnce()
    expect(actions.next).toHaveBeenCalledOnce()
    expect(actions.cycleRepeat).toHaveBeenCalledOnce()

    usePlayer.mockReturnValue({
      currentSong: { id: 1, title: 'Pagi', artist: 'Ayu' },
      isPlaying: true,
      playbackError: 'decoder error',
      isShuffle: true,
      repeatMode: 'one',
      ...actions,
    })
    rerender(<Player />)
    expect(screen.getByRole('alert')).toHaveTextContent('Tidak dapat memutar audio: decoder error')
    expect(screen.getByRole('button', { name: 'Jeda' })).toHaveAttribute('aria-label', 'Jeda')
    expect(screen.getByRole('button', { name: 'Ulangi: satu lagu' }))
      .toHaveAttribute('aria-pressed', 'true')
  })
})
