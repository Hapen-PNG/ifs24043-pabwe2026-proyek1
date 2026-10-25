import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useLibrary } from '../context/LibraryContext.jsx'
import { usePlayer } from '../context/PlayerContext.jsx'
import Library from './Library.jsx'

vi.mock('../context/LibraryContext.jsx', () => ({
  useLibrary: vi.fn(),
}))

vi.mock('../context/PlayerContext.jsx', () => ({
  usePlayer: vi.fn(),
}))

const favoriteSongs = [
  { id: 1, title: 'Cahaya Pagi', artist: 'Nara', album: 'Awal Hari', cover: '' },
]

describe('Library', () => {
  const createPlaylist = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    useLibrary.mockReturnValue({
      favoriteSongs,
      toggleFavorite: vi.fn(),
      loading: false,
      playlists: [],
      createPlaylist,
      renamePlaylist: vi.fn(),
      deletePlaylist: vi.fn(),
      addSongToPlaylist: vi.fn(),
      removeSongFromPlaylist: vi.fn(),
      dataUnavailable: false,
    })
    usePlayer.mockReturnValue({
      songs: favoriteSongs,
      clearQueue: vi.fn(),
      enqueue: vi.fn(),
      selectSong: vi.fn(),
    })
  })

  it('switches between the favorites and playlists tabs', () => {
    render(<Library />)

    expect(screen.getByRole('tabpanel')).toHaveAttribute(
      'aria-labelledby',
      'library-tab-favorites',
    )
    fireEvent.click(screen.getByRole('tab', { name: 'Playlist Saya' }))
    expect(screen.getByRole('tabpanel')).toHaveAttribute(
      'aria-labelledby',
      'library-tab-playlists',
    )

    fireEvent.click(screen.getByRole('tab', { name: 'Lagu Favorit' }))
    expect(screen.getByRole('tabpanel')).toHaveAttribute(
      'aria-labelledby',
      'library-tab-favorites',
    )
  })

  it('shows the favorite songs list', () => {
    render(<Library />)

    expect(screen.getByText('Cahaya Pagi')).toBeInTheDocument()
    expect(screen.getByText('Nara · Awal Hari')).toBeInTheDocument()
  })

  it('calls createPlaylist with the submitted name', async () => {
    createPlaylist.mockResolvedValue({ id: 2, name: 'Perjalanan', songs: [] })
    render(<Library />)

    fireEvent.click(screen.getByRole('tab', { name: 'Playlist Saya' }))
    fireEvent.change(screen.getByLabelText('Nama playlist baru'), {
      target: { value: 'Perjalanan' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Buat' }))

    await waitFor(() => {
      expect(createPlaylist).toHaveBeenCalledWith('Perjalanan')
    })
  })
})
