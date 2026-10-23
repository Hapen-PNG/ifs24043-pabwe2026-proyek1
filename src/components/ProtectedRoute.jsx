import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'

function ProtectedRoute() {
  const { token, isInitializing } = useSelector((state) => state.auth)
  const location = useLocation()

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

  return token ? (
    <Outlet />
  ) : (
    <Navigate to="/auth/login" replace state={{ from: location }} />
  )
}

export default ProtectedRoute
