import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import MiniPlayer from './MiniPlayer.jsx'
import { usePlayer } from '../context/PlayerContext.jsx'

vi.mock('../context/PlayerContext.jsx', () => ({ usePlayer: vi.fn() }))

describe('MiniPlayer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders nothing when there is no current song', () => {
    usePlayer.mockReturnValue({ currentSong: null })

    const { container } = render(<MiniPlayer />, { wrapper: MemoryRouter })

    expect(container).toBeEmptyDOMElement()
  })

  it('shows track details and delegates play and next controls', () => {
    const toggle = vi.fn()
    const next = vi.fn()
    usePlayer.mockReturnValue({
      currentSong: { id: 4, title: 'Malam', artist: 'Nara', cover: '' },
      isPlaying: false,
      toggle,
      next,
    })
    render(<MiniPlayer />, { wrapper: MemoryRouter })

    expect(screen.getByText('Malam')).toBeInTheDocument()
    expect(screen.getByText('Nara')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Putar lagu' }))
    fireEvent.click(screen.getByRole('button', { name: 'Lagu berikutnya' }))
    expect(toggle).toHaveBeenCalledOnce()
    expect(next).toHaveBeenCalledOnce()
  })

  it('exposes the pause label for a playing track', () => {
    usePlayer.mockReturnValue({
      currentSong: { id: 1, title: 'Pagi', artist: 'Ayu' },
      isPlaying: true,
      toggle: vi.fn(),
      next: vi.fn(),
    })

    render(<MiniPlayer />, { wrapper: MemoryRouter })

    expect(screen.getByRole('button', { name: 'Jeda lagu' })).toBeInTheDocument()
  })
})
