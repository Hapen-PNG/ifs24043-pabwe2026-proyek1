import { Suspense } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'

function AuthLayout() {
  const { pathname } = useLocation()
  const pageTitle = pathname === '/auth/register' ? 'Daftar' : 'Masuk'

  return (
    <div className="auth-critical-shell min-h-screen bg-slate-950 text-white">
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
        className="auth-critical-main flex min-h-[calc(100vh-4.5rem)] items-center justify-center px-4 py-8"
      >
        <section className="auth-critical-card w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl shadow-black/20 sm:p-8">
          <h1 className="mt-6 text-3xl font-bold">{pageTitle}</h1>
          <Suspense
            fallback={
              <div role="status" aria-live="polite" className="mt-4 text-sm text-slate-200">
                Memuat halaman…
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </section>
      </main>
    </div>
  )
}

export default AuthLayout
