import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const returnTo = location.state?.from?.pathname || '/'

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      await login(email, password)
      navigate(returnTo, { replace: true })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Gagal masuk. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 text-white">
      <section className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl shadow-black/20 sm:p-8">
        <Link to="/" className="text-sm font-semibold text-violet-300">NadaRuang</Link>
        <h1 className="mt-6 text-3xl font-bold">Selamat datang kembali</h1>
        <p className="mt-2 text-sm text-slate-400">Masuk untuk melanjutkan musikmu.</p>
        <p className="mt-5 rounded-xl bg-violet-400/10 p-3 text-sm text-violet-200">
          Akun demo: <strong>demo@musik.com</strong> / <strong>demo123</strong>
        </p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <label htmlFor="login-email" className="block text-sm font-medium text-slate-200">Email</label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-500 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400/40"
            />
          </div>
          <div>
            <label htmlFor="login-password" className="block text-sm font-medium text-slate-200">Kata sandi</label>
            <div className="mt-2 flex rounded-xl border border-slate-700 bg-slate-950 focus-within:border-violet-400 focus-within:ring-2 focus-within:ring-violet-400/40">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                minLength={6}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="min-w-0 flex-1 rounded-l-xl bg-transparent px-4 py-3 text-white focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((shown) => !shown)}
                aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                aria-pressed={showPassword}
                className="rounded-r-xl px-3 text-sm text-violet-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
              >
                {showPassword ? 'Sembunyikan' : 'Tampilkan'}
              </button>
            </div>
          </div>
          <p role="alert" aria-live="polite" className="min-h-5 text-sm text-rose-300">{error}</p>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-violet-400 px-4 py-3 font-semibold text-slate-950 transition-colors hover:bg-violet-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:cursor-wait disabled:opacity-60"
          >
            {loading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-400">
          Belum memiliki akun?{' '}
          <Link to="/register" className="font-semibold text-violet-300 hover:text-violet-200 focus-visible:outline-none focus-visible:underline">
            Daftar
          </Link>
        </p>
      </section>
    </main>
  )
}

export default Login
