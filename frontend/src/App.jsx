import { useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import PublicOnlyRoute from './components/PublicOnlyRoute.jsx'
import AuthLayout from './features/auth/layouts/AuthLayout.jsx'
import LoginPage from './features/auth/pages/LoginPage.jsx'
import RegisterPage from './features/auth/pages/RegisterPage.jsx'
import { fetchCurrentUser } from './features/users/states/action.js'
import Home from './pages/Home.jsx'
import Library from './pages/Library.jsx'
import NotFound from './pages/NotFound.jsx'
import Profile from './pages/Profile.jsx'
import Search from './pages/Search.jsx'

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
    <Routes>
      <Route element={<PublicOnlyRoute />}>
        <Route path="/auth" element={<AuthLayout />}>
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
        </Route>
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/library" element={<Library />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Route>
      <Route path="/404" element={<NotFound />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  )
}

export default App
