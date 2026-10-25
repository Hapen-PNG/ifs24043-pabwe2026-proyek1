import { Navigate, Outlet } from 'react-router-dom'
import { useSelector } from 'react-redux'

function PublicOnlyRoute() {
  const { token, isInitializing } = useSelector((state) => state.auth)
  if (token && isInitializing) {
    return (
      <main
        className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-200"
      >
        <h1 aria-live="polite" className="text-sm font-normal">
          Memuat sesi pengguna...
        </h1>
      </main>
    )
  }
  return token ? <Navigate to="/" replace /> : <Outlet />
}

export default PublicOnlyRoute
