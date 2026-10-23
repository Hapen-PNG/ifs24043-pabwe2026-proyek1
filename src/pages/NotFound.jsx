import { Link } from 'react-router-dom'

function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-center text-white">
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
  )
}

export default NotFound
