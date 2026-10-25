import { configureStore } from '@reduxjs/toolkit'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useLibrary } from '../context/LibraryContext.jsx'
import { usePlayer } from '../context/PlayerContext.jsx'
import { useTheme } from '../context/ThemeContext.jsx'
import userReducer from '../features/users/states/reducer.js'
import Profile from './Profile.jsx'

const {
  updateCurrentUserApi,
  updateCurrentUserPhotoApi,
  changePasswordApi,
  logoutApi,
  clearSearchApi,
  swalFire,
} = vi.hoisted(() => ({
  updateCurrentUserApi: vi.fn(),
  updateCurrentUserPhotoApi: vi.fn(),
  changePasswordApi: vi.fn(),
  logoutApi: vi.fn(),
  clearSearchApi: vi.fn(),
  swalFire: vi.fn(),
}))

vi.mock('../features/users/api/userApi.js', () => ({
  getCurrentUserApi: vi.fn(),
  updateCurrentUserApi,
  updateCurrentUserPhotoApi,
}))
vi.mock('../features/auth/api/authApi.js', () => ({
  changePasswordApi,
  loginApi: vi.fn(),
  logoutApi,
  registerApi: vi.fn(),
}))
vi.mock('../features/activity/api/activityApi.js', () => ({
  addRecentApi: vi.fn(),
  addSearchApi: vi.fn(),
  clearSearchApi,
  getRecentApi: vi.fn(),
  getSearchHistoryApi: vi.fn(),
  getStatsApi: vi.fn(),
  recordPlayApi: vi.fn(),
  removeSearchApi: vi.fn(),
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

function LocationDisplay() {
  const location = useLocation()
  return <p>location:{location.pathname}</p>
}

function renderProfile({
  user = {
    id: 12,
    name: 'Nara Lama',
    email: 'nara@example.com',
    created_at: '2024-01-01T00:00:00.000Z',
  },
  status = 'idle',
  error = null,
} = {}) {
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
        user,
        status,
        error,
      },
    },
  })

  return render(
    <Provider store={store}>
      <MemoryRouter>
        <Profile />
        <LocationDisplay />
      </MemoryRouter>
    </Provider>,
  )
}

describe('Profile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    updateCurrentUserPhotoApi.mockImplementation(async (photo) => ({
      id: 12,
      name: 'Nara Lama',
      email: 'nara@example.com',
      photo: `uploads/${photo.name}`,
    }))
    changePasswordApi.mockResolvedValue({ message: 'password changed' })
    logoutApi.mockResolvedValue({ message: 'logged out' })
    clearSearchApi.mockResolvedValue({ message: 'history cleared' })
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
    swalFire.mockResolvedValue({})
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
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'baru@example.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Simpan profil' }))

    await waitFor(() => {
      expect(updateCurrentUserApi).toHaveBeenCalledWith({
        name: 'Nara Baru',
        email: 'baru@example.com',
      })
    })
  })

  it('shows profile and user-loading errors without enabling submission', () => {
    renderProfile({ status: 'loading', error: 'Gagal memuat profil' })

    expect(screen.getByRole('alert')).toHaveTextContent('Gagal memuat profil')
    expect(screen.getByRole('button', { name: 'Menyimpan...' })).toBeDisabled()
    expect(screen.getByLabelText('Foto profil')).toBeDisabled()
  })

  it('reports rejected profile updates and displays API error details', async () => {
    updateCurrentUserApi.mockRejectedValueOnce(new Error('Nama tidak dapat dipakai'))
    renderProfile()
    fireEvent.change(screen.getByLabelText('Nama'), { target: { value: 'Nama Baru' } })
    fireEvent.click(screen.getByRole('button', { name: 'Simpan profil' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Nama tidak dapat dipakai')
    await waitFor(() => expect(swalFire).toHaveBeenCalledWith({
      icon: 'error',
      title: 'Profil gagal diperbarui',
      text: 'Nama tidak dapat dipakai',
    }))
  })

  it('uploads a profile photo, clears the file input, and reports failures', async () => {
    renderProfile()
    const photoInput = screen.getByLabelText('Foto profil')
    const photo = new File(['image'], 'avatar.png', { type: 'image/png' })
    fireEvent.change(photoInput, { target: { files: [photo] } })

    expect(await screen.findByText('Foto profil berhasil diperbarui.')).toBeInTheDocument()
    expect(updateCurrentUserPhotoApi).toHaveBeenCalledWith(photo)
    expect(photoInput.value).toBe('')

    updateCurrentUserPhotoApi.mockRejectedValueOnce(new Error('Foto ditolak'))
    fireEvent.change(photoInput, {
      target: { files: [new File(['image'], 'bad.png', { type: 'image/png' })] },
    })
    expect(await screen.findByRole('alert')).toHaveTextContent('Foto ditolak')
  })

  it('changes the password and displays a failure returned by the API', async () => {
    renderProfile()
    fireEvent.change(screen.getByLabelText('Kata sandi lama'), { target: { value: 'old-pass' } })
    fireEvent.change(screen.getByLabelText('Kata sandi baru'), { target: { value: 'new-pass' } })
    fireEvent.change(screen.getByLabelText('Konfirmasi kata sandi'), { target: { value: 'new-pass' } })
    fireEvent.click(screen.getByRole('button', { name: 'Ganti kata sandi' }))

    expect(await screen.findByText('Kata sandi berhasil diganti.')).toBeInTheDocument()
    expect(changePasswordApi).toHaveBeenCalledWith({
      password: 'old-pass',
      newPassword: 'new-pass',
      newPasswordConfirmation: 'new-pass',
    })
    expect(screen.getByLabelText('Kata sandi lama')).toHaveValue('')

    changePasswordApi.mockRejectedValueOnce(new Error('Password lama salah'))
    fireEvent.change(screen.getByLabelText('Kata sandi lama'), { target: { value: 'wrong' } })
    fireEvent.change(screen.getByLabelText('Kata sandi baru'), { target: { value: 'new-pass' } })
    fireEvent.change(screen.getByLabelText('Konfirmasi kata sandi'), { target: { value: 'new-pass' } })
    fireEvent.click(screen.getByRole('button', { name: 'Ganti kata sandi' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Password lama salah')
  })

  it('clears search history only for a signed-in user and handles API failure', async () => {
    const { unmount } = renderProfile({ user: null })
    fireEvent.click(screen.getByRole('button', { name: 'Hapus riwayat pencarian' }))
    expect(clearSearchApi).not.toHaveBeenCalled()
    unmount()

    renderProfile()
    fireEvent.click(screen.getByRole('button', { name: 'Hapus riwayat pencarian' }))
    expect(await screen.findByText('Riwayat pencarian berhasil dihapus.')).toBeInTheDocument()
    expect(clearSearchApi).toHaveBeenCalledOnce()
  })

  it('shows unavailable history feedback and handles logout success and failure', async () => {
    clearSearchApi.mockRejectedValueOnce(new Error('offline'))
    renderProfile()
    fireEvent.click(screen.getByRole('button', { name: 'Hapus riwayat pencarian' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Data belum dapat dimuat')

    fireEvent.click(screen.getByRole('button', { name: 'Keluar' }))
    await waitFor(() => expect(screen.getByText('location:/auth/login')).toBeInTheDocument())
    expect(logoutApi).toHaveBeenCalledOnce()

    logoutApi.mockRejectedValueOnce(new Error('Logout gagal'))
    fireEvent.click(screen.getByRole('button', { name: 'Keluar' }))
    await waitFor(() => expect(swalFire).toHaveBeenCalledWith({
      icon: 'error',
      title: 'Sesi diakhiri',
      text: 'Logout gagal',
    }))
  })

  it('renders empty statistics and avatar fallbacks, and controls theme and volume', () => {
    const setVolume = vi.fn()
    usePlayer.mockReturnValue({
      songs: [],
      volume: 0.5,
      setVolume,
      totalPlayCount: 0,
      topPlayedSongs: [],
      statsLoading: true,
      statsUnavailable: true,
    })
    const toggleTheme = vi.fn()
    useTheme.mockReturnValue({ theme: 'light', toggleTheme })
    renderProfile({ user: { id: 12, name: 'Nara Lama', email: 'nara@example.com' } })

    expect(screen.getByRole('status', { name: 'Memuat statistik' })).toBeInTheDocument()
    expect(screen.getByText('Belum ada data pemutaran.')).toBeInTheDocument()
    expect(screen.getByText('Data belum dapat dimuat')).toBeInTheDocument()
    expect(screen.getByText('Bergabung Tidak tersedia')).toBeInTheDocument()
    expect(screen.getByText('Mode terang')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Ganti tema' }))
    fireEvent.change(screen.getByLabelText('Volume bawaan'), { target: { value: '0.8' } })
    expect(toggleTheme).toHaveBeenCalledOnce()
    expect(setVolume).toHaveBeenCalledWith(0.8)

    fireEvent.error(screen.getByRole('img', { name: 'Avatar default' }))
    expect(screen.getByLabelText('Avatar NL')).toHaveTextContent('NL')
  })

  it('maps valid play statistics to available songs and skips missing song ids', () => {
    usePlayer.mockReturnValue({
      songs: [{ id: 4, title: 'Malam Tenang', artist: 'Nara' }],
      volume: 0.7,
      setVolume: vi.fn(),
      totalPlayCount: 12,
      topPlayedSongs: [
        { id: '4', count: 8 },
        { id: 'missing', count: 3 },
      ],
      statsLoading: false,
      statsUnavailable: false,
    })
    renderProfile()

    expect(screen.getByText('Malam Tenang')).toBeInTheDocument()
    expect(screen.getByText('8 kali')).toBeInTheDocument()
    expect(screen.queryByText('3 kali')).not.toBeInTheDocument()
    expect(screen.getByText('12')).toBeInTheDocument()
  })
})
