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
const songs = [
  ...favoriteSongs,
  { id: 2, title: 'Langit Biru', artist: 'Raka', album: 'Senja', cover: '' },
]
const playlists = [
  { id: 2, name: 'Perjalanan', songs: [favoriteSongs[0]], songIds: [1] },
  { id: 3, name: 'Kosong', songs: [], songIds: [] },
]

describe('Library', () => {
  const createPlaylist = vi.fn()
  const toggleFavorite = vi.fn()
  const renamePlaylist = vi.fn()
  const deletePlaylist = vi.fn()
  const addSongToPlaylist = vi.fn()
  const removeSongFromPlaylist = vi.fn()
  const clearQueue = vi.fn()
  const enqueue = vi.fn()
  const selectSong = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    useLibrary.mockReturnValue({
      favoriteSongs,
      toggleFavorite,
      loading: false,
      playlists: [],
      createPlaylist,
      renamePlaylist,
      deletePlaylist,
      addSongToPlaylist,
      removeSongFromPlaylist,
      dataUnavailable: false,
    })
    usePlayer.mockReturnValue({
      songs,
      clearQueue,
      enqueue,
      selectSong,
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
    const { unmount } = render(<Library />)

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

  it('shows loading, unavailable, and empty-favorites states', () => {
    useLibrary.mockReturnValue({
      favoriteSongs: [],
      toggleFavorite,
      loading: true,
      playlists: [],
      createPlaylist,
      renamePlaylist,
      deletePlaylist,
      addSongToPlaylist,
      removeSongFromPlaylist,
      dataUnavailable: true,
    })
    const { unmount } = render(<Library />)

    expect(screen.getByRole('status', { name: 'Memuat koleksi akun' })).toBeInTheDocument()
    expect(screen.getByText('Data belum dapat dimuat')).toBeInTheDocument()
    expect(screen.getByText('Memuat…')).toBeInTheDocument()
    unmount()

    useLibrary.mockReturnValue({
      favoriteSongs: [],
      toggleFavorite,
      loading: false,
      playlists: [],
      createPlaylist,
      renamePlaylist,
      deletePlaylist,
      addSongToPlaylist,
      removeSongFromPlaylist,
      dataUnavailable: false,
    })
    render(<Library />)
    expect(screen.getByText(/Belum ada lagu favorit/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Putar semua' })).toBeDisabled()
  })

  it('removes a favorite and plays the selected songs in queue order', () => {
    const { unmount } = render(<Library />)
    fireEvent.click(screen.getByRole('button', { name: 'Hapus Cahaya Pagi dari lagu favorit' }))
    fireEvent.click(screen.getByRole('button', { name: 'Putar semua' }))

    expect(toggleFavorite).toHaveBeenCalledWith(1)
    expect(clearQueue).toHaveBeenCalledOnce()
    expect(enqueue).not.toHaveBeenCalled()
    expect(selectSong).toHaveBeenCalledWith(favoriteSongs[0])
    unmount()
  })

  it('renders a favorite without an album', () => {
    useLibrary.mockReturnValue({
      favoriteSongs: [{ id: 4, title: 'Lagu Lepas', artist: 'Dara', cover: '' }],
      toggleFavorite,
      loading: false,
      playlists: [],
      createPlaylist,
      renamePlaylist,
      deletePlaylist,
      addSongToPlaylist,
      removeSongFromPlaylist,
      dataUnavailable: false,
    })
    render(<Library />)

    expect(screen.getByText('Lagu Lepas')).toBeInTheDocument()
    expect(screen.getByText('Dara')).toBeInTheDocument()
  })

  it('manages a playlist: selects, adds, removes, renames, and plays its songs', () => {
    useLibrary.mockReturnValue({
      favoriteSongs,
      toggleFavorite,
      loading: false,
      playlists,
      createPlaylist,
      renamePlaylist,
      deletePlaylist,
      addSongToPlaylist,
      removeSongFromPlaylist,
      dataUnavailable: false,
    })
    render(<Library />)
    fireEvent.click(screen.getByRole('tab', { name: 'Playlist Saya' }))
    expect(screen.getByText(/Pilih playlist untuk melihat/)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /^Perjalanan1 lagu$/ }))
    expect(screen.getByRole('button', { name: 'Putar playlist' })).toBeEnabled()
    fireEvent.click(screen.getByRole('button', { name: 'Putar playlist' }))
    expect(clearQueue).toHaveBeenCalledOnce()
    expect(selectSong).toHaveBeenCalledWith(favoriteSongs[0])

    fireEvent.change(screen.getByLabelText('Nama playlist baru', { selector: '#rename-playlist-name' }), {
      target: { value: 'Jalan-jalan' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Ganti nama' }))
    expect(renamePlaylist).toHaveBeenCalledWith(2, 'Jalan-jalan')

    fireEvent.change(screen.getByLabelText('Pilih lagu untuk ditambahkan'), { target: { value: '2' } })
    fireEvent.click(screen.getByRole('button', { name: 'Tambah lagu' }))
    expect(addSongToPlaylist).toHaveBeenCalledWith(2, 2)

    fireEvent.click(screen.getByRole('button', { name: 'Hapus Cahaya Pagi dari playlist Perjalanan' }))
    expect(removeSongFromPlaylist).toHaveBeenCalledWith(2, 1)
  })

  it('handles empty playlists, rejected create, rename errors, and delete confirmation', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
    createPlaylist.mockRejectedValueOnce(new Error('Tidak dapat membuat playlist'))
    renamePlaylist.mockImplementationOnce(() => { throw new Error('Nama tidak valid') })
    useLibrary.mockReturnValue({
      favoriteSongs: [],
      toggleFavorite,
      loading: false,
      playlists,
      createPlaylist,
      renamePlaylist,
      deletePlaylist,
      addSongToPlaylist,
      removeSongFromPlaylist,
      dataUnavailable: false,
    })
    render(<Library />)
    fireEvent.click(screen.getByRole('tab', { name: 'Playlist Saya' }))
    fireEvent.change(screen.getByLabelText('Nama playlist baru'), { target: { value: 'Baru' } })
    fireEvent.click(screen.getByRole('button', { name: 'Buat' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Tidak dapat membuat playlist')

    fireEvent.click(screen.getByRole('button', { name: /^Kosong0 lagu$/ }))
    expect(screen.getByText(/Playlist ini masih kosong/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Putar playlist' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Putar playlist' }))
    expect(clearQueue).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Ganti nama' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Nama tidak valid')
    fireEvent.click(screen.getByRole('button', { name: 'Hapus playlist Kosong' }))
    expect(confirm).toHaveBeenCalledOnce()
    expect(deletePlaylist).not.toHaveBeenCalled()
  })

  it('deletes the selected playlist after confirmation', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    useLibrary.mockReturnValue({
      favoriteSongs,
      toggleFavorite,
      loading: false,
      playlists,
      createPlaylist,
      renamePlaylist,
      deletePlaylist,
      addSongToPlaylist,
      removeSongFromPlaylist,
      dataUnavailable: false,
    })
    render(<Library />)
    fireEvent.click(screen.getByRole('tab', { name: 'Playlist Saya' }))
    fireEvent.click(screen.getByRole('button', { name: /^Kosong0 lagu$/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Hapus playlist Kosong' }))

    expect(deletePlaylist).toHaveBeenCalledWith(3)
    expect(screen.getByText(/Pilih playlist untuk melihat/)).toBeInTheDocument()
  })
})
