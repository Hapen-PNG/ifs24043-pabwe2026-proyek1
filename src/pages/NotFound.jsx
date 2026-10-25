import { Link } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext.jsx'

function NotFound() {
  const { theme } = useTheme()

  return (
    <div className={`min-h-screen ${theme === 'light' ? 'light-theme bg-slate-100 text-slate-900' : 'bg-slate-950 text-white'}`}>
      <header className="border-b border-slate-800 bg-slate-900/90">
        <nav aria-label="Navigasi halaman kesalahan" className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
          <Link to="/" className="text-lg font-bold text-white focus-visible:outline-none">
            Nada<span className="text-violet-300">Ruang</span>
          </Link>
        </nav>
      </header>
      <main
        id="main-content"
        aria-label="Halaman tidak ditemukan"
        className="flex min-h-[calc(100vh-4.5rem)] items-center justify-center px-4 py-8 text-center"
      >
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-300">404</p>
          <h1 className="mt-3 text-3xl font-bold">Halaman tidak ditemukan</h1>
          <p className="mt-3 text-slate-400">Alamat yang Anda buka tidak tersedia.</p>
          <Link
            to="/"
            className="mt-6 inline-flex rounded-full bg-violet-400 px-5 py-3 font-semibold text-slate-950 transition-colors hover:bg-violet-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            Kembali ke beranda
          </Link>
        </div>
      </main>
    </div>
  )
}

export default NotFound
