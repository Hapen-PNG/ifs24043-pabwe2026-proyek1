import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { usePlayer } from '../context/PlayerContext.jsx'
import LirikMini from './LirikMini.jsx'

vi.mock('../context/PlayerContext.jsx', () => ({
  usePlayer: vi.fn(),
}))

const scrollIntoViewDescriptor = Object.getOwnPropertyDescriptor(
  HTMLElement.prototype,
  'scrollIntoView',
)

const lyrics = [
  { time: 0, text: 'Langit mulai terang' },
  { time: 10, text: 'Kita berjalan pulang' },
  { time: 20, text: 'Esok membuka jalan' },
]

describe('LirikMini', () => {
  const seek = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: vi.fn(),
    })
    usePlayer.mockReturnValue({
      currentSong: { id: 1, title: 'Langkah Baru', lyrics },
      currentTime: 15,
      seek,
    })
  })

  afterEach(() => {
    cleanup()
    if (scrollIntoViewDescriptor) {
      Object.defineProperty(
        HTMLElement.prototype,
        'scrollIntoView',
        scrollIntoViewDescriptor,
      )
    } else {
      delete HTMLElement.prototype.scrollIntoView
    }
  })

  it('renders lyric lines and marks the line active at currentTime', () => {
    render(<LirikMini />)

    expect(screen.getByText('Langit mulai terang')).toBeInTheDocument()
    const activeLine = screen.getByText('Kita berjalan pulang')
    expect(activeLine).toHaveClass('font-bold', 'text-white')
    expect(screen.getByText('Esok membuka jalan')).toBeInTheDocument()
  })

  it('seeks to the selected lyric line time', () => {
    render(<LirikMini />)

    fireEvent.click(screen.getByRole('button', { name: 'Lihat lirik lengkap' }))
    fireEvent.click(screen.getByRole('button', { name: 'Esok membuka jalan' }))

    expect(seek).toHaveBeenCalledWith(20)
  })

  it('shows a fallback without lyrics and closes the full lyric modal by button or backdrop', () => {
    usePlayer.mockReturnValue({
      currentSong: { id: 2, title: 'Instrumental', lyrics: [] },
      currentTime: 0,
      seek,
    })
    const { rerender } = render(<LirikMini />)
    expect(screen.getByText('Lirik belum tersedia')).toBeInTheDocument()

    usePlayer.mockReturnValue({
      currentSong: { id: 3, title: 'Sebelum Fajar', lyrics },
      currentTime: 15,
      seek,
    })
    rerender(<LirikMini />)
    fireEvent.click(screen.getByRole('button', { name: 'Lihat lirik lengkap' }))
    const dialog = screen.getByRole('dialog')
    expect(dialog).toBeInTheDocument()
    expect(HTMLElement.prototype.scrollIntoView).toHaveBeenCalled()

    fireEvent.mouseDown(dialog)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Tutup lirik lengkap' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Lihat lirik lengkap' }))
    fireEvent.mouseDown(screen.getByRole('dialog').parentElement)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
