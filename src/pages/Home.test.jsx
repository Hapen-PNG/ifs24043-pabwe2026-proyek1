import { configureStore } from '@reduxjs/toolkit'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { Provider } from 'react-redux'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Home from './Home.jsx'
import { useLibrary } from '../context/LibraryContext.jsx'
import { usePlayer } from '../context/PlayerContext.jsx'
import useLibraryFeatures from '../hooks/useLibraryFeatures.js'
import useSleepTimer from '../hooks/useSleepTimer.js'

const { toggleFavorite, addSong, pause, enqueue, start, cancel } = vi.hoisted(() => ({
  toggleFavorite: vi.fn(),
  addSong: vi.fn(),
  pause: vi.fn(),
  enqueue: vi.fn(),
  start: vi.fn(),
  cancel: vi.fn(),
}))

vi.mock('../context/LibraryContext.jsx', () => ({ useLibrary: vi.fn() }))
vi.mock('../context/PlayerContext.jsx', () => ({ usePlayer: vi.fn() }))
vi.mock('../hooks/useLibraryFeatures.js', () => ({ default: vi.fn() }))
vi.mock('../hooks/useSleepTimer.js', () => ({ default: vi.fn() }))
vi.mock('../components/LirikMini.jsx', () => ({ default: () => <p>lyrics panel</p> }))
vi.mock('../components/Player.jsx', () => ({ default: () => <p>player panel</p> }))
vi.mock('../components/QueuePanel.jsx', () => ({ default: () => <p>queue panel</p> }))
vi.mock('../components/PlaybackOptions.jsx', () => ({
  default: ({ remainingSeconds, startTimer, cancelTimer }) => (
    <div>
      <span>timer:{remainingSeconds}</span>
      <button type="button" onClick={() => startTimer(15)}>start timer</button>
      <button type="button" onClick={cancelTimer}>cancel timer</button>
    </div>
  ),
}))
vi.mock('../components/Playlist.jsx', () => ({
  default: ({ favoriteIds, onToggleFavorite, onAddToQueue }) => (
    <div>
      <span>favorites:{favoriteIds.join(',')}</span>
      <button type="button" onClick={() => onToggleFavorite(1)}>toggle favorite</button>
      <button type="button" onClick={() => onAddToQueue({ id: 1 })}>enqueue song</button>
    </div>
  ),
}))
vi.mock('../components/RecentlyPlayed.jsx', () => ({
  default: ({ songs, loading, unavailable }) => (
    <div>
      <span>recent:{songs.length}</span>
      {loading && <span>recent loading</span>}
      {unavailable && <span>recent unavailable</span>}
    </div>
  ),
}))

function renderHome(user = { id: 8, name: 'Ayu' }) {
  const store = configureStore({
    reducer: { users: (state = { user }) => state },
  })
  return render(
    <Provider store={store}>
      <Home />
    </Provider>,
  )
}

describe('Home', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {})
    addSong.mockResolvedValue({ id: 1 })
    usePlayer.mockReturnValue({
      addSong,
      pause,
      enqueue,
      queue: [{ id: 1 }],
    })
    useLibrary.mockReturnValue({
      favoriteIds: [1],
      toggleFavorite,
    })
    useLibraryFeatures.mockReturnValue({
      recentSongs: [{ id: 1 }],
      recentLoading: false,
      recentUnavailable: false,
    })
    useSleepTimer.mockReturnValue({
      remainingSeconds: 90,
      start,
      cancel,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('shows the personalized home sections, queue count, and timer actions', () => {
    renderHome()

    expect(screen.getByText(/Ayu/)).toBeInTheDocument()
    expect(screen.getByText('Musik untuk harimu')).toBeInTheDocument()
    expect(screen.getByText('player panel')).toBeInTheDocument()
    expect(screen.getByText('lyrics panel')).toBeInTheDocument()
    expect(screen.getByText('queue panel')).toBeInTheDocument()
    expect(screen.getByText('recent:1')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Antrean (1)' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText('timer:90')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'start timer' }))
    fireEvent.click(screen.getByRole('button', { name: 'cancel timer' }))
    expect(start).toHaveBeenCalledWith(15)
    expect(cancel).toHaveBeenCalledOnce()
  })

  it('switches to playlist content and forwards favorite and queue callbacks', () => {
    renderHome()
    fireEvent.click(screen.getByRole('tab', { name: 'Playlist' }))

    expect(screen.getByText('favorites:1')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'toggle favorite' }))
    fireEvent.click(screen.getByRole('button', { name: 'enqueue song' }))
    expect(toggleFavorite).toHaveBeenCalledWith(1)
    expect(enqueue).toHaveBeenCalledWith({ id: 1 })
  })

  it('omits a zero queue count from the queue tab label', () => {
    usePlayer.mockReturnValue({
      addSong,
      pause,
      enqueue,
      queue: [],
    })
    renderHome()

    expect(screen.getByRole('tab', { name: 'Antrean' })).toBeInTheDocument()
    expect(screen.queryByRole('tab', { name: 'Antrean (0)' })).not.toBeInTheDocument()
  })

  it('opens the upload input, adds a selected file, and ignores empty selection', async () => {
    renderHome()
    const input = screen.getByLabelText('Pilih file audio untuk diunggah')
    fireEvent.click(screen.getByRole('button', { name: 'Unggah lagu' }))
    expect(HTMLInputElement.prototype.click).toHaveBeenCalledOnce()

    const file = new File(['audio'], 'lagu.mp3', { type: 'audio/mpeg' })
    fireEvent.change(input, { target: { files: [file] } })
    await waitFor(() => expect(addSong).toHaveBeenCalledWith(file))
    expect(input.value).toBe('')

    fireEvent.change(input, { target: { files: [] } })
    expect(addSong).toHaveBeenCalledOnce()
  })

  it('shows upload failures, clears the message on retry, and accepts non-Error failures', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    addSong.mockRejectedValueOnce(new Error('file rejected'))
    renderHome(null)
    const input = screen.getByLabelText('Pilih file audio untuk diunggah')

    fireEvent.change(input, {
      target: { files: [new File(['bad'], 'bad.mp3', { type: 'audio/mpeg' })] },
    })
    expect(await screen.findByRole('alert')).toHaveTextContent('file rejected')
    expect(consoleError).toHaveBeenCalledWith('Gagal menambahkan file audio.', expect.any(Error))

    addSong.mockRejectedValueOnce('bad format')
    fireEvent.change(input, {
      target: { files: [new File(['bad'], 'bad2.mp3', { type: 'audio/mpeg' })] },
    })
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Gagal memuat audio.'))
  })

  it('uses the guest name and all greeting time ranges', () => {
    vi.useFakeTimers()
    const morning = new Date(2024, 0, 1, 8)
    vi.setSystemTime(morning)
    const view = renderHome(null)
    expect(screen.getByText('Selamat pagi, Pendengar')).toBeInTheDocument()

    const setHour = (hour) => {
      const date = new Date(2024, 0, 1, hour)
      vi.setSystemTime(date)
      act(() => view.rerender(
        <Provider store={configureStore({ reducer: { users: (state = { user: null }) => state } })}>
          <Home />
        </Provider>,
      ))
    }
    setHour(12)
    expect(screen.getByText('Selamat siang, Pendengar')).toBeInTheDocument()
    setHour(16)
    expect(screen.getByText('Selamat sore, Pendengar')).toBeInTheDocument()
    setHour(20)
    expect(screen.getByText('Selamat malam, Pendengar')).toBeInTheDocument()
  })

  it('forwards loading and unavailable recent-play states', () => {
    useLibraryFeatures.mockReturnValue({
      recentSongs: [],
      recentLoading: true,
      recentUnavailable: true,
    })
    renderHome()

    expect(screen.getByText('recent loading')).toBeInTheDocument()
    expect(screen.getByText('recent unavailable')).toBeInTheDocument()
  })
})
