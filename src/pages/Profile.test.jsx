import { configureStore } from '@reduxjs/toolkit'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useLibrary } from '../context/LibraryContext.jsx'
import { usePlayer } from '../context/PlayerContext.jsx'
import { useTheme } from '../context/ThemeContext.jsx'
import userReducer from '../features/users/states/reducer.js'
import Profile from './Profile.jsx'

const { updateCurrentUserApi, swalFire } = vi.hoisted(() => ({
  updateCurrentUserApi: vi.fn(),
  swalFire: vi.fn(),
}))

vi.mock('../features/users/api/userApi.js', () => ({
  getCurrentUserApi: vi.fn(),
  updateCurrentUserApi,
  updateCurrentUserPhotoApi: vi.fn(),
}))

vi.mock('../context/LibraryContext.jsx', () => ({
  useLibrary: vi.fn(),
}))

vi.mock('../context/PlayerContext.jsx', () => ({
  usePlayer: vi.fn(),
}))

vi.mock('../context/ThemeContext.jsx', () => ({
  useTheme: vi.fn(),
}))

vi.mock('../helpers/loadSweetAlert.js', () => ({
  default: async () => ({ fire: swalFire }),
}))

function renderProfile() {
  const store = configureStore({
    reducer: {
      users: userReducer,
      auth: (state = { token: null, status: 'idle', isInitializing: false }) => state,
      activity: (state = {
        stats: { totalPlays: 0, topPlayed: [] },
        searchHistory: [],
        searchHistoryStatus: 'idle',
      }) => state,
    },
    preloadedState: {
      users: {
        user: {
          id: 12,
          name: 'Nara Lama',
          email: 'nara@example.com',
          created_at: '2024-01-01T00:00:00.000Z',
        },
        status: 'idle',
        error: null,
      },
    },
  })

  return render(
    <Provider store={store}>
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    </Provider>,
  )
}

describe('Profile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useLibrary.mockReturnValue({ favoriteSongs: [], playlists: [] })
    usePlayer.mockReturnValue({
      songs: [],
      volume: 0.5,
      setVolume: vi.fn(),
      totalPlayCount: 0,
      topPlayedSongs: [],
      statsLoading: false,
      statsUnavailable: false,
    })
    useTheme.mockReturnValue({ theme: 'dark', toggleTheme: vi.fn() })
    updateCurrentUserApi.mockImplementation(async ({ name, email }) => ({
      id: 12,
      name,
      email,
      created_at: '2024-01-01T00:00:00.000Z',
    }))
  })

  it('displays the current user name and email', () => {
    renderProfile()

    expect(screen.getByRole('heading', { name: 'Nara Lama' })).toBeInTheDocument()
    expect(screen.getByText('nara@example.com')).toBeInTheDocument()
  })

  it('dispatches the profile update with the edited name', async () => {
    renderProfile()

    fireEvent.change(screen.getByLabelText('Nama'), {
      target: { value: 'Nara Baru' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Simpan profil' }))

    await waitFor(() => {
      expect(updateCurrentUserApi).toHaveBeenCalledWith({
        name: 'Nara Baru',
        email: 'nara@example.com',
      })
    })
  })
})
