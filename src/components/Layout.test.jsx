import { configureStore } from '@reduxjs/toolkit'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Layout from './Layout.jsx'
import { usePlayer } from '../context/PlayerContext.jsx'
import { useTheme } from '../context/ThemeContext.jsx'
import { logout } from '../features/auth/states/action.js'

const { swalFire, loadSweetAlert } = vi.hoisted(() => ({
  swalFire: vi.fn().mockResolvedValue(undefined),
  loadSweetAlert: vi.fn(async () => ({ fire: swalFire })),
}))

vi.mock('../context/PlayerContext.jsx', () => ({ usePlayer: vi.fn() }))
vi.mock('../context/ThemeContext.jsx', () => ({ useTheme: vi.fn() }))
vi.mock('../features/auth/states/action.js', () => ({ logout: vi.fn() }))
vi.mock('../helpers/loadSweetAlert.js', () => ({ default: loadSweetAlert }))
vi.mock('./MiniPlayer.jsx', () => ({ default: () => <div>mini player</div> }))

function LocationText() {
  return <span>route:{useLocation().pathname}</span>
}

function renderLayout(path = '/', logoutResult = () => Promise.resolve()) {
  const store = configureStore({
    reducer: {
      users: (state = { user: { name: 'Ayu' } }) => state,
    },
  })
  logout.mockReturnValue(() => ({ unwrap: logoutResult }))
  const view = render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="*" element={<LocationText />} />
          </Route>
        </Routes>
      </MemoryRouter>
    </Provider>,
  )
  return { ...view, store }
}

describe('Layout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    swalFire.mockResolvedValue(undefined)
    loadSweetAlert.mockResolvedValue({ fire: swalFire })
    usePlayer.mockReturnValue({
      toggle: vi.fn(),
      seek: vi.fn(),
      currentTime: 30,
      volume: 0.5,
      setVolume: vi.fn(),
    })
    useTheme.mockReturnValue({ theme: 'dark', toggleTheme: vi.fn() })
  })

  it('renders navigation, user, theme controls, outlet, and a mini player off home', () => {
    renderLayout('/library')

    expect(screen.getByText('Ayu')).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Navigasi utama' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Beranda/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Cari/ })).toHaveAttribute('href', '/search')
    expect(screen.getByText('route:/library')).toBeInTheDocument()
    expect(screen.getByText('mini player')).toBeInTheDocument()
    expect(document.querySelector('main')).toHaveAttribute('aria-label', 'Konten utama')
  })

  it('hides the mini player at home and toggles the selected theme', () => {
    const toggleTheme = vi.fn()
    useTheme.mockReturnValue({ theme: 'light', toggleTheme })
    renderLayout('/')

    expect(screen.queryByText('mini player')).not.toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Aktifkan mode gelap' })).toHaveLength(2)
    fireEvent.click(screen.getAllByRole('button', { name: 'Aktifkan mode gelap' })[0])
    expect(toggleTheme).toHaveBeenCalledOnce()
  })

  it('handles playback keyboard shortcuts and ignores editable controls and modifiers', () => {
    const player = {
      toggle: vi.fn(),
      seek: vi.fn(),
      currentTime: 30,
      volume: 0.5,
      setVolume: vi.fn(),
    }
    usePlayer.mockReturnValue(player)
    render(
      <Provider store={configureStore({ reducer: { users: (state = { user: null }) => state } })}>
        <MemoryRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<input aria-label="search input" />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </Provider>,
    )

    fireEvent.keyDown(window, { code: 'Space', key: ' ' })
    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    fireEvent.keyDown(window, { key: 'ArrowUp' })
    fireEvent.keyDown(window, { key: 'ArrowDown' })
    expect(player.toggle).toHaveBeenCalledOnce()
    expect(player.seek.mock.calls).toEqual([ [25], [35] ])
    expect(player.setVolume.mock.calls).toEqual([ [0.55], [0.45] ])

    fireEvent.keyDown(screen.getByRole('textbox'), { code: 'Space', key: ' ' })
    fireEvent.keyDown(window, { key: 'ArrowLeft', ctrlKey: true })
    expect(player.toggle).toHaveBeenCalledOnce()
    expect(player.seek).toHaveBeenCalledTimes(2)
  })

  it('confirms successful logout and navigates to login', async () => {
    renderLayout('/')

    fireEvent.click(screen.getAllByRole('button', { name: 'Keluar' })[0])
    await waitFor(() => expect(swalFire).toHaveBeenCalledWith({
      icon: 'success',
      title: 'Berhasil keluar',
      timer: 1200,
      showConfirmButton: false,
    }))
    expect(logout).toHaveBeenCalledOnce()
  })

  it('reports a logout failure and still navigates to login', async () => {
    renderLayout('/', () => Promise.reject(new Error('offline')))

    fireEvent.click(screen.getAllByRole('button', { name: 'Keluar' })[0])
    await waitFor(() => expect(swalFire).toHaveBeenCalledWith({
      icon: 'error',
      title: 'Sesi diakhiri',
      text: 'offline',
    }))
  })
})
