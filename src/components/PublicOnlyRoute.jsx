import { Navigate, Outlet } from 'react-router-dom'
import { useSelector } from 'react-redux'

function PublicOnlyRoute() {
  const { token, isInitializing } = useSelector((state) => state.auth)
  if (token && isInitializing) {
    return (
      <main
        className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-200"
        role="status"
        aria-live="polite"
      >
        Memuat sesi pengguna...
      </main>
    )
  }
  return token ? <Navigate to="/" replace /> : <Outlet />
}

export default PublicOnlyRoute
