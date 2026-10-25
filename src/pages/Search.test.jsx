import { configureStore } from '@reduxjs/toolkit'
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useLibrary } from '../context/LibraryContext.jsx'
import { usePlayer } from '../context/PlayerContext.jsx'
import useSearchHistory from '../hooks/useSearchHistory.js'
import Search from './Search.jsx'

vi.mock('../context/LibraryContext.jsx', () => ({
  useLibrary: vi.fn(),
}))

vi.mock('../context/PlayerContext.jsx', () => ({
  usePlayer: vi.fn(),
}))

vi.mock('../hooks/useSearchHistory.js', () => ({
  default: vi.fn(),
}))

const songs = [
  {
    id: 1,
    title: 'Starlight',
    artist: 'Luna Vale',
    album: 'Blue Horizon',
    cover: '',
  },
  {
    id: 2,
    title: 'River Song',
    artist: 'Mira Sol',
    album: 'Quiet Current',
    cover: '',
  },
]

function renderSearch() {
  const store = configureStore({
    reducer: {
      users: (state = { user: null }) => state,
    },
  })

  return render(
    <Provider store={store}>
      <MemoryRouter>
        <Search />
      </MemoryRouter>
    </Provider>,
  )
}

function enterQuery(input, value) {
  fireEvent.change(input, { target: { value } })
  act(() => {
    vi.advanceTimersByTime(300)
  })
}

describe('Search', () => {
  const selectSong = vi.fn()
  const enqueue = vi.fn()
  const toggleFavorite = vi.fn()
  const addSearch = vi.fn()
  const removeSearch = vi.fn()
  const clearHistory = vi.fn()

  beforeEach(() => {
    vi.useFakeTimers()
    usePlayer.mockReturnValue({
      songs,
      selectSong,
      enqueue,
    })
    useLibrary.mockReturnValue({
      favoriteIds: [],
      toggleFavorite,
    })
    useSearchHistory.mockReturnValue({
      history: [],
      loading: false,
      unavailable: false,
      addSearch,
      removeSearch,
      clearHistory,
    })
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it('renders a search field', () => {
    renderSearch()

    expect(screen.getByRole('combobox', { name: 'Cari lagu atau artis' })).toBeInTheDocument()
  })

  it('filters songs by title and artist after the debounce interval', () => {
    renderSearch()
    const input = screen.getByRole('combobox', { name: 'Cari lagu atau artis' })

    enterQuery(input, 'Starlight')
    let songResults = within(screen.getByRole('region', { name: 'Lagu' }))
    expect(songResults.getByText('Starlight')).toBeInTheDocument()
    expect(songResults.queryByText('River Song')).not.toBeInTheDocument()

    enterQuery(input, 'Luna Vale')
    songResults = within(screen.getByRole('region', { name: 'Lagu' }))
    expect(songResults.getByText('Starlight')).toBeInTheDocument()
    expect(songResults.queryByText('River Song')).not.toBeInTheDocument()
  })

  it('changes visible results when selecting song, artist, and album filters', () => {
    renderSearch()
    const input = screen.getByRole('combobox', { name: 'Cari lagu atau artis' })

    enterQuery(input, 'Luna')
    fireEvent.click(screen.getByRole('button', { name: 'Artis' }))
    expect(screen.getByRole('region', { name: 'Artis' })).toBeInTheDocument()
    expect(screen.queryByText('Starlight')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Lagu' }))
    const songResults = within(screen.getByRole('region', { name: 'Lagu' }))
    expect(songResults.getByText('Starlight')).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Artis' })).not.toBeInTheDocument()

    enterQuery(input, 'Blue')
    fireEvent.click(screen.getByRole('button', { name: 'Album' }))
    const albumResults = within(screen.getByRole('region', { name: 'Album' }))
    expect(albumResults.getByRole('button', { name: 'Blue Horizon' })).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Lagu' })).not.toBeInTheDocument()
    fireEvent.click(albumResults.getByRole('button', { name: 'Blue Horizon' }))
    expect(addSearch).toHaveBeenCalledWith('Blue Horizon')
    expect(screen.getByRole('region', { name: 'Lagu' })).toBeInTheDocument()
  })

  it('shows the empty state when no results match the search', () => {
    renderSearch()
    const input = screen.getByRole('combobox', { name: 'Cari lagu atau artis' })

    enterQuery(input, 'Tidak ada kecocokan')

    expect(screen.getByRole('heading', { name: 'Belum ada hasil' })).toBeInTheDocument()
  })

  it('supports autocomplete keyboard navigation, selection, Escape, and clearing the query', () => {
    renderSearch()
    const input = screen.getByRole('combobox', { name: 'Cari lagu atau artis' })
    fireEvent.change(input, { target: { value: 'Luna' } })

    expect(screen.getByRole('listbox', { name: 'Saran pencarian' })).toBeInTheDocument()
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    expect(input).toHaveAttribute('aria-activedescendant', 'search-suggestion-0')
    fireEvent.keyDown(input, { key: 'ArrowUp' })
    expect(input).toHaveAttribute('aria-activedescendant', 'search-suggestion-0')
    fireEvent.keyDown(input, { key: 'Escape' })
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()

    fireEvent.change(input, { target: { value: 'Starlight' } })
    const suggestion = screen.getByRole('option', { name: /Starlight/ })
    fireEvent.mouseDown(suggestion)
    fireEvent.click(suggestion)
    expect(addSearch).toHaveBeenCalledWith('Starlight')
    expect(screen.getByRole('region', { name: 'Lagu' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Hapus teks pencarian' }))
    expect(input).toHaveValue('')
    expect(screen.getByRole('heading', { name: 'Populer' })).toBeInTheDocument()
  })

  it('renders song actions, artist selection, and artist sorting', () => {
    renderSearch()
    const input = screen.getByRole('combobox', { name: 'Cari lagu atau artis' })
    enterQuery(input, 'i')

    const songResults = within(screen.getByRole('region', { name: 'Lagu' }))
    expect(songResults.getAllByRole('button').map((button) => button.textContent).join(' '))
      .toContain('River Song')
    fireEvent.click(songResults.getByRole('button', { name: /^Starlight/ }))
    fireEvent.click(songResults.getByRole('button', { name: 'Tambahkan River Song ke antrean' }))
    fireEvent.click(songResults.getByRole('button', { name: 'Tambahkan ke lagu favorit: River Song' }))
    expect(selectSong).toHaveBeenCalledWith(songs[0])
    expect(enqueue).toHaveBeenCalledWith(songs[1])
    expect(toggleFavorite).toHaveBeenCalledWith(2)

    fireEvent.change(screen.getByLabelText('Urutkan'), { target: { value: 'artist' } })
    const sortedButtons = within(screen.getByRole('region', { name: 'Lagu' })).getAllByRole('button')
    expect(sortedButtons[0]).toHaveAccessibleName(/^Starlight/)

    enterQuery(input, 'Luna')
    fireEvent.click(screen.getByRole('button', { name: 'Artis' }))
    fireEvent.click(screen.getByRole('button', { name: /Luna Vale/ }))
    expect(addSearch).toHaveBeenCalledWith('Luna Vale')
    expect(screen.getByRole('region', { name: 'Lagu' })).toBeInTheDocument()
  })

  it('shows and manages search history loading, unavailable, and populated states', () => {
    useSearchHistory.mockReturnValue({
      history: ['Lagu Lama'],
      loading: true,
      unavailable: false,
      addSearch,
      removeSearch,
      clearHistory,
    })
    renderSearch()

    expect(screen.getByRole('status', { name: 'Memuat riwayat pencarian' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Hapus semua' }))
    expect(clearHistory).toHaveBeenCalledOnce()

    useSearchHistory.mockReturnValue({
      history: ['Lagu Lama'],
      loading: false,
      unavailable: false,
      addSearch,
      removeSearch,
      clearHistory,
    })
    cleanup()
    renderSearch()
    fireEvent.click(screen.getByRole('button', { name: 'Hapus pencarian Lagu Lama dari riwayat' }))
    expect(removeSearch).toHaveBeenCalledWith('Lagu Lama')
    fireEvent.click(screen.getByRole('button', { name: 'Lagu Lama' }))
    expect(addSearch).toHaveBeenCalledWith('Lagu Lama')
    expect(screen.getByRole('heading', { name: 'Belum ada hasil' })).toBeInTheDocument()

    useSearchHistory.mockReturnValue({
      history: [],
      loading: false,
      unavailable: true,
      addSearch,
      removeSearch,
      clearHistory,
    })
    cleanup()
    renderSearch()
    expect(screen.getByText('Data belum dapat dimuat')).toBeInTheDocument()
  })

  it('selects popular searches and closes autocomplete after blur', () => {
    renderSearch()
    fireEvent.click(screen.getByRole('button', { name: /Pagi yang Baru/ }))
    expect(addSearch).toHaveBeenCalledWith('Pagi yang Baru')

    const input = screen.getByRole('combobox', { name: 'Cari lagu atau artis' })
    fireEvent.change(input, { target: { value: 'Blue' } })
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    fireEvent.blur(input)
    fireEvent.focus(input)
    act(() => {
      vi.advanceTimersByTime(100)
    })
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    fireEvent.blur(input)
    act(() => {
      vi.advanceTimersByTime(100)
    })
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })
})
