import { lazy, Suspense, useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { fetchCurrentUser } from './features/users/states/action.js'

const Layout = lazy(() => import('./components/Layout.jsx'))
const ProtectedRoute = lazy(() => import('./components/ProtectedRoute.jsx'))
const PublicOnlyRoute = lazy(() => import('./components/PublicOnlyRoute.jsx'))
const ProtectedApp = lazy(() => import('./components/ProtectedApp.jsx'))
const AuthLayout = lazy(() => import('./features/auth/layouts/AuthLayout.jsx'))
const LoginPage = lazy(() => import('./features/auth/pages/LoginPage.jsx'))
const RegisterPage = lazy(() => import('./features/auth/pages/RegisterPage.jsx'))
const Home = lazy(() => import('./pages/Home.jsx'))
const Library = lazy(() => import('./pages/Library.jsx'))
const NotFound = lazy(() => import('./pages/NotFound.jsx'))
const Profile = lazy(() => import('./pages/Profile.jsx'))
const Search = lazy(() => import('./pages/Search.jsx'))

function App() {
  const dispatch = useDispatch()
  const location = useLocation()
  const { token, isInitializing } = useSelector((state) => state.auth)
  const requestedProfile = useRef(false)

  useEffect(() => {
    const titles = {
      '/': 'Beranda | NadaRuang',
      '/search': 'Pencarian | NadaRuang',
      '/library': 'Perpustakaan | NadaRuang',
      '/profile': 'Profil | NadaRuang',
      '/auth/login': 'Masuk | NadaRuang',
      '/auth/register': 'Daftar | NadaRuang',
      '/404': 'Halaman tidak ditemukan | NadaRuang',
    }
    document.title = titles[location.pathname] ?? 'Halaman tidak ditemukan | NadaRuang'
  }, [location.pathname])

  useEffect(() => {
    if (token && isInitializing && !requestedProfile.current) {
      requestedProfile.current = true
      dispatch(fetchCurrentUser())
    }
    if (!token) requestedProfile.current = false
  }, [dispatch, token, isInitializing])

  return (
    <Suspense
      fallback={
        <main
          role="status"
          aria-live="polite"
          className="min-h-screen bg-slate-950 p-6 text-sm text-slate-200"
        >
          Memuat halaman…
        </main>
      }
    >
      <Routes>
        <Route element={<PublicOnlyRoute />}>
          <Route path="/auth" element={<AuthLayout />}>
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
          </Route>
        </Route>
        <Route element={<ProtectedRoute />}>
          <Route element={<ProtectedApp />}>
            <Route element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="/search" element={<Search />} />
              <Route path="/library" element={<Library />} />
              <Route path="/profile" element={<Profile />} />
            </Route>
          </Route>
        </Route>
        <Route path="/404" element={<NotFound />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </Suspense>
  )
}

export default App
