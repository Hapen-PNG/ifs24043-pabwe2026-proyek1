import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Lyrics from './Lyrics.jsx'
import { usePlayer } from '../context/PlayerContext.jsx'

vi.mock('../context/PlayerContext.jsx', () => ({ usePlayer: vi.fn() }))

const lyrics = [
  { time: 0, text: 'Pagi menyapa' },
  { time: 12, text: 'Awan bergerak' },
  { time: 24, text: 'Hari bersemi' },
]

const originalScrollIntoView = Object.getOwnPropertyDescriptor(
  HTMLElement.prototype,
  'scrollIntoView',
)

describe('Lyrics', () => {
  const seek = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: vi.fn(),
    })
  })

  afterEach(() => {
    if (originalScrollIntoView) {
      Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', originalScrollIntoView)
    } else {
      delete HTMLElement.prototype.scrollIntoView
    }
  })

  it('shows empty-state messages when no song or lyrics are available', () => {
    usePlayer.mockReturnValue({ currentSong: null, currentTime: 0, seek })
    const { rerender } = render(<Lyrics />)
    expect(screen.getByText('Belum ada lagu dipilih.')).toBeInTheDocument()

    usePlayer.mockReturnValue({
      currentSong: { id: 2, title: 'Instrumental', lyrics: [] },
      currentTime: 0,
      seek,
    })
    rerender(<Lyrics />)
    expect(screen.getByText('Lirik belum tersedia.')).toBeInTheDocument()
  })

  it('marks the active lyric, scrolls it into view, and seeks when clicked', () => {
    usePlayer.mockReturnValue({
      currentSong: { id: 1, title: 'Pagi', lyrics },
      currentTime: 15,
      seek,
    })
    const { rerender } = render(<Lyrics />)
    const active = screen.getByRole('button', { name: 'Awan bergerak' })
    expect(active).toHaveAttribute('aria-current', 'true')
    expect(HTMLElement.prototype.scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'center',
    })
    fireEvent.click(screen.getByRole('button', { name: 'Hari bersemi' }))
    expect(seek).toHaveBeenCalledWith(24)

    usePlayer.mockReturnValue({
      currentSong: { id: 1, title: 'Pagi', lyrics },
      currentTime: -1,
      seek,
    })
    rerender(<Lyrics />)
    expect(screen.getAllByRole('button').every((button) => !button.hasAttribute('aria-current')))
      .toBe(true)
  })
})
