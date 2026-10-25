import { Link, Outlet } from 'react-router-dom'

function AuthLayout() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="px-4 py-6">
        <nav aria-label="Navigasi autentikasi" className="mx-auto max-w-md">
          <Link
            to="/"
            className="text-sm font-semibold text-violet-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
          >
            NadaRuang
          </Link>
        </nav>
      </header>
      <main
        id="main-content"
        aria-label="Konten autentikasi"
        className="flex min-h-[calc(100vh-4.5rem)] items-center justify-center px-4 py-8"
      >
        <section className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl shadow-black/20 sm:p-8">
          <Outlet />
        </section>
      </main>
    </div>
  )
}

export default AuthLayout
