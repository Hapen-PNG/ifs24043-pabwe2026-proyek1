import { useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import Swal from 'sweetalert2'
import { logout } from '../features/auth/states/action.js'
import { usePlayer } from '../context/PlayerContext.jsx'
import { useTheme } from '../context/ThemeContext.jsx'
import MiniPlayer from './MiniPlayer.jsx'

const links = [
  { to: '/', label: 'Beranda', end: true, icon: '⌂' },
  { to: '/search', label: 'Cari', icon: '⌕' },
  { to: '/library', label: 'Koleksi', icon: '♫' },
  { to: '/profile', label: 'Profil', icon: '◉' },
]

function Layout() {
  const dispatch = useDispatch()
  const user = useSelector((state) => state.users.user)
  const { toggle, seek, currentTime, volume, setVolume } = usePlayer()
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()
  const currentTimeRef = useRef(currentTime)
  const volumeRef = useRef(volume)
  const isHome = location.pathname === '/'
  const themeClass = theme === 'light'
    ? 'light-theme bg-slate-100 text-slate-900'
    : 'bg-slate-950 text-white'

  currentTimeRef.current = currentTime
  volumeRef.current = volume

  useEffect(() => {
    const handleKeyDown = (event) => {
      const target = event.target
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          target.closest(
            'input, button, textarea, select, a[href], [contenteditable], [role="button"], [role="slider"], [role="tab"], [role="combobox"]',
          ))
      ) return
      if (event.altKey || event.ctrlKey || event.metaKey) return

      if (event.code === 'Space') {
        event.preventDefault()
        toggle()
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault()
        seek(currentTimeRef.current - 5)
      } else if (event.key === 'ArrowRight') {
        event.preventDefault()
        seek(currentTimeRef.current + 5)
      } else if (event.key === 'ArrowUp') {
        event.preventDefault()
        setVolume(volumeRef.current + 0.05)
      } else if (event.key === 'ArrowDown') {
        event.preventDefault()
        setVolume(volumeRef.current - 0.05)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [seek, setVolume, toggle])

  const handleLogout = async () => {
    try {
      await dispatch(logout()).unwrap()
      await Swal.fire({
        icon: 'success',
        title: 'Berhasil keluar',
        timer: 1200,
        showConfirmButton: false,
      })
      navigate('/auth/login', { replace: true })
    } catch (error) {
      await Swal.fire({
        icon: 'error',
        title: 'Sesi diakhiri',
        text: error?.message ?? 'Token lokal dihapus, tetapi API gagal mengonfirmasi logout.',
      })
      navigate('/auth/login', { replace: true })
    }
  }

  return (
    <div className={`min-h-screen pb-36 sm:pb-24 ${themeClass}`}>
      <header className="border-b border-slate-800 bg-slate-900/90">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <NavLink to="/" className="text-lg font-bold text-white">
            Nada<span className="text-violet-300">Ruang</span>
          </NavLink>
          <div className="hidden items-center gap-3 sm:flex">
            <span className="max-w-40 truncate text-sm text-slate-400">
              {user?.name}
            </span>
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={`Aktifkan mode ${theme === 'dark' ? 'terang' : 'gelap'}`}
              aria-pressed={theme === 'light'}
              className="rounded-full border border-slate-700 px-3 py-2 text-sm text-slate-200 transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
            >
              {theme === 'dark' ? 'Mode terang' : 'Mode gelap'}
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full border border-slate-700 px-3 py-2 text-sm text-slate-200 transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
            >
              Keluar
            </button>
          </div>
        </div>
      </header>

      <nav
        aria-label="Navigasi utama"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-800 bg-slate-950/95 px-2 pb-[env(safe-area-inset-bottom)] pt-2 backdrop-blur sm:sticky sm:top-0 sm:border-b sm:border-t-0 sm:bg-slate-900/95"
      >
        <div className="mx-auto flex max-w-6xl items-center justify-around gap-1 sm:justify-center sm:gap-8">
          {links.map(({ to, label, end, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex min-w-16 flex-col items-center gap-1 rounded-xl px-3 py-2 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 sm:flex-row sm:text-sm ${
                  isActive
                    ? 'bg-violet-500/15 font-semibold text-violet-200'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <span aria-hidden="true" className="text-lg leading-none">{icon}</span>
              {label}
            </NavLink>
          ))}
          <div className="flex items-center gap-1 sm:hidden">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={`Aktifkan mode ${theme === 'dark' ? 'terang' : 'gelap'}`}
              className="rounded-xl px-2 py-2 text-xs text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
            >
              {theme === 'dark' ? 'Terang' : 'Gelap'}
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-xl px-2 py-2 text-xs text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
            >
              Keluar
            </button>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Outlet />
      </main>
      {!isHome && <MiniPlayer />}
    </div>
  )
}

export default Layout
