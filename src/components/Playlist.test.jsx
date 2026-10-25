import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Playlist from './Playlist.jsx'
import { usePlayer } from '../context/PlayerContext.jsx'

vi.mock('../context/PlayerContext.jsx', () => ({ usePlayer: vi.fn() }))

const songs = [
  { id: 1, title: 'Pagi', artist: 'Ayu', src: '/pagi.mp3' },
  { id: 2, title: 'Senja', artist: 'Nara', src: '/senja.mp3' },
  { id: 3, title: 'Malam', artist: 'Raka', src: '/malam.mp3' },
]

let audioPlayers

class MockAudio {
  constructor() {
    this.listeners = new Map()
    this.duration = 125
    this.pause = vi.fn()
    this.load = vi.fn(() => this.listeners.get('loadedmetadata')?.())
    this.removeAttribute = vi.fn()
    this.addEventListener = vi.fn((name, callback) => this.listeners.set(name, callback))
    this.removeEventListener = vi.fn((name) => this.listeners.delete(name))
    audioPlayers.push(this)
  }
}

describe('Playlist', () => {
  beforeEach(() => {
    audioPlayers = []
    vi.stubGlobal('Audio', MockAudio)
    vi.stubGlobal('fetch', vi.fn(async (src) => ({
      ok: src !== '/senja.mp3',
      headers: { get: () => src === '/senja.mp3' ? 'text/plain' : 'audio/mpeg' },
    })))
    usePlayer.mockReturnValue({
      songs,
      currentSong: songs[0],
      isPlaying: true,
      selectSong: vi.fn(),
    })
  })

  it('renders current and other tracks, loads metadata, and exposes row actions', async () => {
    const selectSong = vi.fn()
    usePlayer.mockReturnValue({
      songs,
      currentSong: songs[0],
      isPlaying: true,
      selectSong,
    })
    const onToggleFavorite = vi.fn()
    const onAddToQueue = vi.fn()
    const { unmount } = render(
      <Playlist
        favoriteIds={[2]}
        onToggleFavorite={onToggleFavorite}
        onAddToQueue={onAddToQueue}
      />,
    )

    expect(screen.getByText('Pagi')).toBeInTheDocument()
    expect(screen.getByText('Senja')).toBeInTheDocument()
    expect(screen.getByText('Malam')).toBeInTheDocument()
    expect(document.querySelectorAll('.equalizer-bar')).toHaveLength(3)
    await waitFor(() => expect(screen.getAllByText('02:05')).toHaveLength(2))
    expect(screen.getByText('--:--')).toBeInTheDocument()
    expect(fetch).toHaveBeenCalledWith('/pagi.mp3', { method: 'HEAD' })

    fireEvent.click(screen.getByRole('button', { name: /PagiAyu/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Tambahkan ke lagu favorit: Pagi' }))
    fireEvent.click(screen.getByRole('button', { name: 'Hapus dari lagu favorit: Senja' }))
    fireEvent.click(screen.getByRole('button', { name: 'Tambahkan Malam ke antrean' }))
    expect(selectSong).toHaveBeenCalledWith(songs[0])
    expect(onToggleFavorite.mock.calls).toEqual([[1], [2]])
    expect(onAddToQueue).toHaveBeenCalledWith(songs[2])

    unmount()
    expect(audioPlayers[0].pause).toHaveBeenCalledOnce()
    expect(audioPlayers[0].removeAttribute).toHaveBeenCalledWith('src')
    expect(audioPlayers[0].removeEventListener).toHaveBeenCalledWith(
      'loadedmetadata',
      expect.any(Function),
    )
  })

  it('renders the supplied subset and handles failed metadata fetches', async () => {
    fetch.mockRejectedValueOnce(new Error('offline'))
    render(<Playlist songs={[songs[2]]} />)

    expect(screen.getByText('Malam')).toBeInTheDocument()
    expect(screen.queryByText('Pagi')).not.toBeInTheDocument()
    await waitFor(() => expect(screen.getByText('--:--')).toBeInTheDocument())
  })

  it('does not show optional action buttons when handlers are absent', () => {
    render(<Playlist songs={[]} />)

    expect(screen.queryByRole('button', { name: /favorit/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /antrean/ })).not.toBeInTheDocument()
  })
})
