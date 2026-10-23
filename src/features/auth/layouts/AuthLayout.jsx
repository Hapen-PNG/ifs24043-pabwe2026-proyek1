import { Link, Outlet } from 'react-router-dom'

function AuthLayout() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 text-white">
      <section className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl shadow-black/20 sm:p-8">
        <Link
          to="/"
          className="text-sm font-semibold text-violet-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
        >
          NadaRuang
        </Link>
        <Outlet />
      </section>
    </main>
  )
}

export default AuthLayout
