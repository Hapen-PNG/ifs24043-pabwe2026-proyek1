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
  beforeEach(() => {
    vi.useFakeTimers()
    usePlayer.mockReturnValue({
      songs,
      selectSong: vi.fn(),
      enqueue: vi.fn(),
    })
    useLibrary.mockReturnValue({
      favoriteIds: [],
      toggleFavorite: vi.fn(),
    })
    useSearchHistory.mockReturnValue({
      history: [],
      loading: false,
      unavailable: false,
      addSearch: vi.fn(),
      removeSearch: vi.fn(),
      clearHistory: vi.fn(),
    })
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
    expect(albumResults.getByText('Blue Horizon')).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Lagu' })).not.toBeInTheDocument()
  })

  it('shows the empty state when no results match the search', () => {
    renderSearch()
    const input = screen.getByRole('combobox', { name: 'Cari lagu atau artis' })

    enterQuery(input, 'Tidak ada kecocokan')

    expect(screen.getByRole('heading', { name: 'Belum ada hasil' })).toBeInTheDocument()
  })
})
